/* ==========================================================================
   Datariot — info.datariot.xyz
   Everything that moves on the page, and nothing that does not have to:
   the menu on phones, the sidebar's current section, things rising into
   view once, the hero clip (it plays only while it is seen), and the three
   demos: tap a question in the feed, the how-it-works scene, the arena vote.
   ========================================================================== */
(function () {
    'use strict';

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasIO = 'IntersectionObserver' in window;

    // play a CSS animation again: take its class off, force a style flush, put it back
    function restart(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

    function playQuietly(video) {
        var p = video.play();
        if (p && p.catch) p.catch(function () { });
    }

    // ---------- the menu on phones ----------
    function initMenu() {
        var top = document.querySelector('.top');
        if (!top) return;
        var btn = top.querySelector('.top__menu');
        var word = top.querySelector('.top__word');
        if (!btn) return;

        function set(open) {
            top.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (word) word.textContent = open ? 'Close' : 'Menu';
        }

        btn.addEventListener('click', function () { set(!top.classList.contains('is-open')); });
        top.querySelectorAll('.top__nav a').forEach(function (a) {
            a.addEventListener('click', function () { set(false); });
        });
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape' || !top.classList.contains('is-open')) return;
            set(false);
            btn.focus();
        });
        document.addEventListener('click', function (e) {
            if (top.classList.contains('is-open') && !top.contains(e.target)) set(false);
        });

        // a hairline under the bar once the page has moved
        var stuck = null;
        function onScroll() {
            var s = window.scrollY > 8;
            if (s === stuck) return;
            stuck = s;
            top.classList.toggle('is-stuck', s);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    // ---------- the sidebar marks the section you are reading ----------
    function initNav() {
        var links = [].slice.call(document.querySelectorAll('.side__nav a[data-nav]'));
        if (!links.length || !hasIO) return;
        var ids = links.map(function (a) { return a.getAttribute('data-nav'); });
        var current;

        function mark(id) {
            if (id === current) return;
            current = id;
            links.forEach(function (a) {
                if (a.getAttribute('data-nav') === id) a.setAttribute('aria-current', 'true');
                else a.removeAttribute('aria-current');
            });
        }

        // a section is the current one while it crosses the middle of the screen
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) mark(ids.indexOf(e.target.id) >= 0 ? e.target.id : null);
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        document.querySelectorAll('.main section[id]').forEach(function (s) { io.observe(s); });
    }

    // ---------- things rise into place once, as they come into view ----------
    function initReveal() {
        var els = [].slice.call(document.querySelectorAll('.rv'));
        if (!els.length) return;
        if (reduced || !hasIO) {
            els.forEach(function (el) { el.classList.add('is-in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                e.target.classList.add('is-in');
                io.unobserve(e.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        els.forEach(function (el) { io.observe(el); });
    }

    // ---------- the hero: a real clip from the app ----------
    // It plays only while it is on screen and the tab is visible; the thin
    // bar under it follows the clip.
    function initHero() {
        var app = document.getElementById('heroApp');
        if (!app) return;
        var video = app.querySelector('video');
        var bar = app.querySelector('.app__bar i');
        if (!video) return;
        if (reduced) {
            video.removeAttribute('autoplay');
            video.pause();
            return;
        }
        var visible = true, raf = 0;

        function frame() {
            raf = requestAnimationFrame(frame);
            var d = video.duration || 14.37;
            if (bar) bar.style.transform = 'scaleX(' + Math.min(1, (video.currentTime || 0) / d).toFixed(4) + ')';
        }

        function sync() {
            if (visible && !document.hidden) {
                playQuietly(video);
                if (!raf) raf = requestAnimationFrame(frame);
            } else {
                video.pause();
                cancelAnimationFrame(raf);
                raf = 0;
            }
        }

        if (hasIO) {
            new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
                sync();
            }, { threshold: 0.15 }).observe(app);
        }
        document.addEventListener('visibilitychange', sync);
        sync();
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

        if (hasIO) {
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

    // ---------- the feed: tap a question, get the point ----------
    // The phone is a feed of four real clips from the app. Each question on
    // the right is one of them: tapping it swipes the phone to that clip,
    // stamps THE POINT on it, and writes the point out underneath. Left
    // alone, the clips take turns. Every point is checkable; the site sells
    // short videos that leave you knowing something, so the examples have to
    // hold up too.
    function initFeed() {
        var root = document.getElementById('feedDemo');
        if (!root) return;
        var clips = [].slice.call(root.querySelectorAll('.fd__clip'));
        var qs = [].slice.call(root.querySelectorAll('.fd__q'));
        var pts = [].slice.call(root.querySelectorAll('.fd__pt'));
        var rail = root.querySelector('.fd__rail');
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
            restart(rail, 'is-ping');
            if (vid && !wasOn && vidClip.classList.contains('is-on')) {
                try { vid.currentTime = 0; } catch (e) { }
            }
            syncVideo();
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
        });
        document.addEventListener('visibilitychange', syncVideo);
    }

    // ---------- how it works: one scene, three steps ----------
    // The scene is CSS: data-step on #how says which step it is showing, and
    // every part of it moves by transition. What CSS cannot do is here: the
    // subtitle that types itself while the clock runs, the reply count and
    // the votes that count up. Each step runs on one ticker that works the
    // state out from the time since the step began, and holds still while the
    // slide is off screen.
    function initHow() {
        var root = document.getElementById('how');
        if (!root) return;
        var steps = [].slice.call(root.querySelectorAll('.hw__step'));
        if (steps.length !== 3) return;
        var clock = root.querySelector('[data-clock]');
        var typed = root.querySelector('[data-typed]');
        var post = root.querySelector('.hw__post');
        var replies = root.querySelector('[data-replies]');
        var counts = [].slice.call(root.querySelectorAll('[data-to]'));
        var SAY = typed ? typed.textContent : '';
        var ticker = 0, t0 = 0, elapsed = 0, active = 0, visible = false;
        root.classList.add('is-live');
        // nothing moves by itself for people who asked for less motion
        if (reduced) root.classList.add('is-manual');

        function setText(el, s) { if (el && el.textContent !== s) el.textContent = s; }
        function span(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }

        // what the scene reads t ms into a step
        function render(step, t) {
            if (step === 0) {
                var secs = Math.min(24, Math.floor(t / 140));
                setText(clock, '0:' + (secs < 10 ? '0' : '') + secs);
                setText(typed, SAY.slice(0, Math.floor(span(t, 500, 500 + SAY.length * 70) * SAY.length)));
                if (post) post.classList.toggle('is-hit', t > 4600);
            } else if (step === 1) {
                setText(replies, t > 1900 ? '2' : t > 1200 ? '1' : '0');
            } else {
                setText(replies, '2');
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

    // ---------- the arena: a vote that works ----------
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
            if (note) note.textContent = (mine ? 'Your vote is in' : 'Pick a side') + ' · ' + total.toLocaleString('en-US') + ' votes';
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

        // the room keeps voting, and the cameras bob, while the arena is on screen
        if (!hasIO) return;
        ar.classList.add('is-away');
        var timer = 0;
        function tick() {
            votes[Math.random() < 0.55 ? 'for' : 'against'] += 1 + Math.floor(Math.random() * 3);
            draw();
        }
        new IntersectionObserver(function (entries) {
            var seen = entries[0].isIntersecting;
            ar.classList.toggle('is-away', !seen);
            clearInterval(timer);
            if (seen && !reduced) timer = setInterval(tick, 2400);
        }, { threshold: 0.2 }).observe(ar);
    }


    function boot() {
        window.siteReady = true;    // the page's head script keeps html.js only if this ran
        [initMenu, initNav, initReveal, initHero, initFeed, initHow, initArena].forEach(function (fn) {
            try { fn(); } catch (e) { console.warn('site: ' + fn.name, e); }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
