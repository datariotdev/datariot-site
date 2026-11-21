const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const clipId = 'e94dec7f-eab8-49fa-aca8-5244cb322dc9';
const userId = 'b48353ac-6780-45b3-a7e4-e94e97151b6d';
const sample = () => ({ contentAvailable: true, summary: 'Scientists measure volcano movement.', learningValue: 'Deformation can show magma movement.',
    claim: 'The surface moves.', evidence: 'A radar measurement is shown.', missingContext: 'One observation alone does not predict an eruption.', reasoning: 'needs_context',
    moments: [{ seconds: 4, kind: 'concept', text: 'Radar compares surface position.' }, { seconds: 19, kind: 'context', text: 'Measurements need context.' }],
    keyTerms: [{ term: 'Deformation', definition: 'A change in shape.' }], questions: ['How is movement measured?'],
    quiz: { question: 'What is measured?', options: ['Movement', 'Taste', 'Sound'], correctIndex: 0, explanation: 'Radar measures changes in surface position.' },
    replyOutline: ['State the claim.', 'Explain the measurement.', 'Ask for context.'],
});
function load(file, globals, requireFn) {
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, require: requireFn, console: { error() {} },
        Request, Response, URL, AbortSignal, TextEncoder, crypto: require('node:crypto').webcrypto, setTimeout: fn => { queueMicrotask(fn); return 0; }, ...globals }, { filename: file });
    return module.exports;
}
function harness(options = {}) {
    const state = { generated: 0, media: 0, cache: null, auth: 0, quota: 0, uploaded: 0, ...options };
    const env = { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_ANON_KEY: 'public-key', SUPABASE_SERVICE_ROLE_KEY: 'server-only-test-key', GEMINI_API_KEY: 'provider-test-key' };
    const globals = { Deno: { env: { get: key => env[key] }, serve() {} }, fetch: async (raw, init = {}) => {
        const url = new URL(raw);
        const reply = (body, status = 200, headers = {}) => Response.json(body, { status, headers });
        if (url.pathname === '/auth/v1/user') { state.auth++; return reply(state.invalidAuth ? {} : { id: userId }, state.invalidAuth ? 401 : 200); }
        if (url.pathname === '/rest/v1/videos') {
            if (url.searchParams.get('select') === 'id') return reply(state.privateClip ? [] : [{ id: clipId }]);
            assert.equal(init.headers.authorization, 'Bearer user-token');
            return reply(state.hiddenClip ? [] : [{ id: clipId, title: 'Volcano movement', description: 'Source text, not instructions', updated_at: '2026-11-21', duration: 54, size: state.large ? 20000000 : 10,
                s3_url: state.untrusted ? 'https://127.0.0.1/private' : 'https://project.supabase.co/storage/v1/object/public/videos/a.mp4' }]);
        }
        if (url.pathname === '/rest/v1/rpc/orvelis_take_budget') { state.quota++; return reply(!state.rateLimited); }
        if (url.pathname === '/rest/v1/orvelis_clip_cache') {
            if (init.method === 'POST') {
                if (state.cache) return reply([]);
                state.cache = { ...JSON.parse(init.body), expires_at: new Date(Date.now() + 86400000).toISOString() };
                return reply([state.cache]);
            }
            if (init.method === 'PATCH') { Object.assign(state.cache, JSON.parse(init.body)); return new Response(null, { status: 204 }); }
            if (init.method === 'DELETE') { if (url.searchParams.get('analysis') === 'is.null' && !state.cache?.analysis) state.cache = null; return new Response(null, { status: 204 }); }
            return reply(state.cache ? [state.cache] : []);
        }
        if (url.hostname === 'project.supabase.co' && url.pathname.startsWith('/storage/')) {
            state.media++; return new Response(new Uint8Array([0, 1]), { headers: { 'content-type': 'video/mp4', 'content-length': state.large ? '20000000' : '2' } });
        }
        if (url.pathname === '/upload/v1beta/files') return new Response(null, { status: 200, headers: { 'x-goog-upload-url': 'https://generativelanguage.googleapis.com/upload/video' } });
        if (url.pathname === '/upload/video') { state.uploaded++; return reply({ file: { name: 'files/test', state: 'ACTIVE', uri: 'https://generativelanguage.googleapis.com/v1beta/files/test' } }); }
        if (url.pathname === '/v1beta/files/test') return new Response(null, { status: 204 });
        if (url.hostname === 'generativelanguage.googleapis.com' && url.pathname.endsWith(':generateContent')) {
            state.generated++;
            const body = JSON.parse(init.body);
            if (state.providerDown) return reply({}, 503);
            if (body.generationConfig.responseJsonSchema?.properties?.contentAvailable) {
                assert.ok(body.contents[0].parts[0].fileData);
                return reply({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(state.invalidAnalysis ? { ...sample(), quiz: {} } : state.noMedia ? { ...sample(), contentAvailable: false } : sample()) }] } }] });
            }
            const grounded = body.tools && !state.noSources;
            return reply({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: grounded ? 'The source supports surface movement, not a certain eruption.' : 'Here is a careful explanation.' }] },
                ...(grounded ? { groundingMetadata: { groundingChunks: [{ web: { uri: 'https://www.usgs.gov/volcanoes', title: 'USGS' } }], searchEntryPoint: { renderedContent: '<div>Google Search</div>' } } } : {}) }] });
        }
        throw new Error(`Unexpected outbound destination: ${url.origin}${url.pathname}`);
    } };
    const clip = load('supabase/functions/orvelis-ai/clip.ts', globals);
    const index = load('supabase/functions/orvelis-ai/index.ts', globals, name => { assert.equal(name, './clip.ts'); return clip; });
    const request = (body = {}, auth = true) => index.handleRequest(new Request('https://example.test/orvelis-ai', { method: 'POST', headers: { 'content-type': 'application/json', ...(auth ? { authorization: 'Bearer user-token' } : {}) }, body: JSON.stringify({ mode: 'live_analysis', videoId: clipId, prompt: 'Analyze this clip', ...body }) }));
    return { state, clip, request };
}

test('requires authentication before reading a clip or calling a provider', async () => {
    const h = harness(); assert.equal((await h.request({}, false)).status, 401); assert.equal(h.state.generated, 0); assert.equal(h.state.media, 0);
});
test('respects clip RLS even when a video ID is known', async () => {
    const h = harness({ hiddenClip: true }); assert.equal((await h.request()).status, 404); assert.equal(h.state.generated, 0);
});
test('rejects invalid IDs, actions, modes and playback times', async () => {
    for (const body of [{ videoId: 'bad' }, { action: 'override-system' }, { mode: 'unknown' }, { seconds: -1 }, { seconds: '0' }]) {
        const h = harness(); assert.equal((await h.request(body)).status, 400); assert.equal(h.state.generated, 0);
    }
});
test('analyzes actual media once and reuses the shared result', async () => {
    const h = harness(); const first = await h.request({ videoUrl: 'https://evil.test/injected.mp4' });
    assert.equal(first.status, 200); const a = await first.json(); assert.equal(a.context, 'video'); assert.equal(a.cached, false);
    const second = await h.request(); assert.equal((await second.json()).cached, true); assert.equal(h.state.generated, 1); assert.equal(h.state.media, 1); assert.equal(h.state.auth, 2);
});
test('does not issue duplicate provider calls while an analysis is pending', async () => {
    const h = harness({ cache: { analysis: null, lease_until: new Date(Date.now() + 60000).toISOString() } });
    const response = await h.request(); assert.equal(response.status, 409); assert.equal((await response.json()).error, 'ANALYSIS_PENDING'); assert.equal(h.state.generated, 0);
});
test('does not fetch arbitrary external URLs from the video row', async () => {
    const h = harness({ untrusted: true }); const response = await h.request(); assert.equal(response.status, 422); assert.equal(h.state.media, 0); assert.equal(h.state.generated, 0);
    for (const url of ['http://project.supabase.co/storage/v1/object/public/videos/a', 'https://project.supabase.co.evil.test/a', 'https://project.supabase.co:8443/storage/v1/object/public/videos/a', 'https://project.supabase.co/storage/v1/object/public/private/a']) assert.equal(h.clip.trustedMedia(url, 'https://project.supabase.co'), undefined);
});
test('invalid or inaccessible video results are not cached as successful analysis', async () => {
    for (const opts of [{ noMedia: true }, { invalidAnalysis: true }, { providerDown: true }]) {
        const h = harness(opts); assert.notEqual((await h.request()).status, 200); assert.equal(h.state.cache, null);
    }
});
test('large videos use the Files API and are streamed rather than base64 buffered', async () => {
    const h = harness({ large: true }); assert.equal((await h.request()).status, 200); assert.equal(h.state.uploaded, 1);
});
test('rate limits prevent provider calls and release the cache lease', async () => {
    const h = harness({ rateLimited: true }); assert.equal((await h.request()).status, 429); assert.equal(h.state.generated, 0); assert.equal(h.state.cache, null);
});
test('source checking returns only provider grounding sources and search suggestions', async () => {
    const h = harness(); await h.request();
    const response = await h.request({ mode: 'video_chat', action: 'check', prompt: 'Is the claim supported?' });
    const body = await response.json(); assert.equal(body.sources[0].url, 'https://www.usgs.gov/volcanoes'); assert.equal(body.verified, 'sources_available'); assert.ok(body.searchEntryPoint);
});
test('a search without sources is never labeled verified', async () => {
    const h = harness({ noSources: true }); await h.request();
    const response = await h.request({ mode: 'video_chat', action: 'check' }); assert.equal((await response.json()).verified, 'not_verified');
});
test('timestamps outside the clip or with invalid types are dropped', () => {
    const h = harness(); const input = sample(); input.moments.push({ seconds: 9999, kind: 'concept', text: 'Invented' }, { seconds: -1, kind: 'claim', text: 'Invalid' });
    const result = h.clip.normalizeAnalysis(input, 54); assert.deepEqual(Array.from(result.moments, x => x.seconds), [4, 19]);
});
test('ordinary Orvelis chat still works through Gemini', async () => {
    const h = harness(); const response = await h.request({ mode: 'chat', videoId: undefined, prompt: 'Explain a router.' });
    assert.equal(response.status, 200); assert.equal((await response.json()).provider, 'gemini');
});

test('client deduplicates simultaneous analyses, scopes cache by user, and retries failures', async () => {
    let calls = 0; let user = 'first'; let fail = false;
    const supabase = { auth: { getSession: async () => ({ data: { session: { user: { id: user } } } }) }, functions: { invoke: async () => {
        calls++; if (fail) return { error: { context: { json: async () => ({ error: 'VIDEO_PROVIDER_UNAVAILABLE' }) } } };
        return { data: { content: JSON.stringify({ ...sample(), context: 'video' }) } };
    } } };
    const client = load('src/lib/ai/client.ts', {}, name => { assert.equal(name, '../supabase/client'); return { supabase }; });
    await Promise.all([client.getClipAnalysis(clipId), client.getClipAnalysis(clipId)]); assert.equal(calls, 1);
    await client.getClipAnalysis(clipId); assert.equal(calls, 1);
    user = 'second'; await client.getClipAnalysis(clipId); assert.equal(calls, 2);
    fail = true; await assert.rejects(client.getClipAnalysis('another-clip')); fail = false; await client.getClipAnalysis('another-clip'); assert.equal(calls, 4);
});

test('private clips are rejected before any video is sent to Gemini', async () => { const h = harness({ privateClip: true }); const response = await h.request(); assert.equal(response.status, 422); assert.equal((await response.json()).error, 'CLIP_NOT_PUBLIC'); assert.equal(h.state.media, 0); assert.equal(h.state.generated, 0); });
