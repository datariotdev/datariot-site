const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const file = path.join(__dirname, '../src/lib/creator/playback.ts');
const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const exportsObject = {};
vm.runInNewContext(outputText, { exports: exportsObject, require: () => ({}), performance });
const { createPlaybackSample } = exportsObject;
const read = async sample => {
    let result;
    await sample.flush(async (...values) => { result = values; return true; });
    return result;
};

test('seeking to the end and background time do not count as playback', async () => {
    const sample = createPlaybackSample();
    sample.advance(0, 20, 1, 0);
    sample.advance(0.5, 20, 1, 500);
    sample.advance(19.5, 20, 1, 1000);
    sample.pause();
    sample.advance(19.5, 20, 1, 11000);
    assert.deepEqual(await read(sample), [500, 20000, 0]);
});

test('a complete short clip covers all 20 segments and flush is idempotent', async () => {
    const sample = createPlaybackSample();
    for (let i = 0; i <= 40; i++) sample.advance(i / 4, 10, 1, i * 250);
    assert.deepEqual(await read(sample), [10000, 10000, 1048575]);
    assert.equal(await read(sample), undefined);
});

test('replaying an opening segment does not create coverage later in the clip', async () => {
    const sample = createPlaybackSample();
    for (let repeat = 0; repeat < 5; repeat++) {
        sample.pause();
        for (let step = 0; step <= 4; step++) sample.advance(step / 4, 5, 1, repeat * 1250 + step * 250);
    }
    const [watched, duration, mask] = await read(sample);
    assert.equal(watched, duration);
    assert.equal(mask, 15);
});
