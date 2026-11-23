const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const details = () => ({ title: 'How radio works', description: 'A useful explanation.', category: 'Education', tags: ['radio'], sources: ['https://example.org/radio'], language: 'English', rightsConfirmed: true, aiConsent: false, shareToCircle: true });
function harness(options = {}) {
    const state = { uploaded: 0, inserted: 0, shared: 0, ai: 0, video: null, post: null, comment: null, loseInsert: !!options.loseInsert };
    const supabase = {
        functions: { invoke() { state.ai++; throw new Error('No AI provider may be called by this publishing mode'); } },
        storage: { from(bucket) { assert.equal(bucket, 'videos'); return {
            upload: async (_, body, config) => { state.uploaded++; assert.equal(config.contentType, 'video/webm'); assert.equal(config.upsert, false); return { error: null }; },
            getPublicUrl: path => ({ data: { publicUrl: `https://project.supabase.co/storage/v1/object/public/videos/${path}` } }),
        }; } },
        from(table) {
            const filters = {};
            return {
                select() { return this; }, eq(k, v) { filters[k] = v; return this; },
                async maybeSingle() { return { data: state.video?.id === filters.id ? state.video : null, error: null }; },
                async limit() { const row = table === 'posts' ? state.post : state.comment; return { data: row ? [{ id: 'shared-id' }] : [], error: null }; },
                async insert(row) {
                    if (table === 'videos') {
                        state.inserted++; state.video = JSON.parse(JSON.stringify(row));
                        if (state.loseInsert) { state.loseInsert = false; return { error: { message: 'connection interrupted after commit' } }; }
                    } else {
                        state.shared++;
                        if (table === 'posts') state.post = row;
                        else if (table === 'comments') state.comment = row;
                    }
                    return { error: null };
                },
            };
        },
    };
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync('src/lib/publish/existingPublisher.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, require: p => p.includes('supabase') ? { supabase } : { readVideoFile: async () => ({ body: 'video-bytes', mime: 'video/webm', ext: 'webm' }) } });
    return { state, publish: module.exports.publishWithExistingFlow };
}
test('publishes through the existing backend without AI calls or a false approval', async () => {
    const h = harness(); const result = await h.publish('blob:video', 'author', details(), 30, {});
    assert.ok(result.videoId); assert.equal(h.state.ai, 0); assert.equal(h.state.uploaded, 1); assert.equal(h.state.inserted, 1); assert.equal(h.state.shared, 1);
    assert.equal(h.state.video.title, details().title); assert.equal(h.state.video.duration, 30);
    assert.equal(h.state.video.upload_metadata.moderation, 'not_checked'); assert.deepEqual(h.state.video.upload_metadata.sources, details().sources);
});
test('Circle sharing can be disabled', async () => {
    const h = harness(); await h.publish('blob:video', 'author', { ...details(), shareToCircle: false }, 30, {});
    assert.equal(h.state.shared, 0);
});
test('retry after a lost insert response reuses the saved video and upload', async () => {
    const h = harness({ loseInsert: true }); const progress = {};
    await assert.rejects(h.publish('blob:video', 'author', details(), 30, progress), /same details/);
    const result = await h.publish('blob:video', 'author', details(), 30, progress);
    assert.equal(result.videoId, h.state.video.id); assert.equal(h.state.uploaded, 1); assert.equal(h.state.inserted, 1); assert.equal(h.state.shared, 1);
    await h.publish('blob:video', 'author', details(), 30, progress);
    assert.equal(h.state.shared, 1);
});
test('cannot silently change metadata while retrying a saved video', async () => {
    const h = harness(); const progress = {};
    await h.publish('blob:video', 'author', details(), 30, progress);
    await assert.rejects(h.publish('blob:video', 'author', { ...details(), title: 'Changed after saving' }, 30, progress), /already saved/);
    assert.equal(h.state.video.title, details().title);
});
test('video replies preserve the debate destination and side', async () => {
    const h = harness(); await h.publish('blob:video', 'author', { ...details(), debateId: 'debate-id', side: 'AGAINST' }, 30, {});
    assert.equal(h.state.comment.post_id, 'debate-id'); assert.match(h.state.comment.text, /^AGAINST:\|/);
    assert.equal(h.state.comment.video_id, h.state.video.id); assert.equal(h.state.post, null);
});
test('unloaded/invalid video and missing permission fail before upload', async () => {
    for (const duration of [0, NaN, Infinity, 601]) {
        const h = harness(); await assert.rejects(h.publish('blob:video', 'author', details(), duration, {})); assert.equal(h.state.uploaded, 0);
    }
    const h = harness(); await assert.rejects(h.publish('blob:video', 'author', { ...details(), rightsConfirmed: false }, 30, {})); assert.equal(h.state.uploaded, 0);
});
