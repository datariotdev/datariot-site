const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(readFileSync(join(__dirname, '../src/lib/circle/useCircleFeed.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const pause = () => new Promise(resolve => setImmediate(resolve));
const clip = (id, author = 'creator') => ({ id, user_id: author, url: `https://example.com/${id}.mp4`, title: `Clip ${id}`, category: 'AI' });

// Exercise the hook's effects and async actions without a device or a live account.
function harness({ userId = 'viewer', rows = [clip('one')], failMutation = false, delayed } = {}) {
    let args = ['explore', null, ''];
    let account = userId;
    let cursor = 0, scheduled = false, alive = true, output;
    const slots = [], effects = [], calls = [];
    const same = (a, b) => !!a && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
    const renderSoon = () => {
        if (!alive || scheduled) return;
        scheduled = true;
        queueMicrotask(() => { scheduled = false; if (alive) render(); });
    };
    const react = {
        useState(initial) {
            const i = cursor++;
            if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
            return [slots[i].value, next => {
                const value = typeof next === 'function' ? next(slots[i].value) : next;
                if (!Object.is(value, slots[i].value)) { slots[i].value = value; renderSoon(); }
            }];
        },
        useRef(initial) { const i = cursor++; return (slots[i] ||= { current: initial }); },
        useMemo(fn, deps) { const i = cursor++; if (!slots[i] || !same(slots[i].deps, deps)) slots[i] = { value: fn(), deps }; return slots[i].value; },
        useCallback(fn, deps) { return react.useMemo(() => fn, deps); },
        useEffect(fn, deps) {
            const i = cursor++;
            if (!slots[i] || !same(slots[i].deps, deps)) {
                const previous = slots[i];
                slots[i] = { deps, cleanup: previous?.cleanup };
                effects.push(() => { previous?.cleanup?.(); slots[i].cleanup = fn(); });
            }
        },
    };
    const database = { from(table) {
        const call = { table, filters: [] };
        let mutation = false;
        const execute = async () => {
            calls.push(call);
            if (mutation) return { data: null, error: failMutation ? { message: 'write denied' } : null };
            if (table === 'followers') return { data: [{ followed_id: 'creator' }] };
            if (table === 'save_actions') return { data: [{ video_id: 'one' }] };
            if (table === 'likes') return { data: [] };
            if (table === 'profiles') return { data: [{ id: 'creator', display_name: 'A real creator' }] };
            if (delayed) return delayed(call);
            return { data: rows };
        };
        const builder = {
            select() { return builder; }, order() { return builder; },
            eq(key, value) { call.filters.push(['eq', key, value]); return builder; },
            in(key, value) { call.filters.push(['in', key, value]); return builder; },
            or(value) { call.filters.push(['or', value]); return builder; },
            range(start, end) { call.range = [start, end]; return execute(); },
            insert(value) { mutation = true; call.insert = value; return builder; },
            delete() { mutation = true; call.delete = true; return builder; },
            then(resolve, reject) { return execute().then(resolve, reject); },
        };
        return builder;
    } };
    const module = { exports: {} };
    vm.runInNewContext(source, {
        exports: module.exports, module, console,
        setTimeout: fn => setTimeout(fn, 0), clearTimeout,
        require(name) {
            if (name === 'react') return react;
            if (name.endsWith('/client')) return { supabase: database };
            if (name.endsWith('/useAuth')) return { useAuth: () => ({ user: account ? { id: account } : null }) };
            if (name.endsWith('/categories')) return { ANIMATED_SHORTS_CATEGORY: 'animated-shorts' };
            if (name.endsWith('/url')) return { encodeVideoUrl: value => value || null };
            throw new Error(`Unexpected import: ${name}`);
        },
    });
    function render() { cursor = 0; output = module.exports.useCircleFeed(...args); while (effects.length) effects.shift()(); }
    render();
    return {
        get result() { return output; }, calls,
        async settle() { for (let i = 0; i < 12; i++) await pause(); },
        update(mode, category = null, search = '') { args = [mode, category, search]; render(); },
        account(id) { account = id; render(); },
        destroy() { alive = false; slots.forEach(slot => slot?.cleanup?.()); },
    };
}

test('Circle maps actual creators and hydrates saved membership', async () => {
    const h = harness(); await h.settle();
    assert.equal(h.result.error, null);
    assert.equal(h.result.videos[0].author, 'A real creator');
    assert.equal(h.result.videos[0].isSaved, true);
    assert.equal(h.result.videos[0].isFollowing, true);
    assert.equal(h.result.videos[0].dnaMatch, undefined);
    h.destroy();
});

test('Following and Saved apply backend membership filters', async () => {
    const h = harness(); await h.settle();
    h.update('following', 'AI'); await h.settle();
    let request = h.calls.filter(call => call.table === 'videos').at(-1);
    assert.deepEqual(request.filters.find(value => value[0] === 'in').slice(1).map(value => JSON.parse(JSON.stringify(value))), ['user_id', ['creator']]);
    assert.ok(request.filters.some(value => value[0] === 'eq' && value[1] === 'category' && value[2] === 'AI'));
    h.update('saved'); await h.settle();
    request = h.calls.filter(call => call.table === 'videos').at(-1);
    assert.equal(request.filters.find(value => value[0] === 'in')[1], 'id');
    assert.equal(request.filters.find(value => value[0] === 'in')[2][0], 'one');
    h.destroy();
});

test('failed follow and save writes restore membership and report an error', async () => {
    const h = harness({ failMutation: true }); await h.settle();
    h.result.toggleFollow('creator'); await h.settle();
    assert.equal(h.result.videos[0].isFollowing, true);
    assert.match(h.result.actionError, /follow/);
    h.result.toggleSave('one'); await h.settle();
    assert.equal(h.result.videos[0].isSaved, true);
    assert.match(h.result.actionError, /saved/);
    h.destroy();
});

test('rapid repeated likes produce one write and roll back counts on failure', async () => {
    const h = harness({ failMutation: true }); await h.settle();
    h.result.toggleLike('one'); h.result.toggleLike('one'); await h.settle();
    assert.equal(h.calls.filter(call => call.table === 'likes' && call.insert).length, 1);
    assert.equal(h.result.videos[0].likes, 0);
    assert.equal(h.result.videos[0].isLiked, false);
    assert.match(h.result.actionError, /like/);
    h.destroy();
});

test('a stale category response cannot replace the current category', async () => {
    let finishOld;
    const h = harness({ delayed: call => call.filters.some(value => value[0] === 'eq' && value[2] === 'AI')
        ? Promise.resolve({ data: [clip('current')] })
        : new Promise(resolve => { finishOld = resolve; }) });
    await h.settle(); h.update('explore', 'AI'); await h.settle();
    assert.equal(h.result.videos[0].id, 'current');
    finishOld({ data: [clip('stale')] }); await h.settle();
    assert.equal(h.result.videos[0].id, 'current');
    h.destroy();
});

test('signed-out Following makes no video request and does not hang', async () => {
    const h = harness({ userId: null }); await h.settle();
    h.calls.length = 0;
    h.update('following'); await h.settle();
    assert.equal(h.calls.filter(call => call.table === 'videos').length, 0);
    assert.equal(h.result.videos.length, 0);
    assert.equal(h.result.loading, false);
    h.destroy();
});
