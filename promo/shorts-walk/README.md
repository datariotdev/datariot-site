# Short: "Click"

20.5 s vertical (1080×1920, 30 fps) cartoon for Shorts / Reels / TikTok, in the
Red Bull-ad tradition: flat colour, black ink outlines, one gag, a tagline.

- Sky = the logo's ice `#DAE6F7`, ink = the logo's black `#07080C`. Nothing else.
- A guy walks happily, whistling. A "?" pops, he stops and looks up. The logo comes
  down like a sun, the "?" flips to "!" — **CLICK!** (a thought clicking, a camera
  shutter). Doodled ideas spring out of his head (bulb, gear, atom, chart), he
  walks on, the tagline types out, the iris closes on the logo end card.
- Beats are on a 120 bpm grid: footsteps land on the beats, the click on beat 14.

Files: `scene.html` (deterministic canvas renderer, `renderFrame(t)`), `render.cjs`
(Playwright → PNG frames), `audio.py` (synthesised soundtrack, numpy only — no
samples or licences), `build.sh` (frames + audio → mp4), `datariot-short-walk.mp4`.

`./build.sh` rebuilds it. `node render.cjs out --only 1.5,7.1` renders single
frames for a quick look. On-screen text is in `scene.html` (`overlays`,
`drawTagline`, `endCard`).
