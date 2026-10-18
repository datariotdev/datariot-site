/* Three examples from the existing feed. User controlled; no autoplay timer. */
(function () {
    'use strict';
    var root = document.getElementById('catch');
    if (!root) return;
    var controls = root.querySelector('.catch__questions');
    var buttons = root.querySelectorAll('[data-curiosity]');
    var poster = root.querySelector('.catch__poster');
    var feature = root.querySelector('.catch__feature');
    var title = root.querySelector('[data-curiosity-title]');
    var topic = root.querySelector('[data-curiosity-topic]');
    var duration = root.querySelector('[data-curiosity-duration]');
    var lead = root.querySelector('[data-curiosity-lead]');
    var point = root.querySelector('[data-curiosity-point]');
    var foot = root.querySelector('[data-curiosity-foot]');
    var status = root.querySelector('[data-curiosity-status]');
    var links = root.querySelectorAll('[data-featured-clip]');
    if (!controls || !buttons.length || !poster || !feature || !title || !topic || !duration || !lead || !point || !foot) return;

    var examples = [
        {
            feed: 0, image: 'assets/reel-bear.jpg', alt: 'A polar bear in the featured Datariot clip', position: '50% 50%',
            title: 'Why aren’t polar bears actually white?', topic: '01 / NATURE', duration: '0:31',
            lead: 'Their fur is clear.', point: 'It only looks white.', foot: 'A little context changes the picture.'
        },
        {
            feed: 1, image: 'assets/reel-lidar.jpg', alt: 'A car and pedestrians seen by a self-driving system', position: '50% 50%',
            title: 'How does a car see the street?', topic: '02 / TECHNOLOGY', duration: '0:44',
            lead: 'A pulse of light.', point: 'A map of the street.', foot: 'Lidar measures the time it takes each laser pulse to return.'
        },
        {
            feed: 3, image: 'assets/reel-tower.jpg', alt: 'A skyscraper rising above the city', position: '50% 32%',
            title: 'Why do skyscrapers sway on purpose?', topic: '03 / ARCHITECTURE', duration: '0:38',
            lead: 'Built to move.', point: 'Built to stay standing.', foot: 'A little flexibility helps a tower absorb the wind.'
        }
    ];
    var selected = 0;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function show(index) {
        if (!Number.isInteger(index) || !examples[index] || index === selected) return;
        var clip = examples[index];
        selected = index;
        poster.setAttribute('src', clip.image);
        poster.setAttribute('alt', clip.alt);
        poster.style.objectPosition = clip.position;
        title.textContent = clip.title;
        topic.textContent = clip.topic;
        duration.textContent = clip.duration;
        lead.textContent = clip.lead;
        point.textContent = clip.point;
        foot.textContent = clip.foot;
        feature.setAttribute('aria-label', 'Explore this clip in the feed: ' + clip.title);
        links.forEach(function (link) { link.setAttribute('data-featured-clip', String(clip.feed)); });
        buttons.forEach(function (button) {
            var active = Number(button.getAttribute('data-curiosity')) === index;
            button.classList.toggle('is-selected', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        if (status) status.textContent = clip.title + ' ' + clip.lead + ' ' + clip.point;
        if (!reduced && !document.documentElement.classList.contains('gfx-lite')) {
            root.classList.remove('is-changing');
            void feature.offsetWidth;
            root.classList.add('is-changing');
        }
    }

    buttons.forEach(function (button) {
        button.addEventListener('click', function () { show(Number(button.getAttribute('data-curiosity'))); });
    });
    controls.hidden = false;
})();
