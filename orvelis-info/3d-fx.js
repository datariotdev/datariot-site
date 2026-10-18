console.log('3D FX Script: Initiating...');

// Ensure ThreeJS is loaded
window.addEventListener('load', () => {
    if (typeof THREE === 'undefined') {
        console.error('Three.js failed to load.');
        return;
    }

    /* =========================================================
       ANIMATION 1: THE AI CORE (Middle - Manifesto Section)
       ========================================================= */
    function initMiddleAnimation() {
        const container = document.getElementById('canvas-3d-middle');
        if (!container) return;

        // Scene Setup
        const scene = new THREE.Scene();
        // The background is handled by CSS, so we set transparent alpha
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            container.appendChild(renderer.domElement);
        } catch (e) {
            console.warn('initMiddleAnimation: Renderer creation failed.', e);
            return;
        }

        // Lights
        const light = new THREE.DirectionalLight(0x0EA5E9, 1);
        light.position.set(1, 1, 2);
        scene.add(light);
        const ambient = new THREE.AmbientLight(0x404040); // Soft white light
        scene.add(ambient);

        // Object: AI Core Sphere (Icosahedron) - reduced detail
        const geometry = new THREE.IcosahedronGeometry(2, 1);

        // We will create a dual-material setup to make it look premium
        const materialCore = new THREE.MeshPhongMaterial({
            color: 0x0EA5E9,
            emissive: 0x0EA5E9,
            emissiveIntensity: 0.2,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });

        const sphereCore = new THREE.Mesh(geometry, materialCore);
        scene.add(sphereCore);

        // Orbiting particles
        const particleCount = 200;
        const particlesGeometry = new THREE.BufferGeometry();
        const posArray = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 8;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            color: 0x7DD3FC,
            transparent: true,
            opacity: 0.6
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particleMaterial);
        scene.add(particlesMesh);

        camera.position.z = 5;

        // Mouse interaction variables
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - windowHalfX) * 0.001;
            mouseY = (event.clientY - windowHalfY) * 0.001;
        });

        // Setup scroll scaling using GSAP
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.to(sphereCore.scale, {
                scrollTrigger: {
                    trigger: "#manifesto",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1
                },
                x: 1.5,
                y: 1.5,
                z: 1.5,
                ease: "none"
            });
        }

        // Animation Loop
        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);

            // Rotate core
            sphereCore.rotation.y += 0.005;
            sphereCore.rotation.x += 0.002;

            // Rotate particles slowly
            particlesMesh.rotation.y -= 0.002;

            // Mouse interaction
            targetX = mouseX * 2;
            targetY = mouseY * 2;
            sphereCore.rotation.y += 0.05 * (targetX - sphereCore.rotation.y);
            sphereCore.rotation.x += 0.05 * (targetY - sphereCore.rotation.x);

            // Float up and down
            const elapsedTime = clock.getElapsedTime();
            sphereCore.position.y = Math.sin(elapsedTime * 0.5) * 0.3;

            renderer.render(scene, camera);
        }
        animate();

        // Handle Resize
        window.addEventListener('resize', () => {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }

    /* =========================================================
       ANIMATION 2: THE IDEA COLLISION (End - Debates Section)
       ========================================================= */
    function initEndAnimation() {
        const container = document.getElementById('canvas-3d-end');
        if (!container) return;

        // Scene Setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            container.appendChild(renderer.domElement);
        } catch (e) {
            console.warn('initEndAnimation: Renderer creation failed.', e);
            return;
        }

        camera.position.z = 6;

        // Lights
        const pointLight1 = new THREE.PointLight(0x38BDF8, 2, 50);
        pointLight1.position.set(2, 3, 4);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x0EA5E9, 2, 50);
        pointLight2.position.set(-2, -3, -4);
        scene.add(pointLight2);

        // The central Torus Knot
        const geometry = new THREE.TorusKnotGeometry(1.5, 0.4, 128, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0x0EA5E9,
            metalness: 0.8,
            roughness: 0.2,
            wireframe: true,
            emissive: 0x38BDF8,
            emissiveIntensity: 0.4
        });
        const torusKnot = new THREE.Mesh(geometry, material);
        scene.add(torusKnot);

        // Surrounding geometry logic (Ideals colliding)
        const boxes = [];
        const boxGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const boxMat = new THREE.MeshStandardMaterial({
            color: 0x7DD3FC,
            transparent: true,
            opacity: 0.7,
            roughness: 0.1,
            metalness: 0.9
        });

        for (let i = 0; i < 12; i++) {
            const box = new THREE.Mesh(boxGeo, boxMat);
            box.position.set(
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8
            );
            // Save initial position for orbiting math
            box.userData = {
                angle: Math.random() * Math.PI * 2,
                radius: 2 + Math.random() * 3,
                speed: 0.01 + Math.random() * 0.02
            };
            scene.add(box);
            boxes.push(box);
        }

        // GSAP Scroll Interaction
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.to(torusKnot.rotation, {
                scrollTrigger: {
                    trigger: "#debates",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1
                },
                x: 4,
                y: 4,
                ease: "none"
            });
        }

        // Animation Loop
        function animate() {
            requestAnimationFrame(animate);

            // Default slow rotation
            torusKnot.rotation.z += 0.001;

            // Orbit the boxes around the torus
            boxes.forEach(box => {
                box.userData.angle += box.userData.speed;
                box.position.x = Math.cos(box.userData.angle) * box.userData.radius;
                box.position.z = Math.sin(box.userData.angle) * box.userData.radius;
                box.rotation.x += box.userData.speed;
                box.rotation.y += box.userData.speed;
            });

            renderer.render(scene, camera);
        }
        animate();

        // Handle Resize
        window.addEventListener('resize', () => {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }

    /* =========================================================
       ANIMATION 3: PHONE SCREENS VORTEX (Top - Hero Section)
       ========================================================= */
    function initVideoScreensAnimation() {
        const container = document.getElementById('canvas-3d-hero');
        if (!container) return;

        const scene = new THREE.Scene();
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        scene.fog = new THREE.Fog(isLight ? 0xffffff : 0x020408, 5, 20);

        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, logarithmicDepthBuffer: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.appendChild(renderer.domElement);
        } catch (e) {
            console.warn('initVideoScreensAnimation: Renderer creation failed.', e);
            return;
        }

        camera.position.z = 8;
        camera.position.y = 2; // looking slightly down

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, isLight ? 0.8 : 0.5);
        scene.add(ambient);

        const pointLight = new THREE.PointLight(0x0EA5E9, isLight ? 1.5 : 2, 50);
        pointLight.position.set(0, 5, 5);
        scene.add(pointLight);

        // Videos/Phones (vertical 9:16 aspect ratio roughly)
        const frameWidth = 1.2;
        const frameHeight = 2.1;
        const geometry = new THREE.PlaneGeometry(frameWidth, frameHeight);

        // A glassmorphic wireframe material or slightly opaque panel
        const material = new THREE.MeshBasicMaterial({
            color: 0x0EA5E9,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            wireframe: false
        });

        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0.8 });

        const screens = [];
        const numScreens = window.innerWidth < 768 ? 15 : 22;

        for (let i = 0; i < numScreens; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
            mesh.add(edges);

            // Position them in a large cylinder/funnel around the user
            const angle = (i / numScreens) * Math.PI * 2 + Math.random();
            const radius = 6 + Math.random() * 4;
            const yPos = (Math.random() - 0.5) * 15;

            mesh.position.set(Math.cos(angle) * radius, yPos, Math.sin(angle) * radius);

            // Point the screens generally towards the center
            mesh.lookAt(0, mesh.position.y, 0);

            // Add some unique floating parameters
            mesh.userData = {
                angle: angle,
                radius: radius,
                ySpeed: 0.01 + Math.random() * 0.02,
                rotSpeed: (Math.random() - 0.5) * 0.01
            };

            scene.add(mesh);
            screens.push(mesh);
        }

        // Add some floating glowing orbs (like play buttons)
        const orbGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const orbMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
        for (let i = 0; i < 15; i++) {
            const orb = new THREE.Mesh(orbGeo, orbMat);
            orb.position.set(
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 10
            );
            scene.add(orb);
        }

        // Mouse interaction for the camera
        let mouseX = 0;
        let mouseY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - windowHalfX) * 0.0005; // very subtle
            mouseY = (event.clientY - windowHalfY) * 0.0005;
        });

        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);

            // Move screens up, mimicking vertical scroll feed
            screens.forEach(screen => {
                screen.position.y += screen.userData.ySpeed;
                screen.userData.angle += 0.001; // slow rotation around center
                screen.position.x = Math.cos(screen.userData.angle) * screen.userData.radius;
                screen.position.z = Math.sin(screen.userData.angle) * screen.userData.radius;
                screen.lookAt(0, screen.position.y, 0);

                // Reset position if too high
                if (screen.position.y > 10) {
                    screen.position.y = -10;
                }
            });

            // Camera subtle lag to mouse
            camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
            camera.position.y += (-mouseY * 5 + 2 - camera.position.y) * 0.05;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }

    /* =========================================================
       ANIMATION 4: NEURAL WEB (Features Section)
       ========================================================= */
    function initFeaturesAnimation() {
        const container = document.getElementById('canvas-3d-features');
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.appendChild(renderer.domElement);
        } catch (e) {
            console.warn('initFeaturesAnimation: Renderer creation failed.', e);
            return;
        }

        camera.position.z = 10;

        const group = new THREE.Group();
        scene.add(group);

        const particleCount = window.innerWidth < 768 ? 60 : 100;
        const maxDistance = 2.8;

        // Create particles (nodes)
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            // Spherical distribution
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(Math.random() * 2 - 1);
            const r = Math.cbrt(Math.random()) * 5; // Radius up to 5

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            velocities.push({
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.computeBoundingSphere();

        // White/Cyan glowing points (Ice Blue for platform theme)
        const material = new THREE.PointsMaterial({
            color: 0xD9E4FF,
            size: 0.15,
            transparent: true,
            opacity: 0.8
        });

        const particles = new THREE.Points(geometry, material);
        group.add(particles);

        // Lines connecting proximal nodes (Luminous translucent secondary accent)
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xA5C6FF,
            transparent: true,
            opacity: 0.15
        });

        // We use a completely dynamic approach to lines
        const linesGeometry = new THREE.BufferGeometry();
        // Allocate space for maximum possible lines, this is just visual approximations
        const maxLines = particleCount * 4;
        const linePositions = new Float32Array(maxLines * 6);
        linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

        const linesMesh = new THREE.LineSegments(linesGeometry, lineMaterial);
        group.add(linesMesh);

        // GSAP Scroll Interaction
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.to(group.rotation, {
                scrollTrigger: {
                    trigger: "#features",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1
                },
                y: Math.PI * 2,
                x: Math.PI,
                ease: "none"
            });
            gsap.fromTo(group.scale,
                { x: 0.6, y: 0.6, z: 0.6 },
                {
                    scrollTrigger: {
                        trigger: "#features",
                        start: "top bottom",
                        end: "center center",
                        scrub: 1
                    },
                    x: 1, y: 1, z: 1,
                    ease: "power2.out"
                }
            );
        }

        // Mouse interaction
        let mouseX = 0;
        let mouseY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - windowHalfX) * 0.001;
            mouseY = (event.clientY - windowHalfY) * 0.001;
        });

        function animate() {
            requestAnimationFrame(animate);

            // Subtle base rotation
            group.rotation.y += 0.002;
            group.rotation.x += 0.001;

            // Mouse drift
            group.rotation.y += 0.05 * (mouseX - group.rotation.y);
            group.rotation.x += 0.05 * (mouseY - group.rotation.x);

            // Animate particles directly inside buffer
            const positions = particles.geometry.attributes.position.array;
            let lineIndex = 0;

            // Performance optimization: only recalculate lines every 2nd frame
            const frameCount = Math.floor(Date.now() / 16) % 2;
            const updateLines = frameCount === 0;

            // Move points
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] += velocities[i].x;
                positions[i3 + 1] += velocities[i].y;
                positions[i3 + 2] += velocities[i].z;

                // Bounce off abstract boundary
                if (Math.abs(positions[i3]) > 5) velocities[i].x *= -1;
                if (Math.abs(positions[i3 + 1]) > 5) velocities[i].y *= -1;
                if (Math.abs(positions[i3 + 2]) > 5) velocities[i].z *= -1;

                // Update connections (Only if it's the update frame)
                if (updateLines) {
                    for (let j = i + 1; j < particleCount; j++) {
                        const j3 = j * 3;
                        const dx = positions[i3] - positions[j3];
                        const dy = positions[i3 + 1] - positions[j3 + 1];
                        const dz = positions[i3 + 2] - positions[j3 + 2];
                        const distSq = dx * dx + dy * dy + dz * dz;

                        // If close enough, draw/update a line
                        if (distSq < maxDistance * maxDistance && lineIndex < maxLines * 6) {
                            linePositions[lineIndex++] = positions[i3];
                            linePositions[lineIndex++] = positions[i3 + 1];
                            linePositions[lineIndex++] = positions[i3 + 2];
                            linePositions[lineIndex++] = positions[j3];
                            linePositions[lineIndex++] = positions[j3 + 1];
                            linePositions[lineIndex++] = positions[j3 + 2];
                        }
                    }
                }

            }

            // Zero out remaining line segments
            for (let i = lineIndex; i < maxLines * 6; i++) {
                linePositions[i] = 0;
            }

            particles.geometry.attributes.position.needsUpdate = true;
            linesMesh.geometry.attributes.position.needsUpdate = true;

            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }

    /* =========================================================
       ANIMATION 5: THE GLOBAL GLOBE (Global Platform Section)
       ========================================================= */
    function initGlobeAnimation() {
        const container = document.getElementById('canvas-3d-globe');
        if (!container) return;

        console.log('Globe: Initializing...');

        function start2D() {
            console.log('Globe: Falling back to 2D.');
            render2DFallback(container);
        }

        // Try 3D
        try {
            const W = container.clientWidth || container.offsetWidth || 340;
            const H = container.clientHeight || container.offsetHeight || W;

            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(W, H);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.appendChild(renderer.domElement);

            const scene = new THREE.Scene();
            const isMobile = window.innerWidth < 768;
            const segments = isMobile ? 32 : 64; // Optimized segments
            const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
            camera.position.z = isMobile ? 11 : 12; // Adjust zoom on mobile

            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const globeColor = isDark ? 0x0EA5E9 : 0x0284C7;

            const radius = isMobile ? 2.8 : 4.5;
            const globe = new THREE.Points(
                new THREE.SphereGeometry(radius, segments, segments),
                new THREE.PointsMaterial({ 
                    color: globeColor, 
                    size: isMobile ? 0.12 : 0.08, // Larger dots on mobile for visibility
                    transparent: true, 
                    opacity: 0.9 
                })
            );
            scene.add(globe);

            const cities = [
                { lat: 55.75, lon: 37.62 }, { lat: 35.68, lon: 139.69 },
                { lat: -23.55, lon: -46.63 }, { lat: 40.71, lon: -74.00 },
                { lat: 6.52, lon: 3.38 }, { lat: 52.52, lon: 13.41 },
                { lat: 19.08, lon: 72.88 }, { lat: -33.87, lon: 151.21 },
                { lat: 25.20, lon: 55.27 }, { lat: 1.35, lon: 103.82 }
            ];

            const cityGroup = new THREE.Group();
            globe.add(cityGroup);

            cities.forEach(city => {
                const phi = (90 - city.lat) * (Math.PI / 180);
                const theta = (city.lon + 180) * (Math.PI / 180);
                const dot = new THREE.Mesh(
                    new THREE.SphereGeometry(0.12, 12, 12),
                    new THREE.MeshBasicMaterial({ color: isDark ? 0x38BDF8 : 0x0369A1 })
                );
                dot.position.set(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
                cityGroup.add(dot);
                dot.userData = { pulse: Math.random() * Math.PI };
            });

            function animate() {
                requestAnimationFrame(animate);
                globe.rotation.y += 0.003;
                cityGroup.children.forEach(c => {
                    c.userData.pulse += 0.05;
                    c.scale.setScalar(1 + Math.sin(c.userData.pulse) * 0.4);
                });
                renderer.render(scene, camera);
            }
            animate();

            window.addEventListener('resize', () => {
                const nW = container.clientWidth;
                const nH = container.clientHeight;
                camera.aspect = nW / nH;
                camera.updateProjectionMatrix();
                renderer.setSize(nW, nH);
            });

            console.log('Globe: 3D Render active.');

        } catch (e) {
            start2D();
        }
    }

    function render2DFallback(container) {
        if (container.querySelector('canvas')) return;
        console.log('Globe: Redesigned 2D Fallback active.');

        const canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const cities = [
            [55.75, 37.62], [35.68, 139.69], [-23.55, -46.63], [40.71, -74],
            [6.52, 3.38], [52.52, 13.41], [19.08, 72.88], [-33.87, 151], [25.2, 55.2]
        ];

        function resize() {
            canvas.width = container.clientWidth * window.devicePixelRatio;
            canvas.height = container.clientHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
        resize();
        window.addEventListener('resize', resize);

        function draw(now) {
            const W = container.clientWidth;
            const H = container.clientHeight;
            if (W === 0 || H === 0) {
                requestAnimationFrame(draw);
                return;
            }

            ctx.clearRect(0, 0, W, H);

            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const accentBase = isDark ? '14, 165, 233' : '2, 132, 199';
            const rotation = now * 0.0003; // Slightly faster rotation
            const isMobile = window.innerWidth < 768;
            const radius = Math.min(W, H) * (isMobile ? 0.48 : 0.55);
            const centerX = W / 2;
            const centerY = H / 2;

            // Draw Pseudo-3D Dot Sphere
            const rows = 40;
            const cols = 80;

            for (let i = 0; i < rows; i++) {
                const phi = (i / rows) * Math.PI;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                for (let j = 0; j < cols; j++) {
                    const theta = (j / cols) * Math.PI * 2 + rotation;

                    // 3D coordinates
                    const x = radius * sinPhi * Math.cos(theta);
                    const y = radius * cosPhi;
                    const z = radius * sinPhi * Math.sin(theta);

                    // Only draw points on the front side (z > 0)
                    if (z > 0) {
                        const opacity = (z / radius) * (isDark ? 0.6 : 0.8); // Higher opacity in light mode
                        const size = (z / radius) * (isMobile ? 2.2 : 1.5) + 0.5; // Larger points on mobile

                        // Simple "land" noise simulation
                        const land = Math.sin(phi * 6) * Math.cos(theta * 8) + Math.cos(phi * 4) * Math.sin(theta * 6);

                        if (land > 0.1) {
                            ctx.fillStyle = `rgba(${accentBase}, ${opacity})`;
                            ctx.beginPath();
                            ctx.arc(centerX + x, centerY + y, size, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
            }

            // Draw Rotating City Markers
            cities.forEach(([lat, lon], idx) => {
                const phi = (90 - lat) * (Math.PI / 180);
                const theta = (lon + 180) * (Math.PI / 180) + rotation;

                const x = radius * Math.sin(phi) * Math.cos(theta);
                const y = radius * Math.cos(phi);
                const z = radius * Math.sin(phi) * Math.sin(theta);

                if (z > 0) {
                    const p = Math.sin(now * 0.003 + idx) * 0.5 + 0.5;
                    const scale = z / radius;

                    // Outer pulse
                    ctx.fillStyle = `rgba(${accentBase}, ${0.1 * p * scale})`;
                    ctx.beginPath();
                    ctx.arc(centerX + x, centerY + y, (15 + p * 20) * scale, 0, Math.PI * 2);
                    ctx.fill();

                    // Inner core
                    ctx.fillStyle = `rgba(${accentBase}, ${0.8 * scale})`;
                    ctx.beginPath();
                    ctx.arc(centerX + x, centerY + y, 3 * scale, 0, Math.PI * 2);
                    ctx.fill();

                    // Glow
                    ctx.shadowBlur = 10 * scale;
                    ctx.shadowColor = `rgb(${accentBase})`;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });

            requestAnimationFrame(draw);
        }
        requestAnimationFrame(draw);
    }

    /* =========================================================
       ANIMATION 6: 3D CARD TILT (Manifesto Cards)
       ========================================================= */
    function initCardTilt() {
        // Target all types of interactive cards
        const cards = document.querySelectorAll('.value-card, .advantage-card, .feature-card');
        if (!cards.length) return;

        cards.forEach(card => {
            // Add glare element if not exists
            let glare = card.querySelector('.card-glare');
            if (!glare) {
                glare = document.createElement('div');
                glare.className = 'card-glare';
                card.appendChild(glare);
            }

            // Store initial state
            const is3DFeature = card.classList.contains('feature-card--3d');
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            if (!isTouchDevice) {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;

                    // Intensity of tilt
                    const rotateX = ((y - centerY) / centerY) * -12;
                    const rotateY = ((x - centerX) / centerX) * 12;

                    // Update card transform
                    let transformStr = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

                    if (is3DFeature) {
                        transformStr += ` translateY(-5px)`;
                    } else {
                        transformStr += ` translateY(-8px)`;
                    }

                    card.style.transform = transformStr;

                    // Update glare position
                    const glareX = (x / rect.width) * 100;
                    const glareY = (y / rect.height) * 100;
                    glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.1) 0%, transparent 80%)`;
                    glare.style.opacity = '1';

                    // Parallax layers for 3D cards
                    if (is3DFeature) {
                        const layers = card.querySelectorAll('.feat3d, .feature-card__text-3d');
                        layers.forEach(layer => {
                            const depth = layer.classList.contains('feat3d') ? 50 : 30;
                            layer.style.transform = `translateZ(${depth}px) rotateX(${rotateX * 0.3}deg) rotateY(${rotateY * 0.3}deg)`;
                        });

                        const bg = card.querySelector('.feature-card__parallax-bg');
                        if (bg) {
                            bg.style.transform = `translateZ(-20px) translate(${(x - centerX) * 0.05}px, ${(y - centerY) * 0.05}px)`;
                            bg.style.opacity = '1';
                        }
                    } else {
                        // Standard cards
                        const icon = card.querySelector('.card-icon-3d, .value-card__icon-3d');
                        if (icon) icon.style.transform = `translateZ(60px)`;

                        const text = card.querySelector('.value-card__text, h3, h4');
                        if (text) text.style.transform = `translateZ(30px)`;
                    }
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
                    glare.style.opacity = '0';

                    const elementsToReset = card.querySelectorAll('.feature-card__icon-3d, .feature-card__text-3d, .feature-card__parallax-bg, .card-icon-3d, .value-card__icon-3d, .value-card__text, h3, h4, .feat3d');
                    elementsToReset.forEach(el => {
                        el.style.transform = '';
                        if (el.classList.contains('feature-card__parallax-bg')) el.style.opacity = '0';
                    });
                });
            }
        });

        // Device Orientation for Mobile Tilt
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if (e.beta === null || e.gamma === null) return;

                // Subtle tilt based on phone tilt
                const rotateX = Math.max(-10, Math.min(10, (e.beta - 45) * 0.5));
                const rotateY = Math.max(-10, Math.min(10, e.gamma * 0.5));

                const cards3d = document.querySelectorAll('.feature-card--3d');
                cards3d.forEach(card => {
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

                    const bg = card.querySelector('.feature-card__parallax-bg');
                    if (bg) {
                        bg.style.opacity = '0.5';
                        bg.style.transform = `translateZ(-20px) translate(${rotateY * 2}px, ${rotateX * 2}px)`;
                    }
                });
            });
        }
    }

    /* =========================================================
       ANIMATION 7: CSS-BASED 3D ICONS (Cubes)
       ========================================================= */
    function initCSS3DIcons() {
        const containers = document.querySelectorAll('.card-icon-3d, .value-card__icon-3d');
        if (!containers.length) return;

        containers.forEach(container => {
            // Create a 3D cube structure
            container.innerHTML = `
                <div class="cube-3d">
                    <div class="cube-3d__face cube-3d__face--front"></div>
                    <div class="cube-3d__face cube-3d__face--back"></div>
                    <div class="cube-3d__face cube-3d__face--right"></div>
                    <div class="cube-3d__face cube-3d__face--left"></div>
                    <div class="cube-3d__face cube-3d__face--top"></div>
                    <div class="cube-3d__face cube-3d__face--bottom"></div>
                </div>
            `;

            // Add a secondary smaller cube for visual richness
            const secondaryCube = document.createElement('div');
            secondaryCube.className = 'cube-3d';
            secondaryCube.style.width = '15px';
            secondaryCube.style.height = '15px';
            secondaryCube.style.position = 'absolute';
            secondaryCube.style.right = '0';
            secondaryCube.style.top = '0';
            secondaryCube.style.animationDelay = '-3s';

            secondaryCube.innerHTML = `
                <div class="cube-3d__face cube-3d__face--front" style="transform: rotateY(0deg) translateZ(7.5px)"></div>
                <div class="cube-3d__face cube-3d__face--back" style="transform: rotateY(180deg) translateZ(7.5px)"></div>
                <div class="cube-3d__face cube-3d__face--right" style="transform: rotateY(90deg) translateZ(7.5px)"></div>
                <div class="cube-3d__face cube-3d__face--left" style="transform: rotateY(-90deg) translateZ(7.5px)"></div>
                <div class="cube-3d__face cube-3d__face--top" style="transform: rotateX(90deg) translateZ(7.5px)"></div>
                <div class="cube-3d__face cube-3d__face--bottom" style="transform: rotateX(-90deg) translateZ(7.5px)"></div>
            `;

            container.appendChild(secondaryCube);
        });
    }

    /* =========================================================
       ANIMATION 6: THE DEBATE CONNECTION (Manifesto Section)
       ========================================================= */
    function initManifestoConnectionAnimation() {
        const container = document.getElementById('canvas-3d-manifesto');
        if (!container) return;

        // Scene Setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 10;

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.appendChild(renderer.domElement);
        } catch (e) {
            console.warn('initManifestoConnectionAnimation: Renderer creation failed.', e);
            return;
        }

        // Ambient lights & point lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.45);
        scene.add(ambient);

        const proLight = new THREE.PointLight(0xD9E4FF, 3.5, 15);
        proLight.position.set(-3, 0, 2);
        scene.add(proLight);

        const conLight = new THREE.PointLight(0x8B5CF6, 3.5, 15);
        conLight.position.set(3, 0, 2);
        scene.add(conLight);

        const connectionGroup = new THREE.Group();
        scene.add(connectionGroup);

        // Cyber Grid Background
        const gridHelper = new THREE.GridHelper(30, 24, 0x1E293B, 0x111318);
        gridHelper.position.y = -3.8;
        gridHelper.position.z = -1;
        gridHelper.rotation.x = Math.PI / 10;
        gridHelper.material.opacity = 0.45;
        gridHelper.material.transparent = true;
        connectionGroup.add(gridHelper);

        // Pro Node Group (Ice Blue Gyro Hologram)
        const proGroup = new THREE.Group();
        proGroup.position.set(-3, 0, 0);
        connectionGroup.add(proGroup);

        const proCoreGeo = new THREE.SphereGeometry(0.18, 16, 16);
        const proCoreMat = new THREE.MeshBasicMaterial({ color: 0xD9E4FF });
        const proCore = new THREE.Mesh(proCoreGeo, proCoreMat);
        proGroup.add(proCore);

        const proInnerGeo = new THREE.IcosahedronGeometry(0.55, 1);
        const proInnerMat = new THREE.MeshBasicMaterial({
            color: 0x38BDF8,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        const proInner = new THREE.Mesh(proInnerGeo, proInnerMat);
        proGroup.add(proInner);

        const proOuterGeo = new THREE.DodecahedronGeometry(0.8, 0);
        const proOuterMat = new THREE.MeshBasicMaterial({
            color: 0xD9E4FF,
            wireframe: true,
            transparent: true,
            opacity: 0.35
        });
        const proOuter = new THREE.Mesh(proOuterGeo, proOuterMat);
        proGroup.add(proOuter);

        const proRingGeo1 = new THREE.RingGeometry(1.05, 1.07, 64);
        const proRingMat1 = new THREE.MeshBasicMaterial({ color: 0x38BDF8, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
        const proRing1 = new THREE.Mesh(proRingGeo1, proRingMat1);
        proGroup.add(proRing1);

        const proRingGeo2 = new THREE.RingGeometry(1.15, 1.17, 64);
        const proRingMat2 = new THREE.MeshBasicMaterial({ color: 0xD9E4FF, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
        const proRing2 = new THREE.Mesh(proRingGeo2, proRingMat2);
        proRing2.rotation.x = Math.PI / 4;
        proRing2.rotation.y = Math.PI / 4;
        proGroup.add(proRing2);

        // Con Node Group (Violet/Indigo Gyro Hologram)
        const conGroup = new THREE.Group();
        conGroup.position.set(3, 0, 0);
        connectionGroup.add(conGroup);

        const conCoreGeo = new THREE.SphereGeometry(0.18, 16, 16);
        const conCoreMat = new THREE.MeshBasicMaterial({ color: 0x8B5CF6 });
        const conCore = new THREE.Mesh(conCoreGeo, conCoreMat);
        conGroup.add(conCore);

        const conInnerGeo = new THREE.IcosahedronGeometry(0.55, 1);
        const conInnerMat = new THREE.MeshBasicMaterial({
            color: 0x8B5CF6,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        const conInner = new THREE.Mesh(conInnerGeo, conInnerMat);
        conGroup.add(conInner);

        const conOuterGeo = new THREE.DodecahedronGeometry(0.8, 0);
        const conOuterMat = new THREE.MeshBasicMaterial({
            color: 0x6366F1,
            wireframe: true,
            transparent: true,
            opacity: 0.35
        });
        const conOuter = new THREE.Mesh(conOuterGeo, conOuterMat);
        conGroup.add(conOuter);

        const conRingGeo1 = new THREE.RingGeometry(1.05, 1.07, 64);
        const conRingMat1 = new THREE.MeshBasicMaterial({ color: 0x8B5CF6, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
        const conRing1 = new THREE.Mesh(conRingGeo1, conRingMat1);
        conGroup.add(conRing1);

        const conRingGeo2 = new THREE.RingGeometry(1.15, 1.17, 64);
        const conRingMat2 = new THREE.MeshBasicMaterial({ color: 0x6366F1, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
        const conRing2 = new THREE.Mesh(conRingGeo2, conRingMat2);
        conRing2.rotation.x = -Math.PI / 4;
        conRing2.rotation.y = Math.PI / 4;
        conGroup.add(conRing2);

        // Connections curves (Multi-threaded Neural Connection)
        const curves = [];
        const curvePoints = 60;
        const curveOffsets = [
            new THREE.Vector3(0, 1.6, 0.4),
            new THREE.Vector3(0, -1.6, -0.4),
            new THREE.Vector3(0, 0.3, 1.0),
            new THREE.Vector3(0, -0.3, 0.8)
        ];

        curveOffsets.forEach((offset, idx) => {
            const start = new THREE.Vector3(-3, 0, 0);
            const end = new THREE.Vector3(3, 0, 0);
            const mid = new THREE.Vector3(0, 0, 0).add(offset);
            
            const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
            curves.push(curve);

            // Main line
            const points = curve.getPoints(curvePoints);
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            
            const lineMat = new THREE.LineBasicMaterial({
                color: idx % 2 === 0 ? 0x38BDF8 : 0x8B5CF6,
                transparent: true,
                opacity: 0.35
            });
            const line = new THREE.Line(lineGeo, lineMat);
            connectionGroup.add(line);

            // Dynamic offset fiber lines
            const offsetPoints = points.map(p => new THREE.Vector3(p.x, p.y + (Math.sin(p.x * 2) * 0.05), p.z + (Math.cos(p.x * 2) * 0.05)));
            const offsetGeo = new THREE.BufferGeometry().setFromPoints(offsetPoints);
            const offsetMat = new THREE.LineBasicMaterial({
                color: idx % 2 === 0 ? 0xD9E4FF : 0x6366F1,
                transparent: true,
                opacity: 0.15
            });
            const offsetLine = new THREE.Line(offsetGeo, offsetMat);
            connectionGroup.add(offsetLine);
        });

        // Flowing data packets (Luminous pulses)
        const packets = [];
        const packetCount = 12;
        const packetGeo = new THREE.SphereGeometry(0.09, 16, 16);

        for (let i = 0; i < packetCount; i++) {
            const curveIdx = i % curves.length;
            const color = curveIdx % 2 === 0 ? 0xD9E4FF : 0x8B5CF6;
            
            const packetMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.95
            });

            const packet = new THREE.Mesh(packetGeo, packetMat);
            
            const t = Math.random();
            const pos = curves[curveIdx].getPointAt(t);
            packet.position.copy(pos);

            packet.userData = {
                t: t,
                speed: 0.003 + Math.random() * 0.005,
                curveIdx: curveIdx,
                pulseSpeed: 3 + Math.random() * 5
            };

            connectionGroup.add(packet);
            packets.push(packet);
        }

        // Ambient background stars/data nodes
        const starCount = 100;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            starPos[i] = (Math.random() - 0.5) * 16;
            starPos[i+1] = (Math.random() - 0.5) * 10;
            starPos[i+2] = (Math.random() - 0.5) * 8;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({
            size: 0.05,
            color: 0xD9E4FF,
            transparent: true,
            opacity: 0.5
        });
        const starPoints = new THREE.Points(starGeo, starMat);
        scene.add(starPoints);

        // Mouse move listener for tilt effect
        let mouseX = 0;
        let mouseY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - windowHalfX) * 0.0003;
            mouseY = (event.clientY - windowHalfY) * 0.0003;
        });

        // Animation Loop
        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);

            const elapsed = clock.getElapsedTime();

            // Rotate inner and outer shells of Pro Node
            proInner.rotation.y += 0.02;
            proInner.rotation.x += 0.01;
            proOuter.rotation.y -= 0.01;
            proOuter.rotation.z += 0.01;
            proRing1.rotation.z = elapsed * 0.5;
            proRing2.rotation.z = -elapsed * 0.5;

            // Rotate inner and outer shells of Con Node
            conInner.rotation.y -= 0.02;
            conInner.rotation.x += 0.01;
            conOuter.rotation.y += 0.01;
            conOuter.rotation.z -= 0.01;
            conRing1.rotation.z = -elapsed * 0.5;
            conRing2.rotation.z = elapsed * 0.5;

            // Subtle pulsing size for main core nodes
            const pulse = 1 + Math.sin(elapsed * 4) * 0.15;
            proCore.scale.setScalar(pulse);
            conCore.scale.setScalar(pulse);

            // Animate packets along curves
            packets.forEach(packet => {
                packet.userData.t += packet.userData.speed;
                if (packet.userData.t > 1.0) {
                    packet.userData.t = 0.0;
                    packet.userData.speed = 0.003 + Math.random() * 0.005;
                }
                const pos = curves[packet.userData.curveIdx].getPointAt(packet.userData.t);
                packet.position.copy(pos);

                // Scale pulse
                const packetScale = 1 + Math.sin(elapsed * packet.userData.pulseSpeed) * 0.25;
                packet.scale.setScalar(packetScale);
            });

            // Drifting stars
            starPoints.rotation.y = elapsed * 0.01;

            // Tilt connection group based on mouse position
            connectionGroup.rotation.y += 0.05 * (mouseX * 5 - connectionGroup.rotation.y);
            connectionGroup.rotation.x += 0.05 * (mouseY * 5 - connectionGroup.rotation.x);

            renderer.render(scene, camera);
        }

        animate();

        // Handle Resize
        window.addEventListener('resize', () => {
            if (!container) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
    }

    // Initialize all with high resilience
    try { initVideoScreensAnimation(); } catch (e) { console.warn('Hero 3D failed:', e); }
    try { initMiddleAnimation(); } catch (e) { console.warn('Middle 3D failed:', e); }
    try { initFeaturesAnimation(); } catch (e) { console.warn('Features 3D failed:', e); }
    try { initEndAnimation(); } catch (e) { console.warn('End 3D failed:', e); }
    try { initGlobeAnimation(); } catch (e) { console.warn('Globe 3D/2D failed:', e); }
    try { initCardTilt(); } catch (e) { console.warn('Card Tilt failed:', e); }
    try { initCSS3DIcons(); } catch (e) { console.warn('CSS 3D Icons failed:', e); }
    try { initManifestoConnectionAnimation(); } catch (e) { console.warn('Manifesto connection failed:', e); }
});
