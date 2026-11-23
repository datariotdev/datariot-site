const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto').webcrypto;
const uid = '11111111-1111-4111-8111-111111111111';
const rid = '22222222-2222-4222-8222-222222222222';
const details = () => ({ title: 'How magnets work', description: 'A demonstration.', category: 'Education', tags: ['science'], sources: ['https://example.org/paper'], language: 'English', rightsConfirmed: true, aiConsent: true, shareToCircle: true });
const result = () => ({ decision: 'approved', contentAvailable: true, hasSubstantiveValue: true, disallowedContent: false, reason: 'An educational demonstration.', summary: 'Shows magnetic attraction.', suggestedTitle: 'Magnets explained', suggestedCaption: 'Explore magnetic attraction.', duration: 32 });
function load(file, globals = {}, requireFn = require) {
    const module = { exports: {} };
    const source = fs.readFileSync(file, 'utf8').replace('if (import.meta.main) Deno.serve(handleUpload);', '');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, require: requireFn, URL, Request, Response, AbortSignal, TextEncoder, crypto, console: { error() {} }, ...globals });
    return module.exports;
}
const policy = load('supabase/functions/moderate-upload/policy.ts');
function harness(options = {}) {
    const state = { generated: 0, media: 0, saved: 0, copied: 0, published: 0, cleaned: 0 };
    class ClipError extends Error { constructor(code, status = 503) { super(code); this.code = code; this.status = status; } }
    const env = { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'server', GEMINI_API_KEY: options.noKey ? '' : 'test-key' };
    const clip = { ClipError, takeBudget: async () => { if (options.rateLimited) throw new ClipError('RATE_LIMITED', 429); },
        mediaPart: async (_, url) => { state.media++; assert.match(url.href, /^https:\/\/project.supabase.co\/storage\/v1\/object\/sign\/upload-review\//); return { part: { fileData: { fileUri: 'https://provider/files/video' } }, cleanup: async () => { state.cleaned++; } }; } };
    const fetch = async (raw, init = {}) => {
        const url = new URL(raw);
        if (url.pathname === '/auth/v1/user') return Response.json({ id: options.otherUser || uid, is_anonymous: !!options.anonymous }, { status: options.invalidAuth ? 401 : 200 });
        if (url.pathname === '/rest/v1/upload_reviews') {
            if (init.method === 'POST') { state.saved++; const row = JSON.parse(init.body); assert.equal(row.user_id, uid); return Response.json([{ id: rid, result: row.result }]); }
            if (url.searchParams.has('id')) return Response.json(options.missing ? [] : [{ id: rid, user_id: uid, source_path: `${uid}/file.mp4`, decision: options.decision || 'approved', created_at: options.expired ? '2000-01-01' : new Date().toISOString(), video_id: options.alreadyPublished ? 'existing-video' : null }]);
            return Response.json([]);
        }
        if (url.pathname.startsWith('/storage/v1/object/sign/')) return Response.json({ signedURL: `/object/sign/upload-review/${uid}/file.mp4?token=test` });
        if (url.pathname === '/storage/v1/object/copy') { state.copied++; const body = JSON.parse(init.body); assert.equal(body.destinationBucket, 'approved-videos'); return Response.json({}); }
        if (url.pathname === '/rest/v1/rpc/publish_reviewed_upload') { state.published++; assert.equal(JSON.parse(init.body).p_user, uid); return Response.json('new-video'); }
        if (url.hostname === 'generativelanguage.googleapis.com') {
            state.generated++; if (options.outage) return Response.json({}, { status: 503 });
            const body = JSON.parse(init.body); assert.equal(body.contents[0].parts[0].fileData.fileUri, 'https://provider/files/video');
            return Response.json({ candidates: [{ finishReason: options.finish || 'STOP', content: { parts: [{ text: options.malformed ? '{}' : JSON.stringify({ ...result(), ...options.model }) }] } }] });
        }
        throw new Error(`Unexpected URL ${url}`);
    };
    const api = load('supabase/functions/moderate-upload/index.ts', { Deno: { env: { get: k => env[k] } }, fetch }, name => name.includes('clip') ? clip : policy);
    const request = (body, auth = 'Bearer test') => api.handleUpload(new Request('https://project.supabase.co/functions/v1/moderate-upload', { method: 'POST', headers: auth ? { authorization: auth } : {}, body: JSON.stringify(body) }));
    return { state, request };
}
test('validates source URLs, ownership declarations, tags and category', () => {
    assert.equal(policy.validateDetails(details()), true);
    for (const change of [{ sources: ['javascript:alert(1)'] }, { rightsConfirmed: false }, { aiConsent: false }, { category: 'unknown' }, { tags: ['bad tag'] }, { title: 'x' }, { shareToCircle: 'yes' }]) assert.equal(policy.validateDetails({ ...details(), ...change }), false);
});
test('conflicting or unavailable evidence can never produce approval', () => {
    assert.equal(policy.normalizeReview({ ...result(), contentAvailable: false }).decision, 'review');
    assert.equal(policy.normalizeReview({ ...result(), disallowedContent: true }).decision, 'rejected');
    assert.equal(policy.normalizeReview({ ...result(), hasSubstantiveValue: false }).decision, 'rejected');
    assert.throws(() => policy.normalizeReview({ ...result(), duration: 0 }));
});
test('unauthenticated and anonymous users cannot review or publish', async () => {
    for (const o of [{ invalidAuth: true }, { anonymous: true }]) {
        const h = harness(o); assert.equal((await h.request({ action: 'publish', reviewId: rid })).status, 401); assert.equal(h.state.published, 0);
    }
    assert.equal((await harness().request({}, '')).status, 401);
});
test('cannot submit another user’s file or arbitrary URL for review', async () => {
    const h = harness();
    for (const path of ['https://evil.test/file.mp4', 'another-user/file.mp4', `${uid}/../file.mp4`]) assert.equal((await h.request({ action: 'review', path, details: details() })).status, 400);
    assert.equal(h.state.media, 0);
});
test('passes actual private video to the provider, saves result, and releases provider file', async () => {
    const h = harness(); const response = await h.request({ action: 'review', path: `${uid}/file.mp4`, details: details() });
    assert.equal(response.status, 200); assert.equal((await response.json()).decision, 'approved');
    assert.deepEqual(h.state, { generated: 1, media: 1, saved: 1, copied: 0, published: 0, cleaned: 1 });
});
test('provider outage, safety block, malformed JSON, absent key and budget limits all fail closed', async () => {
    for (const o of [{ outage: true }, { finish: 'SAFETY' }, { malformed: true }, { noKey: true }, { rateLimited: true }]) {
        const h = harness(o); assert.ok((await h.request({ action: 'review', path: `${uid}/file.mp4`, details: details() })).status >= 400);
        assert.equal(h.state.saved, 0); assert.equal(h.state.published, 0);
    }
});
test('rejected, uncertain, expired and missing reviews cannot publish', async () => {
    for (const o of [{ decision: 'rejected' }, { decision: 'review' }, { expired: true }, { missing: true }]) {
        const h = harness(o); assert.equal((await h.request({ action: 'publish', reviewId: rid })).status, 409); assert.equal(h.state.copied, 0); assert.equal(h.state.published, 0);
    }
});
test('approved publication promotes immutable media and uses atomic publisher', async () => {
    const h = harness(); const response = await h.request({ action: 'publish', reviewId: rid });
    assert.equal(response.status, 200); assert.equal((await response.json()).videoId, 'new-video'); assert.equal(h.state.copied, 1); assert.equal(h.state.published, 1);
});
test('retrying an already published review returns existing video without duplication', async () => {
    const h = harness({ alreadyPublished: true }); const response = await h.request({ action: 'publish', reviewId: rid });
    assert.equal((await response.json()).videoId, 'existing-video'); assert.equal(h.state.copied, 0); assert.equal(h.state.published, 0);
});
