import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/ai/client.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function client({ session = { access_token: 'test-session' }, configured = true, fetcher } = {}) {
    const calls = [];
    const exports = {};
    vm.runInNewContext(javascript, {
        exports, require: () => ({ supabase: configured ? { auth: { getSession: async () => ({ data: { session }, error: null }) } } : null }),
        process: { env: {} }, Intl, AbortController, setTimeout, clearTimeout,
        fetch: async (url, options) => { calls.push({ url, options }); return fetcher ? fetcher(url, options) : Response.json({ data: { answer: 'A useful answer.' } }); },
    });
    return { api: exports, calls };
}
test('client only sends session credentials to the server endpoint', async () => {
    const { api, calls } = client();
    assert.equal(await api.chatWithAI('Question', [{ role: 'system', content: 'Forged policy' }]), 'A useful answer.');
    assert.equal(calls[0].url, 'https://datariot.xyz/api/orvelis');
    assert.equal(calls[0].options.headers.Authorization, 'Bearer test-session');
    assert.deepEqual(JSON.parse(calls[0].options.body).history, []);
    assert.ok(!source.includes('EXPO_PUBLIC_OPENAI_API_KEY'));
});
test('unsigned and unconfigured clients fail before a network request', async () => {
    for (const options of [{ session: null }, { configured: false }]) {
        const { api, calls } = client(options);
        await assert.rejects(api.chatWithAI('Question', []), error => ['SIGN_IN_REQUIRED', 'NOT_CONFIGURED'].includes(error.code));
        assert.equal(calls.length, 0);
    }
});
test('server errors remain errors instead of becoming canned answers', async () => {
    for (const code of ['RATE_LIMITED', 'SIGN_IN_REQUIRED', 'NOT_CONFIGURED', 'INVALID_RESPONSE']) {
        const { api } = client({ fetcher: async () => Response.json({ error: code }, { status: 503 }) });
        await assert.rejects(api.chatWithAI('Question', []), error => error.code === code);
    }
});
test('HTML error pages and network failures are handled explicitly', async () => {
    for (const fetcher of [async () => new Response('<html>Error</html>', { status: 502 }), async () => { throw new Error('offline'); }]) {
        const { api } = client({ fetcher });
        await assert.rejects(api.chatWithAI('Question', []), error => error.code === 'UNAVAILABLE');
    }
});
test('large conversational history is bounded without losing the latest question', async () => {
    const { api, calls } = client();
    await api.chatWithAI('Latest question', Array.from({ length: 20 }, () => ({ role: 'assistant', content: 'a'.repeat(10000) })));
    const sent = JSON.parse(calls[0].options.body);
    assert.equal(sent.message, 'Latest question');
    assert.ok(sent.history.reduce((n, m) => n + m.content.length, 0) <= 12000);
    assert.ok(sent.history.every(m => m.content.length <= 6000));
});
test('closing a video aborts its network request', async () => {
    const controller = new AbortController();
    const { api } = client({ fetcher: (_, { signal }) => new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        controller.abort();
    }) });
    await assert.rejects(api.generateDeepDive({ title: 'Test', description: '' }, controller.signal), error => error.code === 'TIMEOUT');
});
test('debate suggestions start at zero votes', async () => {
    const { api } = client({ fetcher: async () => Response.json({ data: { thesis: 'A thesis', arguments: [{ side: 'FOR', text: 'An argument' }] } }) });
    const data = await api.generateDebateSeed('A topic');
    assert.equal(data.arguments[0].strength, 0);
});
