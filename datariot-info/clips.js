/* ==========================================================================
   Datariot — the feed
   The hero phone plays a real clip from the app and keeps the screen around
   it alive: progress, counters, reactions, a comment being typed, the light
   of the clip spilling into the screen. Section 01 lays out a reel of short
   clips that each make one point, built from real frames in the app and
   explainers filmed as screen recordings; slide 04 takes a vote; between
   them a camera-spider reels the clip with a point up into its web; 06's
   globe turns. The spider, the web and the globe are pixel canvases;
   everything else is DOM and CSS.
   ========================================================================== */
(function () {
    'use strict';

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Does this machine draw the page in software? Firefox on Linux without a
    // blessed GPU driver, virtual machines and old laptops composite on the
    // CPU, where every moving layer costs a full repaint of its area. They
    // get html.gfx-lite: the same page with the per-frame extras switched
    // off (style.css, PERFORMANCE). The tells: no WebGL context without a
    // "major performance caveat", or a renderer that names a software
    // rasteriser.
    var gfxLite = (function () {
        try {
            var gl = document.createElement('canvas').getContext('webgl', { failIfMajorPerformanceCaveat: true });
            if (!gl) return true;
            var info = gl.getExtension('WEBGL_debug_renderer_info');
            var name = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
            var lose = gl.getExtension('WEBGL_lose_context');
            if (lose) lose.loseContext();
            return /swiftshader|llvmpipe|softpipe|software|basic render|lavapipe/i.test(name);
        } catch (e) { return true; }
    })();
    if (gfxLite) document.documentElement.classList.add('gfx-lite');

    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
    }

    var ICON = {
        reply: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.8" y="6.4" width="12.4" height="11.2" rx="3"/><path d="M15.2 10.6 21 7.4v9.2l-5.8-3.2z"/></svg>'
    };

    // ---------- the hero phone: a real clip from the app ----------
    function initPhone() {
        var app = document.getElementById('heroApp');
        if (!app) return;
        var show = document.getElementById('heroPhone') || app;
        var video = app.querySelector('video');
        var canvas = app.querySelector('.hx-app__amb');
        // the clip's light follows the clip only where blurs are cheap; on a
        // software compositor the blurred poster under it stands in
        var ctx = canvas && !gfxLite && canvas.getContext('2d');
        var bar = app.querySelector('.hx-app__bar i');
        var time = app.querySelector('[data-time]');
        var like = app.querySelector('.hx-app__act--like');
        var likeN = app.querySelector('[data-count="like"]');
        var comN = app.querySelector('[data-count="comment"]');
        var pop = app.querySelector('.hx-app__pop');
        var input = app.querySelector('.hx-app__input');
        var typed = app.querySelector('[data-typing]');
        var clock = show.querySelector('[data-live]');
        var reply = show.querySelector('.hero__float--reply');
        var verdict = show.querySelector('.hero__float--verdict');
        var scanN = show.querySelector('[data-scan]');
        if (!video) return;

        var likes = 3128, comments = 842, live = 47, scan = 0, scanTo = 92;
        var COMMENTS = ['Both. Logic first.', 'Depends on the stakes', 'Feelings are data too'];
        var pass = 0, lastT = 0, raf = 0, lastAmb = 0, running = false, visible = false, tick = 0, typing = 0;
        var lastLabel = '', lastScan = -1;

        function fmt(t) { t = Math.max(0, Math.floor(t)); return Math.floor(t / 60) + ':' + (t % 60 < 10 ? '0' : '') + (t % 60); }
        function two(n) { return (n < 10 ? '0' : '') + n; }
        function num(n) { return n.toLocaleString('en-US'); }
        function restart(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
        function on(el, yes) { if (el) el.classList.toggle('is-on', yes); }

        function react() {
            likes += 1 + Math.floor(Math.random() * 3);
            if (likeN) likeN.textContent = num(likes);
            restart(like, 'is-pop');
            restart(pop, 'is-pop');
        }

        function comment() {
            if (!input || !typed) return;
            var text = COMMENTS[pass % COMMENTS.length], k = 0;
            clearInterval(typing); clearTimeout(typing);
            input.classList.remove('is-sent');
            input.classList.add('is-typing');
            typed.textContent = '';
            typing = setInterval(function () {
                typed.textContent = text.slice(0, ++k);
                if (k < text.length) return;
                clearInterval(typing);
                typing = setTimeout(function () {
                    input.classList.add('is-sent');
                    comments++;
                    if (comN) comN.textContent = num(comments);
                    typing = setTimeout(function () {
                        input.classList.remove('is-typing', 'is-sent');
                        typed.textContent = 'Add a comment...';
                    }, 520);
                }, 700);
            }, 70);
        }

        // what happens on every pass of the clip, on the clip's own clock
        var CUES = [
            [0.8, function () { on(reply, true); }],
            [2.2, function () { scanTo = 86 + Math.floor(Math.random() * 10); on(verdict, true); show.style.setProperty('--scan', scanTo); }],
            [4.1, react],
            [6.0, comment],
            [10.2, react],
            [12.8, function () { on(reply, false); on(verdict, false); show.style.setProperty('--scan', 0); }]
        ];

        function frame(now) {
            raf = requestAnimationFrame(frame);
            var d = video.duration || 14.37, t = video.currentTime || 0;
            if (t + 0.25 < lastT) { lastT = 0; pass++; }          // the clip looped
            for (var i = 0; i < CUES.length; i++) {
                if (lastT < CUES[i][0] && t >= CUES[i][0]) CUES[i][1]();
            }
            lastT = t;
            if (bar) bar.style.transform = 'scaleX(' + Math.min(1, t / d).toFixed(4) + ')';
            var label = fmt(t) + ' / ' + fmt(d);
            if (time && label !== lastLabel) time.textContent = lastLabel = label;
            if (scanN) {
                scan += ((verdict && verdict.classList.contains('is-on') ? scanTo : 0) - scan) * 0.07;
                var shown = Math.round(scan);
                if (shown !== lastScan) scanN.textContent = lastScan = shown;
            }
            // the clip's light, four times a second, into a tiny blurred canvas
            // (each new frame re-runs the blur over the whole screen)
            if (ctx && now - lastAmb > 250 && video.readyState >= 2) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                lastAmb = now;
                if (!app.classList.contains('is-live')) app.classList.add('is-live');
            }
        }

        function start() {
            if (running) return;
            running = true;
            var p = video.play();
            if (p && p.catch) p.catch(function () { });
            raf = requestAnimationFrame(frame);
            tick = setInterval(function () {
                live++;
                if (clock) clock.textContent = two(Math.floor(live / 60)) + ':' + two(live % 60);
            }, 1000);
        }

        function stop() {
            running = false;
            video.pause();
            cancelAnimationFrame(raf);
            clearInterval(tick);
        }

        if (reduced) {
            // hold still on the first frame, with the floats in place
            video.removeAttribute('autoplay');
            video.pause();
            on(reply, true);
            on(verdict, true);
            show.style.setProperty('--scan', 92);
            return;
        }

        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            if (visible && !document.hidden) start(); else stop();
        }, { threshold: 0.2 }).observe(app);
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stop(); else if (visible) start();
        });

        // the phone leans toward the cursor; the cards behind lean away
        if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            var hero = document.getElementById('hero') || show, queued = false, px = 0, py = 0;
            hero.addEventListener('pointermove', function (e) {
                var r = show.getBoundingClientRect();
                px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2 + 260)));
                py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2 + 180)));
                if (queued) return;
                queued = true;
                requestAnimationFrame(function () {
                    queued = false;
                    show.style.setProperty('--tx', px.toFixed(3));
                    show.style.setProperty('--ty', py.toFixed(3));
                });
            });
            hero.addEventListener('pointerleave', function () {
                show.style.setProperty('--tx', '0');
                show.style.setProperty('--ty', '0');
            });
        }
    }

    // ---------- section 01: the reel ----------
    // Real frames from clips in the app, and three explainers built the way
    // they are filmed: a screen recording of a chat, a chart, a timer. Every
    // point is checkable; the site sells short videos that leave you knowing
    // something, so the examples have to hold up too.
    var REEL = [
        {
            kind: 'inset', img: 'assets/reel-lidar.jpg', handle: 'Fara', topic: 'Engineering', len: '0:44',
            title: 'How lidar sees the street',
            cap: 'Lidar times <mark>laser pulses</mark>',
            point: 'Lidar times laser pulses as they bounce back and turns the delays into a 3D map.'
        },
        {
            kind: 'chat', handle: 'lena_codes', topic: 'AI', len: '0:45',
            title: 'What an AI chatbot actually does',
            cap: 'it predicts <mark>the next word</mark>',
            point: 'A chatbot predicts likely next words. Facts still need checking.'
        },
        {
            kind: 'video', src: 'assets/hero-clip', handle: 'Fronda', topic: 'Debate', len: '0:14',
            title: 'Should we prioritize logic over emotion?',
            cap: 'logic or <mark>emotion?</mark>', replies: '214 video replies',
            point: 'Emotion tells you what matters; logic tells you what to do about it.'
        },
        {
            kind: 'inset', img: 'assets/reel-bear.jpg', handle: 'Fronda', topic: 'Education', len: '0:31',
            title: 'Polar bears aren’t actually white',
            cap: 'the fur is <mark>see-through</mark>',
            point: 'Their fur is translucent and hollow; it only looks white. The skin underneath is black.'
        },
        {
            kind: 'chart', handle: 'nadia.saves', topic: 'Education', len: '0:49',
            title: 'Compound interest, in one chart',
            cap: 'interest earns <mark>interest</mark>',
            point: 'Interest earns interest, so time does the heavy lifting: $100 at 7% is $761 after 30 years.'
        },
        {
            kind: 'full', img: 'assets/reel-tower.jpg', handle: 'Fronda', topic: 'Engineering', len: '0:38',
            title: 'Why tall towers sway on purpose',
            cap: 'built to <mark>bend a little</mark>',
            point: 'Tall towers are designed to sway a little; flexing absorbs wind that a rigid tower would fight.'
        },
        {
            kind: 'timer', handle: 'aiko.daily', topic: 'Lifestyle', len: '0:27',
            title: 'The 20-20-20 rule for screen eyes',
            cap: 'look <mark>20 feet away</mark>',
            point: 'Every 20 minutes, look 20 feet away for 20 seconds.'
        }
    ];

    // $100 at 7% a year, one point per year for 30 years
    function growthPath(w, h) {
        var pts = [], max = 100 * Math.pow(1.07, 30);
        for (var y = 0; y <= 30; y++) {
            var v = 100 * Math.pow(1.07, y);
            pts.push((y / 30 * w).toFixed(1) + ' ' + (h - v / max * h).toFixed(1));
        }
        return 'M' + pts.join(' L');
    }

    function media(c) {
        if (c.kind === 'video') {
            return '<video class="reel-card__img" muted loop playsinline preload="none" poster="' + c.src + '.jpg">' +
                '<source src="' + c.src + '.webm" type="video/webm"><source src="' + c.src + '.mp4" type="video/mp4"></video>';
        }
        if (c.kind === 'full') {
            return '<img class="reel-card__img reel-card__img--drift" src="' + c.img + '" alt="" loading="lazy" decoding="async">';
        }
        if (c.kind === 'inset') {
            // a landscape clip in a vertical frame: the picture in the middle,
            // its own light behind it, blurred ahead of time (-amb.jpg) so the
            // moving reel carries no live filter
            return '<span class="reel-card__amb" style="background-image:url(\'' + c.img.replace(/\.jpg$/, '-amb.jpg') + '\')"></span>' +
                '<img class="reel-card__inset" src="' + c.img + '" alt="" loading="lazy" decoding="async">';
        }
        if (c.kind === 'chat') {
            return '<div class="rx rx--chat">' +
                '<span class="rx__app">ASSISTANT</span>' +
                '<p class="rx__prompt">The cat sat on the<i></i></p>' +
                '<span class="rx__label">NEXT WORD</span>' +
                '<ol class="rx__bars">' +
                '<li style="--v:.62"><b>mat</b><span><i></i></span><em>62%</em></li>' +
                '<li style="--v:.21"><b>sofa</b><span><i></i></span><em>21%</em></li>' +
                '<li style="--v:.09"><b>roof</b><span><i></i></span><em>9%</em></li>' +
                '</ol></div>';
        }
        if (c.kind === 'chart') {
            var d = growthPath(170, 110);
            return '<div class="rx rx--chart">' +
                '<span class="rx__app">$100 AT 7% A YEAR</span>' +
                '<b class="rx__big">$761</b><span class="rx__sub">after 30 years</span>' +
                '<svg class="rx__plot" viewBox="-4 -6 178 124" aria-hidden="true">' +
                '<path class="rx__grid" d="M0 110H170M0 55H170M0 0H170"/>' +
                '<path class="rx__area" d="' + d + ' L170 110 L0 110Z"/>' +
                '<path class="rx__line" pathLength="1" d="' + d + '"/>' +
                '</svg>' +
                '<span class="rx__axis"><i>YEAR 0</i><i>15</i><i>30</i></span></div>';
        }
        if (c.kind === 'timer') {
            return '<div class="rx rx--timer">' +
                '<span class="rx__app">SCREEN BREAK</span>' +
                '<span class="rx__ring"><svg viewBox="0 0 120 120" aria-hidden="true">' +
                '<circle class="rx__track" cx="60" cy="60" r="52"/><circle class="rx__arc" pathLength="1" cx="60" cy="60" r="52"/></svg>' +
                '<b>20:00</b></span>' +
                '<span class="rx__chips"><i>20 MIN</i><i>20 FT</i><i>20 SEC</i></span></div>';
        }
        return '';
    }

    function reelCard(c, n) {
        return '<figure class="reel-card reel-card--' + c.kind + '" style="--n:' + n + '">' +
            '<div class="reel-card__clip">' +
            '<div class="reel-card__media">' + media(c) + '</div>' +
            '<span class="reel-card__top"><em>' + esc(c.topic.toUpperCase()) + '</em><b>' + c.len + '</b></span>' +
            (c.replies ? '<span class="reel-card__reply">' + ICON.reply + esc(c.replies) + '</span>' : '') +
            '<p class="reel-card__cap">' + c.cap + '</p>' +
            '<div class="reel-card__meta"><span class="reel-card__who"><i></i>@' + esc(c.handle) + '</span>' +
            '<p>' + esc(c.title) + '</p></div>' +
            '<div class="reel-card__prog"><i></i></div>' +
            '</div>' +
            '<figcaption class="reel-card__point"><span>THE POINT</span><p>' + esc(c.point) + '</p></figcaption>' +
            '</figure>';
    }

    function initReel() {
        var track = document.getElementById('reelTrack');
        if (!track) return;
        var html = REEL.map(reelCard).join('');
        // two copies so the marquee can loop without a seam; the copy is hidden from AT
        track.innerHTML = '<div class="reel__set">' + html + '</div><div class="reel__set" aria-hidden="true">' + html + '</div>';

        // the real clip plays only while its card is on screen
        var vids = track.querySelectorAll('video');
        if (!vids.length || reduced || !('IntersectionObserver' in window)) return;
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                var v = e.target;
                if (e.isIntersecting && !document.hidden) {
                    var p = v.play();
                    if (p && p.catch) p.catch(function () { });
                } else {
                    v.pause();
                }
            });
        }, { threshold: 0.3 });
        vids.forEach(function (v) { io.observe(v); });
    }

    // ---------- slide 04: the arena, a vote that works ----------
    function initArena() {
        var ar = document.getElementById('arena');
        if (!ar) return;
        var sides = { 'for': ar.querySelector('.ar-side--for'), 'against': ar.querySelector('.ar-side--against') };
        var barF = ar.querySelector('.ar-bar__for'), barA = ar.querySelector('.ar-bar__against');
        var nF = ar.querySelector('[data-for]'), nA = ar.querySelector('[data-against]');
        var note = ar.querySelector('[data-note]'), status = ar.querySelector('[data-status]');
        var votes = { 'for': 741, 'against': 559 }, mine = null;

        function draw() {
            var total = votes['for'] + votes['against'];
            var pf = Math.round(votes['for'] / total * 100);
            if (barF) barF.style.flexGrow = votes['for'];
            if (barA) barA.style.flexGrow = votes['against'];
            if (nF) nF.textContent = pf + '%';
            if (nA) nA.textContent = (100 - pf) + '%';
            if (note) note.textContent = (mine ? 'YOUR VOTE IS IN' : 'PICK A SIDE') + ' · ' + total.toLocaleString('en-US') + ' VOTES';
            return pf;
        }

        ar.querySelectorAll('.ar-vote').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var side = btn.getAttribute('data-side');
                if (mine === side) return;
                if (mine) votes[mine]--;
                votes[side]++;
                mine = side;
                ar.classList.add('is-voted');
                ['for', 'against'].forEach(function (s) {
                    if (!sides[s]) return;
                    sides[s].classList.toggle('is-picked', s === side);
                    var b = sides[s].querySelector('.ar-vote');
                    if (b) b.setAttribute('aria-pressed', s === side ? 'true' : 'false');
                });
                var pf = draw();
                if (status) status.textContent = 'Your vote is in. ' + pf + '% for, ' + (100 - pf) + '% against.';
            });
        });
        draw();

        // the room keeps voting while the slide is on screen
        if (reduced || !('IntersectionObserver' in window)) return;
        var timer = 0;
        function tick() {
            votes[Math.random() < 0.55 ? 'for' : 'against'] += 1 + Math.floor(Math.random() * 3);
            draw();
        }
        new IntersectionObserver(function (entries) {
            clearInterval(timer);
            if (entries[0].isIntersecting) timer = setInterval(tick, 2400);
        }, { threshold: 0.2 }).observe(ar);
    }

    // ---------- the catch: a camera-spider reels a clip into its web ----------
    // Two pixel canvases drawn at a third of the screen's resolution (half on
    // phones) and scaled up without smoothing, so every line is a run of whole
    // pixels in the logo's two colours. Scroll drives the story; the mouse
    // moves the lens; the legs never quite stop.
    function initCatch() {
        var sec = document.getElementById('catch');
        if (!sec) return;
        var pin = sec.querySelector('.catch__pin');
        var webC = sec.querySelector('.catch__web'), spC = sec.querySelector('.catch__spider');
        var clip = sec.querySelector('.catch__clip'), video = sec.querySelector('.catch__video');
        var feed = sec.querySelector('.catch__feed');
        var readBox = sec.querySelector('.catch__readout'), readout = sec.querySelector('[data-catch-readout]');
        var lines = sec.querySelectorAll('.catch__line');
        var wctx = webC.getContext('2d'), sctx = spC.getContext('2d');
        if (!wctx || !sctx) return;
        sec.classList.add('is-live');

        function rgba(r, g, b) { return (255 << 24 | b << 16 | g << 8 | r) >>> 0; }
        var ICE = rgba(218, 230, 247), BLACK = rgba(7, 8, 12), SHADE = rgba(183, 194, 214), MID = rgba(107, 119, 140), DIM = rgba(58, 66, 82);
        var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
        var lerp = function (a, b, t) { return a + (b - a) * t; };
        var ease = function (t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
        var easeOut = function (t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); };
        var span = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };

        // ----- a tiny raster: whole pixels into a 32-bit buffer -----
        function Raster(ctx) { this.ctx = ctx; }
        Raster.prototype.size = function (w, h) {
            this.w = w; this.h = h;
            this.img = this.ctx.createImageData(w, h);
            this.px = new Uint32Array(this.img.data.buffer);
        };
        Raster.prototype.clear = function () { this.px.fill(0); };
        Raster.prototype.dot = function (x, y, c) {
            x |= 0; y |= 0;
            if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c;
        };
        Raster.prototype.box = function (x, y, s, c) {
            x = Math.round(x - s / 2); y = Math.round(y - s / 2);
            for (var j = 0; j < s; j++) for (var i = 0; i < s; i++) this.dot(x + i, y + j, c);
        };
        // Bresenham, stamped `th` pixels wide; `dash` keeps one pixel in two
        Raster.prototype.line = function (x0, y0, x1, y1, c, th, dash) {
            x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
            var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy, n = 0;
            for (var guard = 0; guard < 4000; guard++) {
                if (!dash || ((x0 + y0) & 1) === 0) { if (th > 1) this.box(x0, y0, th, c); else this.dot(x0, y0, c); }
                if (x0 === x1 && y0 === y1) break;
                var e2 = 2 * err;
                if (e2 >= dy) { err += dy; x0 += sx; }
                if (e2 <= dx) { err += dx; y0 += sy; }
                n++;
            }
        };
        Raster.prototype.poly = function (pts, c) {
            var minY = Infinity, maxY = -Infinity, i;
            for (i = 0; i < pts.length; i++) { minY = Math.min(minY, pts[i][1]); maxY = Math.max(maxY, pts[i][1]); }
            for (var y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
                var xs = [];
                for (i = 0; i < pts.length; i++) {
                    var a = pts[i], b = pts[(i + 1) % pts.length];
                    if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
                }
                xs.sort(function (p, q) { return p - q; });
                for (var k = 0; k + 1 < xs.length; k += 2) for (var x = Math.round(xs[k]); x <= Math.round(xs[k + 1]); x++) this.dot(x, y, c);
            }
        };
        Raster.prototype.oval = function (cx, cy, rx, ry, c) {
            for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
                var u = (x - cx) / rx, v = (y - cy) / ry;
                if (u * u + v * v <= 1) this.dot(x, y, c);
            }
        };
        Raster.prototype.flush = function (box) {
            if (!box) { this.ctx.putImageData(this.img, 0, 0); return; }
            var x = clamp(Math.floor(box[0]), 0, this.w), y = clamp(Math.floor(box[1]), 0, this.h);
            var w = clamp(Math.ceil(box[2]), 0, this.w) - x, h = clamp(Math.ceil(box[3]), 0, this.h) - y;
            if (w > 0 && h > 0) this.ctx.putImageData(this.img, 0, 0, x, y, w, h);
        };

        var web = new Raster(wctx), spi = new Raster(sctx);

        // ----- the noise rushing past -----
        var TAGS = ['RAGE BAIT', 'NO SOURCE', 'JUST VIBES', 'RATIO', '47S OF NOTHING', 'CLICKBAIT', 'HOT TAKE', 'NO POINT'];
        var noise = [];
        TAGS.forEach(function (tag, i) {
            var el = document.createElement('div');
            el.className = 'catch__noise';
            el.innerHTML = '<span>' + tag + '</span>';
            feed.appendChild(el);
            noise.push({ el: el, lane: (i * 0.618) % 1, speed: 0.7 + ((i * 37) % 10) / 14, phase: ((i * 53) % 17) / 17, tilt: ((i * 29) % 9) - 4 });
        });

        // ----- sizes -----
        var vw = 0, vh = 0, S = 3, W = 0, H = 0, mobile = false, cw = 0, ch = 0, clipOff = [0, 0], readOff = [0, 0];
        function resize() {
            vw = pin.clientWidth; vh = pin.clientHeight;
            mobile = vw < 760;
            S = mobile ? 2 : 3;
            W = Math.ceil(vw / S); H = Math.ceil(vh / S);
            [webC, spC].forEach(function (c) {
                c.width = W; c.height = H;
                c.style.width = W * S + 'px'; c.style.height = H * S + 'px';
            });
            web.size(W, H); spi.size(W, H);
            cw = clip.offsetWidth; ch = cw * 16 / 9;
            clipOff = [clip.offsetLeft, clip.offsetTop];
            readOff = readBox ? [readBox.offsetLeft, readBox.offsetTop] : [0, 0];
            noise.forEach(function (n) { n.w = n.el.offsetWidth; n.h = n.w * 16 / 9; n.op = ''; });
            webKey = '';
        }

        // ----- the story, as a function of scroll progress p -----
        var A = 16;                                    // half the cube's width, in canvas pixels
        function scene(p) {
            var cx = mobile ? vw / 2 : vw * 0.62;
            var grabTop = vh * (mobile ? 0.38 : 0.43), endTop = vh * (mobile ? 0.21 : 0.24);
            var top;
            if (p < 0.08) top = vh + 40;
            else if (p < 0.36) top = lerp(vh + 40, grabTop, easeOut(span(p, 0.08, 0.36)));
            else if (p < 0.46) top = grabTop + 7 * Math.sin(Math.PI * span(p, 0.38, 0.46));
            else top = lerp(grabTop, endTop, ease(span(p, 0.46, 0.8)));
            var scale = 1 + 0.14 * ease(span(p, 0.46, 0.8));
            var bodyH = (A + A * 1.15) * S;               // the cube's height on screen
            var onClip = top - bodyH * 0.5 + 6;
            var by = p < 0.38 ? lerp(-vh * 0.22, grabTop - bodyH * 0.5 + 6, ease(span(p, 0, 0.38))) : onClip;
            return { cx: cx, top: top, scale: scale, by: by, grab: ease(span(p, 0.35, 0.44)), web: p, caught: p >= 0.42 };
        }

        // ----- the web: spokes from where the spider ends up, then the spiral -----
        var webKey = '';
        function drawWeb(p, sc) {
            var key = Math.round(p * 400) + ':' + W + 'x' + H;
            if (key === webKey) return;
            webKey = key;
            web.clear();
            var g = span(p, 0.52, 0.76), r = span(p, 0.66, 0.96);
            if (g > 0) {
                var ox = sc.cx / S, oy = (vh * (mobile ? 0.21 : 0.24)) / S - 6;
                var spokes = 14, reach = Math.hypot(W, H), ends = [];
                for (var i = 0; i < spokes; i++) {
                    var a = (i / spokes) * Math.PI * 2 + Math.sin(i * 2.3) * 0.12;
                    var len = reach * easeOut(clamp(g * 1.25 - i * 0.012, 0, 1));
                    ends.push([a, len]);
                    web.line(ox, oy, ox + Math.cos(a) * len, oy + Math.sin(a) * len, ICE, 1, true);
                }
                // spiral rings sag a little between spokes, like silk under weight
                var rings = 9;
                for (var k = 0; k < rings; k++) {
                    var lit = clamp(r * rings - k, 0, 1);
                    if (lit <= 0) break;
                    var rad = 26 * Math.pow(1.38, k);
                    var n = Math.ceil(spokes * lit);
                    for (var j = 0; j < n; j++) {
                        var e0 = ends[j], e1 = ends[(j + 1) % spokes];
                        if (Math.min(e0[1], e1[1]) < rad) continue;
                        var am = (e0[0] + e1[0] + (j === spokes - 1 ? Math.PI * 2 : 0)) / 2, sag = rad * 0.9;
                        var x0 = ox + Math.cos(e0[0]) * rad, y0 = oy + Math.sin(e0[0]) * rad;
                        var x1 = ox + Math.cos(e1[0]) * rad, y1 = oy + Math.sin(e1[0]) * rad;
                        var xm = ox + Math.cos(am) * sag, ym = oy + Math.sin(am) * sag;
                        web.line(x0, y0, xm, ym, k % 2 ? MID : ICE, 1, true);
                        web.line(xm, ym, x1, y1, k % 2 ? MID : ICE, 1, true);
                    }
                }
            }
            web.flush();
        }

        // ----- the spider -----
        var mouse = { x: 0, y: 0, on: false };
        function ik(hx, hy, fx, fy, l1, l2) {
            var dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy);
            d = clamp(d, Math.abs(l1 - l2) + 0.5, l1 + l2 - 0.5);
            var a = Math.atan2(dy, dx), k = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
            var k1 = [hx + Math.cos(a - k) * l1, hy + Math.sin(a - k) * l1], k2 = [hx + Math.cos(a + k) * l1, hy + Math.sin(a + k) * l1];
            var knee = k1[1] < k2[1] ? k1 : k2;           // knees up: that is what makes it read as a spider
            return [knee, [hx + Math.cos(a) * d, hy + Math.sin(a) * d]];
        }

        var GLYPH = [[-2, -1], [-1, -1], [-2, 0], [1, -2], [2, -2], [1, 1], [2, 1], [3, 1], [2, 0], [2, 2], [-1, 2], [0, 2]];
        var lastBox = null;
        function drawSpider(p, sc, t) {
            spi.clear();
            var w = A, d = A / 2, h = A * 1.15;
            var sway = Math.sin(t * 1.3) * (p < 0.38 ? 2 : 0.8) + (mouse.on ? clamp((mouse.x - sc.cx) / vw, -0.5, 0.5) * 6 : 0);
            var cx = sc.cx / S + sway, cy = sc.by / S;
            var y0 = cy - (2 * d + h) / 2;
            var N = [cx, y0], E = [cx + w, y0 + d], Sv = [cx, y0 + 2 * d], Wv = [cx - w, y0 + d];
            var E2 = [E[0], E[1] + h], S2 = [Sv[0], Sv[1] + h], W2 = [Wv[0], Wv[1] + h];

            // the thread, with a bead of light running down it
            for (var y = 0; y < N[1]; y++) spi.dot(N[0], y, (y & 1) ? SHADE : ICE);
            var bead = ((t * 0.5) % 1) * N[1];
            for (var b = 0; b < 3; b++) spi.dot(N[0], bead + b, ICE);

            // legs: hips along the sides, feet hanging loose or gripping the clip
            var l1 = A * 1.4, l2 = A * 1.65;
            var cl = (sc.cx - cw * sc.scale / 2) / S, cr = (sc.cx + cw * sc.scale / 2) / S, ct = sc.top / S, chh = ch * sc.scale / S;
            var falling = p < 0.3 ? 1 - span(p, 0.2, 0.3) : 0;
            var hips = [];
            for (var s = -1; s <= 1; s += 2) for (var k = 0; k < 4; k++) hips.push([s, k]);
            hips.forEach(function (hp, i) {
                var s = hp[0], k = hp[1];
                var hx = cx + s * w * 0.62, hy = cy - h * 0.2 + k * h * 0.2;
                var ang = (-40 + k * 30 + Math.sin(t * 3.1 + i * 1.7) * 5) * Math.PI / 180;
                var R = (l1 + l2) * (0.8 - falling * 0.18);
                if (falling) ang = lerp(ang, (k < 2 ? -70 : 70) * Math.PI / 180, falling * 0.5);
                var fx = hx + s * Math.cos(ang) * R, fy = hy + Math.sin(ang) * R;
                var gx = [cl + 2, cl, cl, cl + (cr - cl) * 0.28][k], gy = [ct + 2, ct + chh * 0.1, ct + chh * 0.22, ct][k];
                if (s > 0) gx = [cr - 2, cr, cr, cr - (cr - cl) * 0.28][k];
                var gi = clamp(sc.grab * 1.5 - k * 0.15, 0, 1);
                gi = gi * gi * (3 - 2 * gi);
                fx = lerp(fx, gx, gi); fy = lerp(fy, gy + Math.sin(t * 2 + i) * 0.6 * gi, gi);
                var leg = ik(hx, hy, fx, fy, l1, l2), knee = leg[0], foot = leg[1];
                spi.line(hx, hy, knee[0], knee[1], BLACK, 5);
                spi.line(knee[0], knee[1], foot[0], foot[1], BLACK, 4);
                spi.line(hx, hy, knee[0], knee[1], ICE, 3);
                spi.line(knee[0], knee[1], foot[0], foot[1], ICE, 2);
                spi.box(knee[0], knee[1], 3, BLACK);
                spi.box(knee[0], knee[1], 1, MID);
                if (gi > 0.95) spi.line(foot[0], foot[1], foot[0], ct, SHADE, 1, true);
            });

            // the body: the logo's camera, lit from the top left
            spi.poly([Wv, Sv, S2, W2], ICE);
            spi.poly([Sv, E, E2, S2], SHADE);
            spi.poly([N, E, Sv, Wv], ICE);
            var tc = [cx, y0 + d], inset = 0.62;
            spi.poly([[cx, tc[1] - d * inset], [cx + w * inset, tc[1]], [cx, tc[1] + d * inset], [cx - w * inset, tc[1]]], BLACK);
            GLYPH.forEach(function (g, i) {
                if ((Math.floor(t * 2) + i) % 7 === 0) return;      // the screen flickers, a pixel at a time
                spi.dot(cx + g[0] * 1.5 + g[1] * 1.5, tc[1] + (g[1] - g[0]) * 0.75, ICE);
            });
            [[N, E], [E, Sv], [Sv, Wv], [Wv, N], [Sv, S2], [E, E2], [Wv, W2], [W2, S2], [S2, E2]].forEach(function (e) {
                spi.line(e[0][0], e[0][1], e[1][0], e[1][1], BLACK, 1);
            });
            // the lens is the eye; it follows the cursor
            var lx = (Wv[0] + Sv[0] + S2[0] + W2[0]) / 4, ly = (Wv[1] + Sv[1] + S2[1] + W2[1]) / 4 + 1;
            var rx = w * 0.4, ry = h * 0.36;
            spi.oval(lx - 3, ly + 2, rx, ry, BLACK);
            spi.oval(lx - 3, ly + 2, rx - 1.5, ry - 1.5, SHADE);
            spi.oval(lx - 1, ly + 1, rx, ry, BLACK);
            spi.oval(lx - 1, ly + 1, rx - 1.5, ry - 1.5, ICE);
            spi.oval(lx - 1, ly + 1, rx * 0.56, ry * 0.56, BLACK);
            var ex = 0, ey = 0;
            if (mouse.on) {
                var mx = mouse.x / S - lx, my = mouse.y / S - ly, ml = Math.hypot(mx, my) || 1;
                ex = mx / ml * Math.min(2, ml / 20); ey = my / ml * Math.min(2, ml / 20);
            } else { ex = Math.sin(t * 0.7) * 1.5; ey = 1; }
            spi.box(lx - 1 + ex, ly + 1 + ey, 2, ICE);
            if (Math.floor(t * 1.6) % 5 !== 0) spi.dot(lx + rx * 0.35, ly - ry * 0.25, ICE);   // a glint that blinks

            // the snap: pixels thrown off as the legs close on the clip
            var k2 = span(p, 0.4, 0.5);
            if (k2 > 0 && k2 < 1) {
                for (var q = 0; q < 22; q++) {
                    var a2 = q * 2.39996, dist = 6 + k2 * (18 + (q % 5) * 6);
                    var px = cx + Math.cos(a2) * dist * 1.6, py = ct + Math.sin(a2) * dist * 0.7;
                    if ((q + Math.floor(k2 * 8)) % 3 !== 0) spi.box(px, py, q % 4 ? 1 : 2, q % 3 ? ICE : SHADE);
                }
            }
            // the spider lives in a column under its thread: upload that, and wherever it was last frame
            var reach = (l1 + l2) * 1.1 + w, ty = Math.max(cy, ct) + chh * 0.35 + reach;
            var box = [cx - reach - 30, 0, cx + reach + 30, ty + 30];
            var both = lastBox ? [Math.min(box[0], lastBox[0]), 0, Math.max(box[2], lastBox[2]), Math.max(box[3], lastBox[3])] : null;
            spi.flush(both);
            lastBox = box;
        }

        // ----- the frame -----
        var p = reduced ? 1 : 0, shown = -1, visible = false, raf = 0, last = 0, drawn = 0, t0 = performance.now(), lastCut = '';
        var READ = ['SCANNING THE FEED', 'POINT FOUND · LQI 92', 'REELING IT IN', 'CAUGHT · 1 CLIP WITH A POINT'];
        function target(r) {
            var run = r.height - vh;
            return run > 0 ? clamp(-r.top / run, 0, 1) : 1;
        }
        function frame(now) {
            raf = 0;
            var dt = Math.min(0.05, (now - (last || now)) / 1000);
            last = now;
            var rect = sec.getBoundingClientRect(), rt = rect.top, goal = target(rect);
            // once the story has settled the legs only idle: twenty frames a second is plenty
            if (!reduced && Math.abs(goal - p) < 0.0005 && now - drawn < 48) { if (visible) raf = requestAnimationFrame(frame); return; }
            drawn = now;
            if (!reduced) p += (goal - p) * (1 - Math.pow(0.86, dt * 60));
            var t = reduced ? 0 : (now - t0) / 1000;
            var sc = scene(p);

            // before the pin engages, keep the noise below the dithered edge the screen dissolves in through
            var cut = 'inset(' + Math.max(0, rt > 0 ? 96 : rt + 96).toFixed(0) + 'px 0 0 0)';
            if (cut !== lastCut) { lastCut = cut; feed.style.clipPath = cut; }

            clip.style.transform = 'translate3d(' + (sc.cx - cw / 2 - clipOff[0]).toFixed(1) + 'px,' +
                (sc.top - clipOff[1]).toFixed(1) + 'px,0) scale(' + sc.scale.toFixed(4) + ')';
            sec.classList.toggle('is-caught', sc.caught);

            noise.forEach(function (n, i) {
                var laneX = mobile ? n.lane * vw : (n.lane < 0.5 ? n.lane * 0.9 : 0.45 + n.lane * 0.55) * vw;
                var nh = n.h, travel = vh + nh * 2;
                var drift = (t * 22 + p * vh * 2.2) * n.speed;
                var y = ((n.phase * travel - drift) % travel + travel) % travel - nh;
                var after = span(p, 0.45, 0.7);
                n.el.style.transform = 'translate3d(' + (laneX - n.w / 2).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + (n.tilt * (1 + after * 3)).toFixed(1) + 'deg)';
                var op = (0.85 - after * 0.55).toFixed(2);
                if (op !== n.op) { n.op = op; n.el.style.opacity = op; }
            });

            var stage = p < 0.34 ? 0 : p < 0.62 ? 1 : 2;
            if (stage !== shown) {
                shown = stage;
                lines.forEach(function (l, i) { l.classList.toggle('is-on', i === stage); });
            }
            if (readBox && !mobile) {
                var ri = p < 0.36 ? 0 : p < 0.5 ? 1 : p < 0.8 ? 2 : 3;
                var txt = READ[ri] + (ri === 0 ? ' · ' + (2481 + Math.floor(p * 9000 + t * 3)).toLocaleString('en-US') : '');
                if (readout.textContent !== txt) readout.textContent = txt;
                readBox.style.transform = 'translate3d(' + (sc.cx + cw * sc.scale / 2 + 24 - readOff[0]).toFixed(1) + 'px,' +
                    (Math.min(sc.top, vh * 0.8) + 24 - readOff[1]).toFixed(1) + 'px,0)';
            }
            drawWeb(p, sc);
            drawSpider(p, sc, t);
            if (!reduced && visible) raf = requestAnimationFrame(frame);
        }
        function kick() { if (!raf) raf = requestAnimationFrame(frame); }

        resize();
        window.addEventListener('resize', function () { resize(); kick(); });
        pin.addEventListener('pointermove', function (e) {
            var r = pin.getBoundingClientRect();
            mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
        });
        pin.addEventListener('pointerleave', function () { mouse.on = false; });

        if (reduced || !('IntersectionObserver' in window)) {
            kick();
            return;
        }
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            if (visible) {
                last = 0; kick();
                var pr = video.play();
                if (pr && pr.catch) pr.catch(function () { });
            } else {
                video.pause();
            }
        }, { rootMargin: '100px 0px' }).observe(sec);
    }

    // ---------- 06: the globe, in pixels ----------
    // It used to be three.js: four thousand WebGL points behind a 600 KB
    // library that blocked the page, and on a machine that runs WebGL in
    // software, the slowest thing on it. Now it is a 2D canvas at half
    // resolution, one 2px cell per dot, in the logo's black (ice in the dark
    // theme), with replies flying between cities. 24 frames a second while
    // it is on screen, nothing when it is not, one still frame for reduced
    // motion.
    function initGlobe() {
        var box = document.getElementById('canvas-3d-globe');
        if (!box) return;
        var cv = document.createElement('canvas');
        cv.className = 'gnet__globe';
        cv.setAttribute('aria-hidden', 'true');
        box.appendChild(cv);
        var ctx = cv.getContext('2d');
        if (!ctx) return;

        var CELL = 2, W = 0, H = 0, R = 0;
        var N = window.innerWidth < 768 ? 700 : 1100, pts = [], g = Math.PI * (3 - Math.sqrt(5)), i;
        for (i = 0; i < N; i++) {
            var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = g * i;
            pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
        }
        function ll(lat, lon) {
            var a = lat * Math.PI / 180, b = lon * Math.PI / 180;
            return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)];
        }
        var CITY = {
            lagos: ll(6.5, 3.4), warsaw: ll(52.2, 21.0), saopaulo: ll(-23.5, -46.6), lisbon: ll(38.7, -9.1),
            jakarta: ll(-6.2, 106.8), berlin: ll(52.5, 13.4), newyork: ll(40.7, -74.0), london: ll(51.5, -0.1),
            mumbai: ll(19.1, 72.9), tokyo: ll(35.7, 139.7)
        };
        var ROUTES = [['lagos', 'warsaw', 0], ['saopaulo', 'lisbon', 0.5], ['newyork', 'london', 0.95], ['mumbai', 'berlin', 0.25], ['jakarta', 'tokyo', 0.7]];

        function rot(p, ay, ax) {
            var cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
            var x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy;
            return [x, p[1] * cx - z * sx, p[1] * sx + z * cx];
        }
        function slerp(a, b, u) {
            var d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), om = Math.acos(d), so = Math.sin(om) || 1;
            var k1 = Math.sin((1 - u) * om) / so, k2 = Math.sin(u * om) / so;
            return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
        }
        function resize() {
            W = Math.max(1, Math.round(box.clientWidth / CELL));
            H = Math.max(1, Math.round(box.clientHeight / CELL));
            cv.width = W; cv.height = H;
            cv.style.width = W * CELL + 'px';
            cv.style.height = H * CELL + 'px';
            R = Math.min(W, H) * 0.41;
        }

        function draw(t) {
            var dark = document.documentElement.getAttribute('data-theme') === 'dark';
            var ay = 2.75 + t * 0.2, ax = -0.38, cx = W / 2, cy = H * 0.53, k, q;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = dark ? '#DAE6F7' : '#07080C';
            for (k = 0; k < N; k++) {
                q = rot(pts[k], ay, ax);
                if (q[2] < -0.05) continue;
                ctx.globalAlpha = q[2] > 0.3 ? 1 : 0.4;
                ctx.fillRect(Math.round(cx + q[0] * R), Math.round(cy - q[1] * R), q[2] > 0.62 ? 2 : 1, q[2] > 0.62 ? 2 : 1);
            }
            ctx.globalAlpha = 1;
            // a reply crossing the map: a dotted arc that draws out and then lets go of its tail
            ROUTES.forEach(function (rt) {
                var u = (t * 0.32 + rt[2]) % 1.7;
                if (u > 1.5) return;
                var A = CITY[rt[0]], B = CITY[rt[1]], from = Math.max(0, (u - 0.9) / 0.6), to = Math.min(1, u), STEPS = 40;
                for (var s = Math.floor(from * STEPS); s <= Math.floor(to * STEPS); s++) {
                    var v = s / STEPS, p = slerp(A, B, v), lift = 1 + 0.14 * Math.sin(Math.PI * v);
                    var w = rot([p[0] * lift, p[1] * lift, p[2] * lift], ay, ax);
                    if (w[2] < 0 || (s & 1)) continue;
                    ctx.fillRect(Math.round(cx + w[0] * R) - 1, Math.round(cy - w[1] * R) - 1, 2, 2);
                }
            });
            // cities: hollow squares that beat on the half second
            Object.keys(CITY).forEach(function (name, n) {
                q = rot(CITY[name], ay, ax);
                if (q[2] < 0.1) return;
                var x = Math.round(cx + q[0] * R), y = Math.round(cy - q[1] * R), big = (Math.floor(t * 2) + n) % 4 === 0 ? 1 : 0;
                ctx.fillRect(x - 3 - big, y - 3 - big, 7 + big * 2, 7 + big * 2);
                ctx.clearRect(x - 1 - big, y - 1 - big, 3 + big * 2, 3 + big * 2);
            });
        }

        resize();
        window.addEventListener('resize', function () { resize(); draw(reduced ? 0 : (performance.now() - t0) / 1000); });
        var t0 = performance.now(), raf = 0, last = 0, on = false;
        function frame(now) {
            raf = 0;
            if (!on || document.hidden) return;
            raf = requestAnimationFrame(frame);
            if (now - last < 41) return;
            last = now;
            draw((now - t0) / 1000);
        }
        draw(0);
        if (reduced || !('IntersectionObserver' in window)) return;
        new IntersectionObserver(function (entries) {
            on = entries[0].isIntersecting;
            if (on && !raf) raf = requestAnimationFrame(frame);
        }, { rootMargin: '80px 0px' }).observe(box);
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden && on && !raf) raf = requestAnimationFrame(frame);
        });
        // the theme toggle repaints the globe at once, not on its next tick
        new MutationObserver(function () { draw((performance.now() - t0) / 1000); })
            .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    function boot() {
        try { initPhone(); } catch (e) { console.warn('feed: phone', e); }
        try { initReel(); } catch (e) { console.warn('feed: reel', e); }
        try { initArena(); } catch (e) { console.warn('feed: arena', e); }
        try { initCatch(); } catch (e) { console.warn('feed: catch', e); }
        try { initGlobe(); } catch (e) { console.warn('feed: globe', e); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
