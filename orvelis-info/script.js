/* ===========================================
   DATARIOT Landing Page — Interactions & FX
   =========================================== */
console.log('Datariot Script: Initiating...');

// Initialize Supabase (Global)
let supabase = null;

// Immediate Theme Initialization to prevent flash — strictly light by default
(function () {
    document.documentElement.setAttribute('data-theme', 'light');
})();

// Global Toggle Function (Bulletproof)
window.toggleTheme = function () {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    try {
        localStorage.setItem('orvelis-theme', next);
    } catch (e) { }
    console.log('Theme manual toggle to:', next);
};

/* =======================================
   UI INTERACTIONS & NAVIGATION
   ======================================= */
// Robust Initialization Function
function initializeScripts() {
    if (window.scriptsInitialized) return;
    window.scriptsInitialized = true;
    console.log('Datariot Script: DOMContentLoaded triggered.');

    // Initialize Supabase
    try {
        const supabaseUrl = 'https://uycrtobdewnscwazshcu.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Y3J0b2JkZXduc2N3YXpzaGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzU1NjYsImV4cCI6MjA3NTI1MTU2Nn0.EsZQOIE879QwU_FKk0Agh-yJBdRJcLTmYi-DCMjYaxU';
        if (typeof window.supabase !== 'undefined') {
            supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            console.log('Datariot Script: Supabase client created.');
        } else {
            console.warn('Datariot Script: Supabase not found on window.');
        }
    } catch (e) {
        console.error('Supabase initialization failed:', e);
    }

    // === Mobile Navigation Toggle ===
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const sidebar = document.getElementById('sidebar');

    if (mobileNavToggle && sidebar) {
        console.log('Datariot Script: Mobile toggle and sidebar found.');

        const toggleMenu = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            sidebar.classList.toggle('mobile-open');
            mobileNavToggle.classList.toggle('active');

            // Prevent body scroll when menu is open
            if (sidebar.classList.contains('mobile-open')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }

            console.log('Datariot Script: Mobile menu toggled. State:', sidebar.classList.contains('mobile-open'));
        };

        mobileNavToggle.addEventListener('click', toggleMenu);
    } else {
        console.error('Datariot Script: Mobile toggle elements NOT found!', { mobileNavToggle, sidebar });
    }

    // === Sidebar Active Section Tracking ===
    const sections = document.querySelectorAll('.section');
    const sidebarLinks = document.querySelectorAll('.sidebar__link');
    if (sections.length > 0 && sidebarLinks.length > 0) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    sidebarLinks.forEach(link => {
                        link.classList.toggle('active', link.dataset.section === id);
                    });
                }
            });
        }, { threshold: 0.25 });
        sections.forEach(s => sectionObserver.observe(s));
    }

    // === Sidebar Link Clicks ===
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.section;
            const target = document.getElementById(targetId);
            console.log('Sidebar Click: Navigating to', targetId);
            if (target) {
                if (window.lenisInstance) {
                    window.lenisInstance.scrollTo(target, { offset: 0, duration: 1.5 });
                } else {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
                // Close mobile menu if open
                if (sidebar && sidebar.classList.contains('mobile-open')) {
                    sidebar.classList.remove('mobile-open');
                    mobileNavToggle && mobileNavToggle.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    });

    // === Sidebar Logo Click (Scroll to Top) ===
    const sidebarLogo = document.querySelector('.sidebar__logo');
    if (sidebarLogo) {
        sidebarLogo.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (sidebar && sidebar.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
                mobileNavToggle && mobileNavToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // === Reveal Animations ===
    const revealElements = document.querySelectorAll('.reveal, .section__header, .value-card, .feature-card, .live-card, [data-animate]');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        revealElements.forEach(el => revealObserver.observe(el));
    }

    // === Holographic Fragment 3D Interaction ===
    document.querySelectorAll('.feature-fragment').forEach(fragment => {
        fragment.addEventListener('mousemove', (e) => {
            const rect = fragment.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            const tiltX = (y - 0.5) * 15; // Deeper tilt
            const tiltY = (x - 0.5) * -15;

            fragment.style.transform = `perspective(2000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

            const visual = fragment.querySelector('.fragment-visual');
            const content = fragment.querySelector('.fragment-content');
            const glow = fragment.querySelector('.fragment-glow');

            if (visual) visual.style.transform = `translateZ(100px) translateX(${(x - 0.5) * 30}px) translateY(${(y - 0.5) * 30}px)`;
            if (content) content.style.transform = `translateZ(150px) translateX(${(x - 0.5) * 50}px) translateY(${(y - 0.5) * 50}px)`;

            if (glow) {
                const gx = (x - 0.5) * 100;
                const gy = (y - 0.5) * 100;
                glow.style.transform = `translate(${gx}px, ${gy}px) scale(1.2)`;
            }
        });

        fragment.addEventListener('mouseleave', () => {
            fragment.style.transform = '';
            const visual = fragment.querySelector('.fragment-visual');
            const content = fragment.querySelector('.fragment-content');
            const glow = fragment.querySelector('.fragment-glow');
            if (visual) visual.style.transform = '';
            if (content) content.style.transform = '';
            if (glow) glow.style.transform = '';
        });
    });

    // === Manifesto Full-Width Card 3D Interaction ===
    const manifestoCard = document.querySelector('.manifesto-v2__card--full');
    if (manifestoCard) {
        manifestoCard.addEventListener('mousemove', (e) => {
            const rect = manifestoCard.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            const tiltX = (y - 0.5) * 12;
            const tiltY = (x - 0.5) * -12;

            manifestoCard.style.transform = `perspective(2000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.01)`;

            // Premium dynamic spotlight reflection following cursor
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                manifestoCard.style.background = `radial-gradient(circle at ${x * rect.width}px ${y * rect.height}px, rgba(139, 92, 246, 0.12) 0%, rgba(10, 15, 30, 0.65) 75%)`;
            } else {
                manifestoCard.style.background = `radial-gradient(circle at ${x * rect.width}px ${y * rect.height}px, rgba(99, 102, 241, 0.12) 0%, rgba(255, 255, 255, 0.85) 75%)`;
            }

            const content = manifestoCard.querySelector('.manifesto-v2__card-content');
            const visual = manifestoCard.querySelector('.manifesto-v2__card-visual-wrapper');

            if (content) {
                content.style.transform = `translateZ(40px) translateX(${(x - 0.5) * 15}px) translateY(${(y - 0.5) * 15}px)`;
            }
            if (visual) {
                visual.style.transform = `translateZ(70px) translateX(${(x - 0.5) * -15}px) translateY(${(y - 0.5) * -15}px)`;
            }
        });

        manifestoCard.addEventListener('mouseleave', () => {
            manifestoCard.style.transform = '';
            manifestoCard.style.background = '';
            const content = manifestoCard.querySelector('.manifesto-v2__card-content');
            const visual = manifestoCard.querySelector('.manifesto-v2__card-visual-wrapper');
            if (content) content.style.transform = '';
            if (visual) visual.style.transform = '';
        });
    }

    // Section-wide Z-Parallax on Scroll
    if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
        const fragments = document.querySelectorAll('.feature-fragment');
        fragments.forEach((f, i) => {
            gsap.to(f, {
                scrollTrigger: {
                    trigger: '#features',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1
                },
                z: i % 2 === 0 ? 100 : -100, // Disperse in Z-space correctly
                y: i % 2 === 0 ? -50 : 50,
                ease: 'none'
            });
        });

        // Orbital Accelerator Rotation
        gsap.to('.orbital-ring', {
            scrollTrigger: {
                trigger: '#advantages',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.5
            },
            rotationZ: 180, // Rotate a half circle as user scrolls down
            ease: 'none'
        });

        // Inverse rotate the nodes so they stay upright
        gsap.to('.orbital-node', {
            scrollTrigger: {
                trigger: '#advantages',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.5
            },
            rotationZ: -180,
            ease: 'none'
        });

        // Arena Forge Nodes Reveal
        const forgeNodes = document.querySelectorAll('.forge-node');
        forgeNodes.forEach((node, i) => {
            gsap.from(node, {
                scrollTrigger: {
                    trigger: node,
                    start: 'top 90%',
                    toggleActions: 'play none none reverse'
                },
                opacity: 0,
                x: i % 2 === 0 ? -100 : 100,
                rotationY: i % 2 === 0 ? 30 : -30,
                duration: 1.2,
                ease: 'power4.out'
            });
        });
    }

    // === Live Stats Count-Up ===
    const liveSection = document.getElementById('live');
    if (liveSection) {
        let statsAnimated = false;
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !statsAnimated) {
                statsAnimated = true;
                animateStats();
            }
        }, { threshold: 0.4 });
        statsObserver.observe(liveSection);
    }

    function animateStats() {
        const stats = [
            { id: 'liveUsers', target: 1247 },
            { id: 'liveVideos', target: 384 },
            { id: 'liveDebates', target: 56 },
            { id: 'liveMinutes', target: 12891 }
        ];
        stats.forEach(s => {
            const el = document.getElementById(s.id);
            if (!el) return;
            let current = 0;
            const duration = 2000;
            const step = (now) => {
                if (!current) current = now;
                const progress = Math.min((now - current) / duration, 1);
                const value = Math.floor(progress * s.target);
                el.textContent = value.toLocaleString();
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        });
    }

    // === Beta Form Submission ===
    const betaForm = document.getElementById('betaForm');
    if (betaForm) {
        betaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('betaEmail');
            const submitBtn = betaForm.querySelector('button[type="submit"]');
            if (emailInput && emailInput.value) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                console.log('Beta registration for:', emailInput.value);
                setTimeout(() => {
                    document.getElementById('betaCard').style.display = 'none';
                    document.getElementById('betaSuccess').style.display = 'flex';
                }, 1000);
            }
        });
    }

    // === Lenis Smooth Scroll ===
    if (typeof Lenis !== 'undefined') {
        window.lenisInstance = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
            window.lenisInstance.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => {
                window.lenisInstance.raf(time * 1000);
            });
            gsap.ticker.lagSmoothing(0);
        } else {
            function raf(time) {
                window.lenisInstance.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
        }
    }

    // === GSAP & ScrollTrigger Animations ===
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        if (typeof SplitType !== 'undefined') {
            // Wait slightly for fonts
            setTimeout(() => {
                const titles = document.querySelectorAll('.section__title');
                titles.forEach(title => {
                    const split = new SplitType(title, { types: 'lines, words' });
                    split.lines.forEach(line => {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'split-line';
                        line.parentNode.insertBefore(wrapper, line);
                        wrapper.appendChild(line);
                    });

                    gsap.from(split.words, {
                        scrollTrigger: {
                            trigger: title,
                            start: 'top 90%',
                            toggleActions: 'play none none none'
                        },
                        y: 60,
                        opacity: 0,
                        rotationZ: 3,
                        duration: 0.8,
                        stagger: 0.02,
                        ease: "power4.out"
                    });
                });
            }, 100);
        }

        // Cards Stagger Anim
        const sectionsWithCards = document.querySelectorAll('.section');
        sectionsWithCards.forEach(section => {
            const cards = section.querySelectorAll('.advantage-card, .feature-tile, .phone-mockup, .value-card, .debate-step');
            if (cards.length > 0) {
                gsap.from(cards, {
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 85%',
                        toggleActions: 'play none none none'
                    },
                    y: 60,
                    scale: 0.98,
                    opacity: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "power3.out"
                });
            }
        });

        // Premium Hero Entrance & Parallax Sequence
        const heroContent = document.querySelector('.hero__content');
        const heroLogoWrap = document.querySelector('.hero__brand-logo-wrap');
        const heroText = document.querySelector('.hero__brand-text');

        if (heroLogoWrap && heroText) {
            // Remove CSS animations to prevent conflicts
            heroLogoWrap.style.animation = 'none';
            heroText.style.animation = 'none';

            // Initial setup
            gsap.set(heroLogoWrap, { opacity: 0, scale: 0.3, rotationZ: -15, filter: "blur(10px)" });
            gsap.set(heroText, { opacity: 0, y: 50, filter: "blur(15px)" });

            const tl = gsap.timeline({ defaults: { ease: "power4.out" }, delay: 0.2 });

            // 1. Logo Pops In & Focuses
            tl.to(heroLogoWrap, {
                opacity: 1,
                scale: 1,
                rotationZ: 0,
                filter: "blur(0px)",
                duration: 2.2,
                ease: "elastic.out(1, 0.5)",
            })
                // 2. Text Blurs In and Slides Up
                .to(heroText, {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    duration: 1.5
                }, "-=1.8");

            const heroLogo = document.querySelector('.hero__brand-logo');
            if (heroLogo) {
                // First ensure perspective is set for 3D effect
                gsap.set(heroLogoWrap, { perspective: 1000 });

                // Continuous 3D spin on the INNER element to avoid conflicts with Wrapper Entrance timeline
                gsap.to(heroLogo, {
                    rotationY: 360,
                    duration: 6,
                    repeat: -1,
                    ease: "none",
                    transformOrigin: "center center",
                    delay: 2.2
                });

                // Continuous drifting
                gsap.to(heroLogo, {
                    x: "random(-40, 40)",
                    y: "random(-40, 40)",
                    duration: 4,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: 2.2,
                    onRepeat: function () {
                        gsap.to(heroLogo, {
                            x: gsap.utils.random(-40, 40),
                            y: gsap.utils.random(-40, 40),
                            duration: 4,
                            ease: "sine.inOut"
                        });
                    }
                });
            }
        }

        if (heroContent) {
            gsap.to(heroContent, {
                scrollTrigger: {
                    trigger: ".section--hero",
                    start: "top top",
                    end: "bottom top",
                    scrub: 1
                },
                y: 120,
                opacity: 0,
                filter: "blur(10px)"
            });
        }

        // PREMIUM: 3D Scroll-Linked Triple Phone Showcase
        const phones = gsap.utils.toArray('.phone-mockup');
        const descItems = gsap.utils.toArray('.desc-item');

        if (phones.length > 0) {
            gsap.set('.screens__showcase', { perspective: 2000 });

            const phonesTl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".section--screens",
                    start: "top 80%",
                    end: "top 20%",
                    scrub: 1.5,
                }
            });

            // Entrance animation: Fan out from center
            phonesTl.from('.phone-mockup--left', {
                x: 0,
                rotationY: 0,
                opacity: 0,
                filter: "blur(0px) brightness(1)",
                ease: "power2.out"
            }, 0);

            phonesTl.from('.phone-mockup--right', {
                x: 0,
                rotationY: 0,
                opacity: 0,
                filter: "blur(0px) brightness(1)",
                ease: "power2.out"
            }, 0);

            phonesTl.from('.phone-mockup--center', {
                z: 0,
                scale: 0.8,
                opacity: 0,
                ease: "back.out(1.7)"
            }, 0.1);

            // Animate description items
            if (descItems.length > 0) {
                phonesTl.from(descItems, {
                    y: 30,
                    opacity: 0,
                    stagger: 0.1,
                    ease: "power2.out"
                }, 0.3);
            }

            // Continuous Floating for fanned state
            phones.forEach((phone, i) => {
                gsap.to(phone, {
                    y: "-=20",
                    duration: 3 + i,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: i * 0.5
                });
            });
        }
    }

    // === Debate Arena Interactive Spotlight Tilt ===
    const debateGraphic = document.querySelector('.debate-arena-graphic');
    if (debateGraphic) {
        const leftBeam = debateGraphic.querySelector('.spotlight-beam--left');
        const rightBeam = debateGraphic.querySelector('.spotlight-beam--right');

        debateGraphic.addEventListener('mousemove', (e) => {
            const rect = debateGraphic.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const dx = (x - 0.5) * 55; // Swing spotlight bottom points based on cursor

            if (leftBeam) {
                leftBeam.setAttribute('points', `180,30 ${100 + dx},480 ${260 + dx},480`);
            }
            if (rightBeam) {
                rightBeam.setAttribute('points', `620,30 ${540 + dx},480 ${700 + dx},480`);
            }
        });

        debateGraphic.addEventListener('mouseleave', () => {
            if (leftBeam) {
                leftBeam.setAttribute('points', '180,30 100,480 260,480');
            }
            if (rightBeam) {
                rightBeam.setAttribute('points', '620,30 540,480 700,480');
            }
        });
    }
}

// Start Initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeScripts);
} else {
    initializeScripts();
}

/* =======================================
   HEAVY EFFECTS (DEFERRED)
   ======================================= */
window.addEventListener('load', () => {
    console.log('Datariot Script: Window load triggered. Starting heavy effects.');

    // Heavy effects check
    const isMobile = window.innerWidth < 1024;

    // Particle Canvas Animation
    (function () {
        const canvas = document.getElementById('particleCanvas');
        if (!canvas || isMobile) return; // Skip on mobile
        const ctx = canvas.getContext('2d');
        let w, h;
        const particles = [];
        const PARTICLE_COUNT = 60; // Reduced for performance
        const colors = ['rgba(14,165,233,', 'rgba(168,85,247,', 'rgba(20,184,166,'];

        function resize() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
                size: Math.random() * 2 + 1,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);
            particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color + '0.4)';
                ctx.fill();

                // Limited connections for performance
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
                    if (d < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = p.color + (0.1 * (1 - d / 100)) + ')';
                        ctx.stroke();
                    }
                }
            });
            requestAnimationFrame(draw);
        }
        draw();
    })();

    // Live Feed Simulation
    const feed = document.getElementById('liveFeed');
    if (feed) {
        const activities = [
            '<b>@neural_mind</b> started a new debate',
            '<b>@quantum_cat</b> joined the platform',
            '<b>@logic_king</b> shared a short video',
            '<b>@data_viz</b> uploaded a research clip'
        ];
        setInterval(() => {
            const item = document.createElement('div');
            item.className = 'live__feed-item reveal visible';
            item.innerHTML = `<span>${activities[Math.floor(Math.random() * activities.length)]}</span><span class="live__feed-item__time">just now</span>`;
            feed.prepend(item);
            if (feed.children.length > 6) feed.lastChild.remove();
        }, 5000);
    }

    // Spawn Floating 3D Video Cards to emphasize "Short Video Platform"
    if (!isMobile) {
        const targetSections = [document.querySelector('.section--screens'), document.querySelector('.section--beta')];

        targetSections.forEach(sec => {
            if (!sec) return;

            for (let i = 0; i < 4; i++) {
                const card = document.createElement('div');
                card.className = 'short-video-float';

                const gradient = document.createElement('div');
                gradient.className = 'float-gradient';
                card.appendChild(gradient);

                sec.appendChild(card);

                // Random initial placement
                gsap.set(card, {
                    left: gsap.utils.random(10, 80) + "%",
                    top: gsap.utils.random(10, 80) + "%",
                    z: gsap.utils.random(-400, 100),
                    rotationX: gsap.utils.random(-25, 25),
                    rotationY: gsap.utils.random(-35, 35),
                    rotationZ: gsap.utils.random(-20, 20),
                    opacity: gsap.utils.random(0.3, 0.7)
                });

                // Continuous drifting and rotating
                gsap.to(card, {
                    y: "-=200",
                    x: "+=random(-80, 80)",
                    rotationX: "+=random(-40, 40)",
                    rotationY: "+=random(-50, 50)",
                    rotationZ: "+=random(-15, 15)",
                    duration: gsap.utils.random(12, 22),
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });
            }
        });
    }

    // Global Activity Map logic moved to 3d-fx.js (Three.js 3D Globe)
});
