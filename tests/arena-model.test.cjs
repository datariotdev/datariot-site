const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(relative) {
    const code = ts.transpileModule(readFileSync(join(__dirname, relative), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText;
    const exports = {};
    vm.runInNewContext(code, { exports, URL });
    return exports;
}
const model = load('../src/lib/arena/model.ts');
const feed = load('../src/lib/utils/feed.ts');
const posts = [
    { id: 'unanswered', userId: 'alice', comments: 0, content: 'How glass is made' },
    { id: 'boilerplate', userId: 'bob', comments: 2, content: 'What about New Video?' },
    { id: 'question', userId: 'alice', comments: 3, content: 'Should robots have legal personhood?' },
];

test('argument prefixes preserve the actual position and strip AI metadata', () => {
    const forArgument = model.parseArenaArgument('FOR:|Here is my reason.');
    assert.equal(forArgument.side, 'FOR');
    assert.equal(forArgument.content, 'Here is my reason.');
    const assisted = model.parseArenaArgument('AI_ORACLE:|AGAINST:|Consider the trade-off.');
    assert.equal(assisted.side, 'AGAINST');
    assert.equal(assisted.content, 'Consider the trade-off.');
    assert.equal(assisted.aiAssisted, true);
    const neutral = model.parseArenaArgument('I am still weighing both sides.');
    assert.equal(neutral.side, 'NEUTRAL');
    assert.equal(neutral.content, 'I am still weighing both sides.');
});

test('unanswered uses actual comment totals and My debates only returns the owner', () => {
    assert.equal(model.filterArenaPosts(posts, 'unanswered').map(item => item.id).join(), 'unanswered');
    assert.equal(model.filterArenaPosts(posts, 'mine', 'alice').map(item => item.id).join(), 'unanswered,question');
    assert.equal(model.filterArenaPosts(posts, 'mine').length, 0);
});

test('overlapping pages keep one React key per debate and update changed records', () => {
    const result = model.uniqueArenaItems(posts, [{ ...posts[2], comments: 4 }, { id: 'new' }]);
    assert.equal(result.length, 4);
    assert.equal(new Set(result.map(item => item.id)).size, 4);
    assert.equal(result.find(item => item.id === 'question').comments, 4);
});

test('spotlight chooses a real question before boilerplate and handles an empty feed', () => {
    assert.equal(model.spotlightPost(posts).id, 'question');
    assert.equal(model.spotlightPost([]), undefined);
});

test('topic classification uses question content and avoids AI substring matches', () => {
    assert.equal(model.arenaTopic('Should AI surpass human reasoning?'), 'technology');
    assert.equal(model.arenaTopic('Is privacy worth the trade-off?'), 'society');
    assert.equal(model.arenaTopic('What did they say about rainfall?'), 'all');
});

test('overlapping video pages cannot create duplicate children in the legacy feed', () => {
    const previous = [{ id: 'one' }, { id: 'two' }];
    const next = [{ id: 'two' }, { id: 'three' }];
    assert.equal(feed.uniqueById([...previous, ...next]).map(item => item.id).join(), 'one,two,three');
});
