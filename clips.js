/* ==========================================================================
   Datariot — the feed
   The hero phone plays a real clip from the app and keeps the screen around
   it alive: progress, counters, reactions, a comment being typed, the light
   of the clip spilling into the screen. Section 01 lays out a reel of short
   clips that each make one point, built from real frames in the app and
   explainers filmed as screen recordings; slide 04 takes a vote. Everything
   else is DOM and CSS.
   ========================================================================== */
(function () {
    'use strict';

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
        var ctx = canvas && canvas.getContext('2d');
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
            // the clip's light, a few times a second, into a tiny blurred canvas
            if (ctx && now - lastAmb > 90 && video.readyState >= 2) {
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
            // its own light blurred behind it
            return '<span class="reel-card__amb" style="background-image:url(\'' + c.img + '\')"></span>' +
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

    function boot() {
        try { initPhone(); } catch (e) { console.warn('feed: phone', e); }
        try { initReel(); } catch (e) { console.warn('feed: reel', e); }
        try { initArena(); } catch (e) { console.warn('feed: arena', e); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
