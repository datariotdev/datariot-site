/* ===========================================
   DATARIOT Landing Page — Interactions & FX
   =========================================== */
console.log('Datariot Script: Initiating...');

// Initialize Supabase (Global)
let supabase = null;

// Immediate Theme Initialization to prevent flash — checks localStorage
(function () {
    var savedTheme = localStorage.getItem('orvelis-theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
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
   MOTION BUDGET HELPERS
   ======================================= */
// Honour the OS "reduce motion" switch for every decorative effect.
const prefersReducedMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// An element that cannot paint (display:none, 0x0, detached) must not drive
// an animation loop — several effects on this page used to do exactly that.
function isPaintable(el) {
    if (!el || !el.isConnected) return false;
    if (el.getClientRects().length === 0) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
}

// Pointer handlers here write inline styles; without this they run once per
// mousemove event and force a layout each time. Coalesce to one write a frame.
function onPointerFrame(el, type, handler) {
    let frame = 0;
    let latest = null;
    el.addEventListener(type, (e) => {
        latest = { clientX: e.clientX, clientY: e.clientY };
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            if (latest) handler(latest);
        });
    }, { passive: true });
}

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
        if (prefersReducedMotion) return;
        onPointerFrame(fragment, 'mousemove', (e) => {
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

    // === Viewport gate ===
    // Every [data-inview] block only runs its CSS animations while it is on
    // screen. Keeps the decorative SVG loops off the compositor when the
    // section is parked far above/below the fold.
    const inviewTargets = document.querySelectorAll('[data-inview]');
    if (inviewTargets.length > 0) {
        const inviewObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                entry.target.classList.toggle('is-inview', entry.isIntersecting);
            });
        }, { rootMargin: '120px 0px', threshold: 0 });
        inviewTargets.forEach(el => inviewObserver.observe(el));
    }

    // Section-wide Z-Parallax on Scroll
    if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
        // The old Z-parallax pushed every other "how it works" card 50px out of
        // line, so the row read as broken rather than dispersed — and it ran a
        // scrub transform on all three for the whole section. Dropped.

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
        
        onPointerFrame(debateGraphic, 'mousemove', (e) => {
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

    // === Orvelis AI Card 3D Interaction ===
    const orvelisCard = document.querySelector('.orvelis-card-container');
    if (orvelisCard) {
        orvelisCard.style.transformStyle = 'preserve-3d';
        const glare = orvelisCard.querySelector('.orvelis-card-glare');

        onPointerFrame(orvelisCard, 'mousemove', (e) => {
            const rect = orvelisCard.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            // Share mouse position globally for Three.js scene
            window.orvelisMouseX = x;
            window.orvelisMouseY = y;
            window.orvelisMouseActive = true;

            const tiltX = (y - 0.5) * 15; // 3D tilt angles
            const tiltY = (x - 0.5) * -15;

            // Apply tilt and responsive fast transition
            orvelisCard.style.transition = 'transform 0.1s ease-out';
            orvelisCard.style.transform = `perspective(2000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

            // Shifting drop shadow based on mouse position
            const shadowX = (x - 0.5) * -30;
            const shadowY = (y - 0.5) * -30;
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const shadowVal = isDark
                ? `inset 0 0 30px rgba(14, 165, 233, 0.02), ${shadowX}px ${shadowY}px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(14, 165, 233, 0.06)`
                : `${shadowX}px ${shadowY}px 50px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 0 40px rgba(14, 165, 233, 0.06)`;
            orvelisCard.style.setProperty('box-shadow', shadowVal, 'important');

            // Glare highlight tracking
            if (glare) {
                const px = x * 100;
                const py = y * 100;
                glare.style.opacity = '1';
                glare.style.background = isDark 
                    ? `radial-gradient(circle at ${px}% ${py}%, rgba(56, 189, 248, 0.18) 0%, rgba(139, 92, 246, 0.05) 45%, rgba(0,0,0,0) 70%)`
                    : `radial-gradient(circle at ${px}% ${py}%, rgba(14, 165, 233, 0.12) 0%, rgba(255,255,255,0) 70%)`;
            }

            // Parallax translations for child elements (slightly increased depth)
            const header = orvelisCard.querySelector('.orvelis-header');
            const subcards = orvelisCard.querySelectorAll('.orvelis-subcard');

            if (header) {
                header.style.transition = 'transform 0.1s ease-out';
                header.style.transform = `translateZ(50px) translateX(${(x - 0.5) * 15}px) translateY(${(y - 0.5) * 15}px)`;
            }
            subcards.forEach((sub, index) => {
                const zDepth = 75 + index * 25;
                const shift = 20 + index * 12;
                sub.style.transition = 'transform 0.1s ease-out';
                sub.style.transform = `translateZ(${zDepth}px) translateX(${(x - 0.5) * shift}px) translateY(${(y - 0.5) * shift}px)`;
            });
        });

        orvelisCard.addEventListener('mouseleave', () => {
            // Reset global mouse coords
            window.orvelisMouseX = 0.5;
            window.orvelisMouseY = 0.5;
            window.orvelisMouseActive = false;

            // Smooth reset on mouse leave
            orvelisCard.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
            orvelisCard.style.transform = '';
            orvelisCard.style.setProperty('box-shadow', '', 'important');

            if (glare) {
                glare.style.transition = 'opacity 0.6s ease';
                glare.style.opacity = '0';
            }

            const header = orvelisCard.querySelector('.orvelis-header');
            const subcards = orvelisCard.querySelectorAll('.orvelis-subcard');

            if (header) {
                header.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                header.style.transform = '';
            }
            subcards.forEach(sub => {
                sub.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                sub.style.transform = '';
            });
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
        // Skipped on mobile, when motion is reduced, and — the expensive case —
        // when the canvas is hidden by CSS: it used to run an O(n^2) link pass
        // every frame while painting nothing at all.
        if (!canvas || isMobile || prefersReducedMotion || !isPaintable(canvas)) return;
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
        draw(); // rAF is already suspended by the browser while the tab is hidden
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
    if (!isMobile && !prefersReducedMotion && typeof gsap !== 'undefined') {
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
