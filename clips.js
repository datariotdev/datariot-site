/* ==========================================================================
   Datariot — the feed
   The hero phone plays a real clip from the app and keeps the screen around
   it alive: progress, counters, reactions, a comment being typed, the light
   of the clip spilling into the screen. Section 01 is a second phone with
   four real clips on it: tap a question and it swipes to that clip, stamps
   THE POINT on it and writes the point out; slide 02 plays the loop, a clip
   filmed, answered and voted on, in one scene; slide 04 takes a vote; 06's
   globe turns on a pixel canvas. A quiet CSS play pulse connects the app
   and the arena. Everything else is DOM and CSS.
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

    // play a CSS animation again: take its class off, force a style flush, put it back
    function restart(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

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
        if (!video) return;

        var likes = 3128, comments = 842;
        var COMMENTS = ['Both. Logic first.', 'Depends on the stakes', 'Feelings are data too'];
        var pass = 0, lastT = 0, raf = 0, lastAmb = 0, running = false, visible = false, typing = 0;
        var lastLabel = '';

        function fmt(t) { t = Math.max(0, Math.floor(t)); return Math.floor(t / 60) + ':' + (t % 60 < 10 ? '0' : '') + (t % 60); }
        function num(n) { return n.toLocaleString('en-US'); }

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
            [4.1, react],
            [6.0, comment],
            [10.2, react]
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
        }

        function stop() {
            running = false;
            video.pause();
            cancelAnimationFrame(raf);
        }

        if (reduced) {
            // hold still on the first frame
            video.removeAttribute('autoplay');
            video.pause();
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

    // ---------- shared: a row of buttons that take turns ----------
    // One button is on. While the demo is on screen and nobody has touched
    // it, the bar inside the button that is on (a CSS animation) is the clock:
    // when it ends the next button takes over. Hovering or focusing the demo
    // holds the clock; a tap takes the demo over for good (.is-manual).
    // show(i, again) paints the rest of the demo; again is true when the
    // button that is already on was tapped, which plays its scene again.
    // Until the demo itself is on screen it is .is-away and holds its first
    // frame (the page's own rule only knows about the whole slide, which
    // starts a screen before the demo does); onView(seen) hears about it.
    function takeTurns(root, buttons, show, onView, first) {
        var n = buttons.length, active = -1;

        function go(i, byUser) {
            i = (i + n) % n;
            var again = i === active;
            if (byUser) root.classList.add('is-manual');
            active = i;
            buttons.forEach(function (b, k) {
                b.classList.toggle('is-on', k === i);
                b.setAttribute('aria-pressed', k === i ? 'true' : 'false');
            });
            show(i, again);
        }

        buttons.forEach(function (b, k) {
            b.addEventListener('click', function () { go(k, true); });
            var bar = b.querySelector('[data-bar]');
            if (bar) bar.addEventListener('animationend', function () {
                if (k === active && !root.classList.contains('is-manual')) go(k + 1, false);
            });
        });

        var hover = false, focus = false;
        function hold() { root.classList.toggle('is-held', hover || focus); }
        if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
            root.addEventListener('pointerenter', function () { hover = true; hold(); });
            root.addEventListener('pointerleave', function () { hover = false; hold(); });
        }
        root.addEventListener('focusin', function () { focus = true; hold(); });
        root.addEventListener('focusout', function () { focus = false; hold(); });

        go(first || 0, false);

        if ('IntersectionObserver' in window) {
            root.classList.add('is-away');
            new IntersectionObserver(function (entries) {
                var seen = entries[0].isIntersecting;
                root.classList.toggle('is-away', !seen);
                if (onView) onView(seen);
            }, { threshold: 0.25 }).observe(root);
        } else if (onView) {
            onView(true);
        }
    }

    // ---------- section 01: tap a question, get the point ----------
    // The phone is a feed of four real clips from the app, drawn the way the
    // hero's phone is. Each question on the right is one of them: tapping it
    // swipes the phone to that clip and writes the point out underneath; when
    // the point lands, the clip gets a like. Left alone, the clips take turns.
    // Every point is checkable; the site sells short videos that leave you
    // knowing something, so the examples have to hold up too.
    function initFeed() {
        var root = document.getElementById('feedDemo');
        if (!root) return;
        var clips = [].slice.call(root.querySelectorAll('.fd__clip'));
        var qs = [].slice.call(root.querySelectorAll('.fd__q'));
        var pts = [].slice.call(root.querySelectorAll('.fd__pt'));
        var points = root.querySelector('.fd__points');
        if (!clips.length || clips.length !== qs.length || clips.length !== pts.length) return;
        root.classList.add('is-live');
        // nothing moves by itself for people who asked for less motion
        if (reduced) root.classList.add('is-manual');

        // the real clip plays only while it is the one on the phone and on screen
        var vid = root.querySelector('video');
        var vidClip = vid && vid.closest('.fd__clip');
        var visible = false;
        function syncVideo() {
            if (!vid || reduced) return;
            if (visible && !document.hidden && vidClip.classList.contains('is-on')) {
                var p = vid.play();
                if (p && p.catch) p.catch(function () { });
            } else {
                vid.pause();
            }
        }

        function show(i, again) {
            var wasOn = vidClip && vidClip.classList.contains('is-on');
            clips.forEach(function (c, k) {
                c.style.setProperty('--d', k - i);
                c.classList.toggle('is-on', k === i);
            });
            pts.forEach(function (p, k) { p.classList.toggle('is-on', k === i); });
            if (again) [clips[i], pts[i], qs[i]].forEach(function (el) { restart(el, 'is-on'); });
            if (vid && !wasOn && vidClip.classList.contains('is-on')) {
                try { vid.currentTime = 0; } catch (e) { }
            }
            syncVideo();
            cur = i;
            tickTime();
        }

        // the time under the clip that is on follows its progress bar; the bar
        // is a CSS animation, so it already stops when the demo is held or off
        // screen, and without motion the time keeps the value it was written with
        var cur = 0, timer = 0;
        function fmt(t) { t = Math.max(0, Math.floor(t)); return Math.floor(t / 60) + ':' + (t % 60 < 10 ? '0' : '') + (t % 60); }
        function tickTime() {
            var fill = clips[cur].querySelector('.fd__prog i');
            var label = clips[cur].querySelector('[data-len]');
            if (!fill || !label || !fill.getAnimations) return;
            var anim = fill.getAnimations()[0];
            var p = anim && anim.effect && anim.effect.getComputedTiming().progress;
            if (p == null) return;
            var len = +label.getAttribute('data-len');
            var text = fmt(p * len) + ' / ' + fmt(len);
            if (label.textContent !== text) label.textContent = text;
        }
        function clock() {
            clearInterval(timer);
            timer = visible && !document.hidden && !reduced ? setInterval(tickTime, 250) : 0;
        }

        takeTurns(root, qs, function (i, again) {
            if (root.classList.contains('is-manual') && points && !points.hasAttribute('aria-live')) {
                // from the first tap on, a new point is read out
                points.setAttribute('aria-live', 'polite');
            }
            show(i, again);
        }, function (seen) {
            visible = seen;
            syncVideo();
            clock();
        });
        document.querySelectorAll('[data-featured-clip]').forEach(function (link) {
            link.addEventListener('click', function () {
                var index = Number(link.getAttribute('data-featured-clip'));
                if (Number.isInteger(index) && qs[index]) qs[index].click();
            });
        });
        document.addEventListener('visibilitychange', function () { syncVideo(); clock(); });
    }

    // ---------- slide 02: one scene, three steps ----------
    // The scene is the app's Debate Thread on a phone, and it is CSS: data-step
    // on #how says which step it is showing, and every part of it moves by
    // transition. What CSS cannot do is here: the claim that types itself while
    // the clip's clock runs, the argument count and the votes that count up.
    // Each step runs on one ticker that works the state out from the time since
    // the step began, and holds still while the slide is off screen.
    function initHow() {
        var root = document.getElementById('how');
        if (!root) return;
        var steps = [].slice.call(root.querySelectorAll('.hw__step'));
        if (steps.length !== 3) return;
        var clock = root.querySelector('[data-clock]');
        var typed = root.querySelector('[data-typed]');
        var post = root.querySelector('.hw__post');
        var replies = [].slice.call(root.querySelectorAll('[data-replies]'));
        var counts = [].slice.call(root.querySelectorAll('[data-to]'));
        var SAY = typed ? typed.textContent : '';
        var ticker = 0, t0 = 0, elapsed = 0, active = 0, visible = false;
        root.classList.add('is-live');
        // nothing moves by itself for people who asked for less motion
        if (reduced) root.classList.add('is-manual');

        function setText(el, s) { if (el && el.textContent !== s) el.textContent = s; }
        function setAll(list, s) { list.forEach(function (el) { setText(el, s); }); }
        function span(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }

        // what the scene reads t ms into a step
        function render(step, t) {
            if (step === 0) {
                var secs = Math.min(24, Math.floor(t / 140));
                setText(clock, '0:' + (secs < 10 ? '0' : '') + secs);
                setText(typed, SAY.slice(0, Math.floor(span(t, 500, 500 + SAY.length * 70) * SAY.length)));
                if (post) post.classList.toggle('is-hit', t > 4600);
                setAll(replies, '0');
                setAll(counts, '0');
            } else if (step === 1) {
                // the arguments land at 0.6s and 1.3s (the CSS delays)
                setText(clock, '0:24');
                setText(typed, SAY);
                setAll(replies, t > 1300 ? '2' : t > 600 ? '1' : '0');
                setAll(counts, '0');
            } else {
                setText(clock, '0:24');
                setText(typed, SAY);
                setAll(replies, '2');
                var k = 1 - Math.pow(1 - span(t, 600, 2100), 3);
                counts.forEach(function (el) { setText(el, String(Math.round(k * el.getAttribute('data-to')))); });
            }
        }

        function stop() { clearInterval(ticker); ticker = 0; }
        function run() {
            if (ticker || reduced || !visible) return;
            t0 = performance.now() - elapsed;
            ticker = setInterval(function () {
                elapsed = performance.now() - t0;
                render(active, elapsed);
                if (elapsed > 6000) stop();
            }, 40);
        }

        function show(i, again) {
            if (again) return;                       // the scene is already on that step
            active = i;
            root.setAttribute('data-step', String(i + 1));
            stop();
            elapsed = 0;
            render(i, reduced ? 1e5 : 0);            // no motion: the step as it ends
            run();
        }

        takeTurns(root, steps, show, function (seen) {
            visible = seen;
            if (seen) run(); else stop();
        }, reduced ? 2 : 0);
    }

    // ---------- slide 04: local debate demo, with authored counterquestions ----------
    function initArena() {
        var ar = document.getElementById('arena');
        if (!ar) return;
        var topics = {
            work: {
                question: 'Where does our best work happen?',
                sides: {
                    'for': { label: 'remote work', position: 'THE CASE FOR REMOTE', title: ['Less office.', 'More focus.'], quote: 'Great work needs room to think, not another commute. Let people choose where they do it best.', challenge: 'If everyone works alone, how do new teammates learn the things nobody thinks to write down?' },
                    'against': { label: 'working together', position: 'THE CASE FOR TOGETHER', title: ['Same room.', 'New ideas.'], quote: 'You can schedule a call. You can’t schedule every unexpected idea, or every moment someone needs a mentor.', challenge: 'If being together is the advantage, what evidence would show it outweighs the commute and constant interruptions?' }
                }
            },
            ai: {
                question: 'Does AI make us better thinkers?',
                sides: {
                    'for': { label: 'AI as a thinking partner', position: 'THE CASE FOR A THINKING PARTNER', title: ['Less busywork.', 'Bigger questions.'], quote: 'Let AI handle the first draft. Spend your energy asking better questions, testing ideas and finding what’s missing.', challenge: 'If AI gives you a convincing but wrong answer, have you kept enough of the skill to catch the mistake?' },
                    'against': { label: 'thinking for ourselves', position: 'THE CASE FOR DOING THE WORK', title: ['Easy answers.', 'Rusty instincts.'], quote: 'The struggle is part of learning. When a tool does all the thinking, we can lose the ability to judge its answer.', challenge: 'Could using AI to challenge your reasoning build the very skill you’re worried it will replace?' }
                }
            },
            creativity: {
                question: 'What makes an original idea possible?',
                sides: {
                    'for': { label: 'creative constraints', position: 'THE CASE FOR CONSTRAINTS', title: ['Fewer options.', 'Sharper ideas.'], quote: 'A deadline, a tiny budget, one camera. Limits force you to make choices you would never make with unlimited resources.', challenge: 'When do useful constraints become barriers that stop a promising idea from ever getting made?' },
                    'against': { label: 'creative freedom', position: 'THE CASE FOR FREEDOM', title: ['Room to play.', 'Space to fail.'], quote: 'Original work needs experiments with no guaranteed payoff. Give people the time and freedom to follow a strange idea.', challenge: 'Without a deadline or a boundary, how do you know when exploration has turned into avoiding a decision?' }
                }
            }
        };
        var topic = 'work';
        var sides = { 'for': ar.querySelector('.ar-side--for'), 'against': ar.querySelector('.ar-side--against') };
        var reset = ar.querySelector('.ar__reset');
        var challenge = ar.querySelector('[data-challenge]');
        var challengeLabel = ar.querySelector('[data-challenge-label]');

        function clearPick() {
            ar.removeAttribute('data-pick');
            Object.keys(sides).forEach(function (key) {
                var side = sides[key];
                side.classList.remove('is-picked');
                side.querySelector('.ar-vote').setAttribute('aria-pressed', 'false');
                side.querySelector('[data-vote-label]').textContent = 'Back this take';
                side.querySelector('.ar-vote__icon').textContent = '↗';
            });
            reset.hidden = true;
            challengeLabel.textContent = 'YOUR TURN';
            challenge.textContent = 'Which take earns your vote? Pick one to reveal its toughest question.';
        }

        ar.querySelectorAll('.ar-topic').forEach(function (button) {
            button.addEventListener('click', function () {
                var next = button.getAttribute('data-topic');
                if (!topics[next] || next === topic) return;
                topic = next;
                ar.querySelectorAll('.ar-topic').forEach(function (b) { b.setAttribute('aria-pressed', b === button ? 'true' : 'false'); });
                ar.querySelector('[data-question]').textContent = topics[topic].question;
                Object.keys(sides).forEach(function (key) {
                    var data = topics[topic].sides[key], side = sides[key];
                    side.querySelector('[data-position]').textContent = data.position;
                    var heading = side.querySelector('[data-title]');
                    heading.replaceChildren(document.createTextNode(data.title[0]), document.createElement('br'), document.createTextNode(data.title[1]));
                    side.querySelector('[data-quote]').textContent = '“' + data.quote + '”';
                    side.querySelector('.ar-vote').setAttribute('aria-label', 'Back take ' + (key === 'for' ? 'A: ' : 'B: ') + data.label);
                });
                clearPick();
                challenge.textContent = topics[topic].question + ' Pick a take to reveal its toughest question.';
            });
        });
        ar.querySelectorAll('.ar-vote').forEach(function (button) {
            button.addEventListener('click', function () {
                var key = button.getAttribute('data-side');
                clearPick();
                ar.setAttribute('data-pick', key);
                sides[key].classList.add('is-picked');
                button.setAttribute('aria-pressed', 'true');
                button.querySelector('[data-vote-label]').textContent = 'You backed this';
                button.querySelector('.ar-vote__icon').textContent = '✓';
                challengeLabel.textContent = 'YOU BACKED ' + (key === 'for' ? 'A' : 'B') + ' · NOW TEST IT';
                challenge.textContent = topics[topic].sides[key].challenge;
                reset.hidden = false;
            });
        });
        reset.addEventListener('click', function () {
            var lastPick = ar.getAttribute('data-pick') || 'for';
            clearPick();
            sides[lastPick].querySelector('.ar-vote').focus();
        });
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
        try { initFeed(); } catch (e) { console.warn('feed: clips', e); }
        try { initHow(); } catch (e) { console.warn('feed: how it works', e); }
        try { initArena(); } catch (e) { console.warn('feed: arena', e); }
        try { initGlobe(); } catch (e) { console.warn('feed: globe', e); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
