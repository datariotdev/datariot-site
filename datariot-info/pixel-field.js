/* =========================================================================
   SLIDE 05 — THE PIXEL FIELD
   The backdrop of the cognitive-layer slide: a slow wave surface drawn one
   pixel per 3px cell and quantised to seven navy tones with an ordered
   (Bayer) dither — chunky pixels, no smoothing. Every pixel of the buffer
   is a whole cell, so a 1920x1080 screen is a 640x360 render.

   Plain WebGL, no three.js, with its own budget: it renders only while the
   slide is on screen and the tab is visible, 30 frames a second (every
   frame while the page scrolls), and holds time still under
   prefers-reduced-motion. Without WebGL the CSS navy fill stays and the
   slide still reads. The dithered dissolve at the slide's top and bottom
   edges is a CSS mask, so it moves with the page on the compositor
   instead of trailing a frame behind.
   ========================================================================= */
(() => {
    const section = document.getElementById('ai-core');
    const field = section && section.querySelector('.px-field');
    const canvas = field && field.querySelector('canvas');
    if (!canvas) return;

    const CELL = 3;          // CSS px per field pixel
    const FRAME_MS = 1000 / 30;
    const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    let gl = null;
    try {
        gl = canvas.getContext('webgl', {
            alpha: false,
            antialias: false,
            depth: true,
            stencil: false,
            preserveDrawingBuffer: false,
            powerPreference: 'low-power'
        });
    } catch (e) { gl = null; }
    if (!gl) return;

    // One height function, shared by both stages: the vertex stage displaces
    // the mesh with it, the fragment stage lights every pixel from its slope.
    const FIELD = `
        float field(vec2 p, float t) {
            vec2 q = p;
            q.x += 0.85 * sin(p.y * 0.21 + t * 0.19);
            q.y += 0.65 * sin(p.x * 0.17 - t * 0.15);
            float h = 0.80 * sin(q.x * 0.62 + t * 0.37);
            h += 0.55 * sin(q.y * 0.70 - t * 0.29 + q.x * 0.22);
            h += 0.20 * sin((q.x - q.y) * 1.05 + t * 0.55);
            return h;
        }`;

    const VERT = `
        attribute vec2 aGrid;
        uniform mat4 uViewProj;
        uniform vec3 uSpan;      // near z, far z, half-width per unit of depth
        uniform float uTime;
        varying vec3 vWorld;
        ${FIELD}
        void main() {
            // rows bunch up near the camera, where they are largest on screen
            float z = mix(uSpan.x, uSpan.y, aGrid.y * aGrid.y);
            float x = (aGrid.x * 2.0 - 1.0) * (1.5 + z * uSpan.z);
            vWorld = vec3(x, field(vec2(x, z), uTime), z);
            gl_Position = uViewProj * vec4(vWorld, 1.0);
        }`;

    const FRAG = `
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif
        varying vec3 vWorld;
        uniform float uTime;
        uniform vec3 uEye;
        uniform vec3 uLight;
        uniform vec4 uCalm;      // the headline block, in buffer px from the top left
        uniform float uRows;
        ${FIELD}

        // ordered dither threshold in [0, 1), 4x4 Bayer
        float bayer2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
        float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

        vec3 tone(float i) {
            vec3 c = vec3(0.024, 0.078, 0.216);                    // #061437
            c = mix(c, vec3(0.039, 0.122, 0.298), step(0.5, i));   // #0A1F4C
            c = mix(c, vec3(0.063, 0.173, 0.388), step(1.5, i));   // #102C63
            c = mix(c, vec3(0.110, 0.243, 0.471), step(2.5, i));   // #1C3E78
            c = mix(c, vec3(0.176, 0.314, 0.529), step(3.5, i));   // #2D5087
            c = mix(c, vec3(0.243, 0.384, 0.580), step(4.5, i));   // #3E6294
            c = mix(c, vec3(0.353, 0.490, 0.690), step(5.5, i));   // #5A7DB0
            return c;
        }

        void main() {
            vec2 p = vWorld.xz;
            float e = 0.05;
            float h = field(p, uTime);
            vec3 n = normalize(vec3(h - field(p + vec2(e, 0.0), uTime), e, h - field(p + vec2(0.0, e), uTime)));
            vec3 v = normalize(uEye - vWorld);
            vec3 l = normalize(uLight);

            // wrapped, cubed diffuse: lit faces go steel blue, the far side
            // of each fold drops to the darkest tone, as in the reference
            float wrap = max((dot(n, l) + 0.25) / 1.25, 0.0);
            float spec = pow(max(dot(reflect(-l, n), v), 0.0), 16.0);
            float rim = pow(1.0 - max(dot(n, v), 0.0), 4.0);
            float lum = 0.02 + 1.05 * wrap * wrap * wrap + 0.55 * spec + 0.12 * rim;

            // the mesh reads as a cloth of quads up close, like the reference
            float d = length(uEye - vWorld);
            vec2 g = abs(fract(p * 3.0) - 0.5);
            lum *= 1.0 - 0.3 * step(0.43, max(g.x, g.y)) * exp(-d * 0.1);

            // distance falls off into the dark
            lum *= exp(-d * 0.045);

            // quiet the field behind the headline so the type stays clean
            vec2 px = vec2(gl_FragCoord.x, uRows - gl_FragCoord.y);
            vec2 o = max(max(uCalm.xy - px, px - uCalm.zw), 0.0);
            lum *= 1.0 - 0.72 * (1.0 - smoothstep(0.0, 40.0, length(o)));

            float level = floor(clamp(lum, 0.0, 1.0) * 6.0 + bayer4(gl_FragCoord.xy));
            gl_FragColor = vec4(tone(level), 1.0);
        }`;

    function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.warn('pixel-field shader:', gl.getShaderInfoLog(s));
            return null;
        }
        return s;
    }

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.warn('pixel-field link:', gl.getProgramInfoLog(prog));
        return;
    }
    gl.useProgram(prog);

    const u = {};
    ['uViewProj', 'uSpan', 'uTime', 'uEye', 'uLight', 'uCalm', 'uRows'].forEach(name => {
        u[name] = gl.getUniformLocation(prog, name);
    });

    // the surface: a grid in [0,1]^2, spread over the view frustum in the shader
    const NX = 150, NZ = 110;
    const grid = new Float32Array((NX + 1) * (NZ + 1) * 2);
    let k = 0;
    for (let j = 0; j <= NZ; j++) {
        for (let i = 0; i <= NX; i++) { grid[k++] = i / NX; grid[k++] = j / NZ; }
    }
    const index = new Uint16Array(NX * NZ * 6);
    k = 0;
    for (let j = 0; j < NZ; j++) {
        for (let i = 0; i < NX; i++) {
            const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
            index[k++] = a; index[k++] = c; index[k++] = b;
            index[k++] = b; index[k++] = c; index[k++] = d;
        }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);
    const aGrid = gl.getAttribLocation(prog, 'aGrid');
    gl.enableVertexAttribArray(aGrid);
    gl.vertexAttribPointer(aGrid, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.024, 0.078, 0.216, 1);

    // ---- camera -----------------------------------------------------------
    function perspective(fovy, aspect, near, far) {
        const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
        return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
    }

    function lookAt(eye, target) {
        let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
        let len = Math.hypot(zx, zy, zz); zx /= len; zy /= len; zz /= len;
        // x = up(0,1,0) x z
        let xx = zz, xy = 0, xz = -zx;
        len = Math.hypot(xx, xy, xz); xx /= len; xy /= len; xz /= len;
        const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
        return [
            xx, yx, zx, 0,
            xy, yy, zy, 0,
            xz, yz, zz, 0,
            -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
            -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
            -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
            1
        ];
    }

    function multiply(a, b) {
        const out = new Array(16);
        for (let c = 0; c < 4; c++) {
            for (let r = 0; r < 4; r++) {
                out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
            }
        }
        return out;
    }

    const EYE = [0, 3.2, -1.0];
    const TARGET = [0, -1.0, 9.0];
    let cols = 0, rows = 0;

    // Tallest viewport seen at this width. Mobile browsers change
    // innerHeight as their toolbar slides in and out while scrolling;
    // following that would reallocate the buffer mid-scroll.
    let vw = 0, vh = 0;
    function viewportHeight() {
        if (window.innerWidth !== vw) { vw = window.innerWidth; vh = 0; }
        vh = Math.max(vh, window.innerHeight);
        return vh;
    }

    // The canvas is sticky and one screen tall, so a tall slide on a phone
    // still gets a normal camera instead of a stretched one.
    function resize() {
        const w = field.clientWidth;
        const h = Math.min(viewportHeight(), field.clientHeight || viewportHeight());
        const c = Math.max(1, Math.ceil(w / CELL)), r = Math.max(1, Math.ceil(h / CELL));
        if (c === cols && r === rows) return;
        cols = c; rows = r;
        canvas.width = cols;
        canvas.height = rows;
        canvas.style.width = cols * CELL + 'px';
        canvas.style.height = rows * CELL + 'px';
        gl.viewport(0, 0, cols, rows);

        const aspect = cols / rows;
        const fovy = (aspect < 1 ? 58 : 50) * Math.PI / 180;
        const spread = Math.max(0.3, Math.tan(fovy / 2) * aspect * 1.25);
        gl.uniformMatrix4fv(u.uViewProj, false, new Float32Array(multiply(perspective(fovy, aspect, 0.1, 80), lookAt(EYE, TARGET))));
        gl.uniform3f(u.uSpan, 0.2, 46, spread);
        gl.uniform3f(u.uEye, EYE[0], EYE[1], EYE[2]);
        gl.uniform1f(u.uRows, rows);
    }

    // ---- the quiet zone behind the headline --------------------------------
    const intro = section.querySelector('.aic-intro');
    function calm() {
        if (!intro) { gl.uniform4f(u.uCalm, -1e4, -1e4, -1e4, -1e4); return; }
        const c = canvas.getBoundingClientRect(), r = intro.getBoundingClientRect();
        const pad = 10;
        gl.uniform4f(u.uCalm,
            (r.left - c.left) / CELL - pad, (r.top - c.top) / CELL - pad,
            (r.right - c.left) / CELL + pad, (r.bottom - c.top) / CELL + pad);
    }

    // ---- light follows the pointer, gently ---------------------------------
    const light = { x: 0, z: 0, tx: 0, tz: 0 };
    if (!reduced) {
        section.addEventListener('pointermove', (e) => {
            const r = section.getBoundingClientRect();
            light.tx = ((e.clientX - r.left) / r.width - 0.5) * 0.9;
            light.tz = ((e.clientY - r.top) / r.height - 0.5) * 0.6;
        }, { passive: true });
        section.addEventListener('pointerleave', () => { light.tx = 0; light.tz = 0; });
    }

    let clock = 7;           // start mid-swell rather than on a flat phase
    function draw() {
        resize();
        calm();
        light.x += (light.tx - light.x) * 0.08;
        light.z += (light.tz - light.z) * 0.08;
        gl.uniform3f(u.uLight, -0.7 + light.x, 0.45, -0.1 + light.z);
        gl.uniform1f(u.uTime, clock);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
    }

    // ---- budget -------------------------------------------------------------
    let visible = false, armed = false, lost = false, moved = false, last = 0, prev = 0;

    function tick(now) {
        armed = false;
        if (!visible || document.hidden || lost) { prev = 0; return; }
        arm();
        // 30fps is plenty for the drift, but while the page scrolls every
        // frame is drawn, or the quiet zone would trail the headline
        if (now - last < FRAME_MS - 2 && !moved) return;
        moved = false;
        clock += prev ? Math.min(0.1, (now - prev) / 1000) : 0;
        prev = now;
        last = now;
        draw();
    }

    function arm() {
        if (armed) return;
        armed = true;
        requestAnimationFrame(reduced ? still : tick);
    }

    // reduced motion: time stands still, but the frame still has to follow
    // the page (the quiet zone moves with the copy) and the viewport size
    function still() {
        armed = false;
        if (!lost) draw();
    }

    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            visible = entries[entries.length - 1].isIntersecting;
            if (visible) arm();
        }, { rootMargin: '120px 0px' }).observe(section);
    } else {
        visible = true;
        arm();
    }

    document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) arm(); });
    window.addEventListener('resize', () => { if (visible) arm(); }, { passive: true });
    window.addEventListener('scroll', () => {
        if (!visible) return;
        moved = true;
        arm();
    }, { passive: true });

    canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        lost = true;
        field.classList.remove('is-live');
    });

    draw();
    field.classList.add('is-live');
})();
