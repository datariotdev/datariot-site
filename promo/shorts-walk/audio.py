"""Synthesised soundtrack for the DATARIOT short (no samples, no licences).
Same clock as scene.html: 120 bpm, so one beat = 0.5 s.
    python3 -I audio.py out.wav
"""
import sys
import numpy as np

SR = 44100
DUR = 20.5
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
B = 0.5
T_Q, T_SUN, T_BANG, T_OUT, T_TAG, T_IRIS, T_CARD = 4.5, 5.4, 7.0, 12.0, 12.4, 15.4, 16.7
ICONS = [8.0, 9.0, 10.0, 11.0]

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def put(sig, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i >= N or i < 0: return
    s = sig[: N - i] * gain
    L[i:i + len(s)] += s * (1 - max(0, pan)); R[i:i + len(s)] += s * (1 + min(0, pan))
def add(*xs):
    n = max(len(x) for x in xs); out = np.zeros(n)
    for x in xs: out[:len(x)] += x
    return out
def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=0.003, r=None, curve=3.0):
    n = int(d * SR); r = r if r is not None else d - a
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    nr = max(1, min(n, int(r * SR))); e[n - nr:] *= np.linspace(1, 0, nr) ** curve
    return e
def sine(f, d): return np.sin(2 * np.pi * f * tt(d))
def square(f, d, duty=0.5):
    p = (f * tt(d)) % 1.0; return np.where(p < duty, 1.0, -1.0)
def tri(f, d):
    p = (f * tt(d)) % 1.0; return 4 * np.abs(p - 0.5) - 1
def noise(d): return rng.uniform(-1, 1, int(d * SR))
def lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y
def hp(x, fc): return x - lp(x, fc)

# ---- instruments ----
def pluck(m, d=0.3, duty=0.25, g=0.5): return square(hz(m), d, duty) * env(d, 0.002, d) * g
def bass(m, d=0.22): return (tri(hz(m), d) * 0.9 + square(hz(m), d, .5) * .15) * env(d, 0.004, d * .7) * 0.9
def kick(d=0.28):
    t = tt(d); f = 45 + 110 * np.exp(-t * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 11) * 1.1
def snare(d=0.2): return (hp(noise(d), 1500) * 0.8 + sine(190, d) * 0.5) * np.exp(-tt(d) * 24)
def hat(d=0.05, o=False):
    d = 0.18 if o else d; return hp(noise(d), 6500) * np.exp(-tt(d) * (22 if o else 85)) * 0.5
def wood(f=880, d=0.07): return sine(f, d) * np.exp(-tt(d) * 70)
def bell(f, d=1.4, g=0.5):
    t = tt(d); x = sine(f, d) + .5 * sine(f * 2.76, d) * np.exp(-t * 6) + .3 * sine(f * 5.4, d) * np.exp(-t * 14)
    return x * np.exp(-t * 3.2) * g
def whistle(m, d, vib=1.0):
    t = tt(d); f = hz(m) * (1 + 0.012 * vib * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t * 6))
    ph = 2 * np.pi * np.cumsum(f) / SR; return (np.sin(ph) + .12 * np.sin(2 * ph)) * env(d, 0.03, 0.08, 1.5) * .42
def whoosh(d, up=True, g=.5):
    n = noise(d); t = tt(d); k = (t / d) if up else (1 - t / d)
    out = np.zeros(len(n)); y = 0.0
    for i in range(len(n)):  # sweeping one-pole lowpass
        fc = 300 + 5200 * k[i] ** 2; a = np.exp(-2 * np.pi * fc / SR); y = (1 - a) * n[i] + a * y; out[i] = y
    return out * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.2 * g * 3.2
def riser(d, g=.5):
    t = tt(d); f = 180 * 2 ** (t / d * 3.2); ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * .6 + hp(noise(d), 2000) * .35 * (t / d)) * (t / d) ** 1.5 * g

# ---- the tune (C major, 120 bpm) ----
CH = [(36, [60, 64, 67, 72]), (31, [59, 62, 67, 71]), (33, [60, 64, 69, 72]), (29, [60, 65, 69, 72])]
def bar_chord(t):
    return CH[int(t // (4 * B)) % 4]

# 0 .. 4.5  whistling walk: wood-block steps, soft shaker, soft bass, whistled tune
MEL = [(0, 76, .5), (.5, 79, .5), (1, 81, .5), (1.5, 79, .5), (2, 76, .5), (2.5, 74, .5), (3, 72, 1.0),
       (4, 74, .5), (4.5, 76, .5), (5, 79, .5), (5.5, 76, .5), (6, 74, .5), (6.5, 72, .5), (7, 76, 1.0)]
for b, m, d in MEL:
    t = b * B
    if t + d * B > T_Q + .1: continue
    w = whistle(m, d * B * .92); put(w, t + .0, 0.15)
for i in range(int(T_Q / B)):
    t = i * B
    put(wood(1000 if i % 2 == 0 else 760), t, 0, .55)                 # footstep
    put(hat() * .35, t + B / 2, .2)
    root = bar_chord(t)[0]; put(bass(root + (12 if i % 2 else 0), .2), t, 0, .35)

# 4.5 .. 7  curiosity: "?" blip, breathing pad, heartbeat, riser into the click
def q_blip():
    d = .5; t = tt(d); f = 520 * 2 ** (np.clip(t - .08, 0, .3) * 2.4)
    ph = 2 * np.pi * np.cumsum(f) / SR; return np.sin(ph) * env(d, .004, .4) * .55
put(q_blip(), T_Q, 0, .8)
for i in range(int((T_BANG - T_Q) / B)):
    t = T_Q + 0.5 + i * B
    if t < T_BANG: put(wood(520, .08) * .6, t, 0, .5)
put(riser(T_BANG - T_SUN - .02, .5), T_SUN, 0, .8)
for k, m in enumerate([72, 76, 79, 84]):                             # rising pluck stairs into the drop
    put(pluck(m, .2, .25, .35), T_BANG - 1.0 + k * B / 2, .1)

# 7.0 click: shutter + bell + boom
put(hp(noise(.03), 800) * np.exp(-tt(.03) * 120), T_BANG - .02, 0, 1.0)
put(hp(noise(.05), 1200) * np.exp(-tt(.05) * 70) * .8, T_BANG + .04, 0, .9)
put(kick(.6) * 1.3, T_BANG, 0, .9)
put(bell(hz(88), 1.6, .55), T_BANG + .02, -.1, 1.0); put(bell(hz(95), 1.4, .35), T_BANG + .02, .1, 1.0)
put(whoosh(.5, False, .45), T_BANG, 0, .8)

# 7 .. 16.5  the groove: kick, clap, hats, bass, arpeggio
t = T_BANG
while t < T_IRIS + 1.0:
    beat = int(round((t - T_BANG) / B))
    root, tones = bar_chord(t - T_BANG)
    if t >= T_BANG + .3 or beat > 0: put(kick() * .85, t, 0, 1.0) if beat > 0 else None
    if beat % 2 == 1: put(snare() * .55, t, 0, 1.0)
    put(hat(o=False) * .8, t, .25, .8); put(hat(o=True) * .55, t + B / 2, -.25, .8)
    put(bass(root, .25), t, 0, 1.0); put(bass(root + 12, .18), t + B / 2, 0, .75)
    for j in range(4):
        m = tones[[0, 1, 2, 3][j] if (beat % 2 == 0) else [3, 2, 1, 0][j]]
        put(pluck(m + 12, .16, .25 if j % 2 == 0 else .5, .32), t + j * B / 4, .3 if j % 2 else -.3)
    t += B

# icon pops (rising blips) + scribble
for k, t0 in enumerate(ICONS):
    m = [84, 88, 91, 96][k]
    put(add(sine(hz(m), .22) * env(.22, .003, .2) * .45, sine(hz(m + 12), .12) * env(.12, .002, .1) * .2), t0, [-.3, .3, -.15, .15][k], 1.0)
    put(hp(noise(.4), 3500) * np.hanning(int(.4 * SR)) * .12, t0 + .1, 0, 1.0)

# 12.0 icons out: whoosh + snare fill
put(whoosh(.45, True, .4), T_OUT - .4, 0, .7)
for i in range(4): put(snare(.12) * (.3 + i * .12), T_OUT - .5 + i * .125, 0, 1.0)

# typing ticks for the tagline (26 chars/s)
for c in range(int((T_IRIS - T_TAG) * 26)):
    tc = T_TAG + c / 26
    if tc > T_IRIS - .3: break
    put(sine(2600 + 120 * (c % 3), .012) * np.exp(-tt(.012) * 220), tc, 0, .22)

# 15.4 iris-out: falling "bwooop"
d = 1.2; t = tt(d); f = 700 * np.exp(-t * 2.4) + 60; ph = 2 * np.pi * np.cumsum(f) / SR
put(np.sin(ph) * env(d, .01, .5) * .5, T_IRIS, 0, .9)

# 16.7 end sting: three-note chime up + chord pad + sub
for k, m in enumerate([84, 88, 91]):
    put(bell(hz(m), 1.8, .5), T_CARD + k * .22, [-.2, 0, .2][k], 1.0)
put(bell(hz(96), 2.6, .45), T_CARD + .66, 0, 1.0)
put(kick(.7) * 1.2, T_CARD + .66, 0, .8)
for m in [48, 55, 60, 64, 67]:
    d = DUR - T_CARD - .4; pad = (tri(hz(m), d) + .5 * tri(hz(m) * 1.003, d)) * env(d, .3, 1.5, 1.5) * .09
    put(pad, T_CARD + .6, 0, 1.0)

# ---- master ----
mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.1)
fade = np.ones(N); nf = int(.5 * SR); fade[-nf:] = np.linspace(1, 0, nf); mix *= fade[:, None]
mix *= 0.89 / np.max(np.abs(mix))
out = (mix * 32767).astype('<i2')
import wave
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('wrote', sys.argv[1], f'{DUR}s')
