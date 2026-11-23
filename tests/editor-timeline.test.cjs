const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const moduleObject = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/lib/editor/timeline.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
vm.runInNewContext(code, { module: moduleObject, exports: moduleObject.exports });
const { dragEdge, moveEdge, formatClipTime } = moduleObject.exports;
const equalRange = (actual, expected) => assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected);
test('a handle grabbed on a centered desktop editor does not jump to the far edge', () => {
    const initial = { start: 0, end: 30000 };
    // The editor starts at screen X=673. A 55px drag is still only 3 seconds.
    equalRange(dragEdge(initial, 'start', 0, 550, 30000), initial);
    equalRange(dragEdge(initial, 'start', 55, 550, 30000), { start: 3000, end: 30000 });
    equalRange(dragEdge(initial, 'end', -110, 550, 30000), { start: 0, end: 24000 });
});
test('dragging stays anchored to the grab point over successive move events', () => {
    const grabbed = { start: 10000, end: 27000 };
    for (const dx of [0, 20, 40, -20]) equalRange(dragEdge(grabbed, 'start', dx, 600, 30000), { start: 10000 + dx * 50, end: 27000 });
});
test('actual measured width determines movement after resizing or on a phone', () => {
    equalRange(dragEdge({ start: 0, end: 30000 }, 'start', 30, 300, 30000), { start: 3000, end: 30000 });
    equalRange(dragEdge({ start: 0, end: 30000 }, 'start', 30, 600, 30000), { start: 1500, end: 30000 });
});
test('handles cannot cross or leave the source boundaries', () => {
    const r = { start: 2000, end: 8000 };
    equalRange(moveEdge(r, 'start', 30000, 10000), { start: 7000, end: 8000 });
    equalRange(moveEdge(r, 'end', -20000, 10000), { start: 2000, end: 3000 });
    equalRange(moveEdge(r, 'start', -5000, 10000), { start: 0, end: 8000 });
    equalRange(moveEdge(r, 'end', 50000, 10000), { start: 2000, end: 10000 });
});
test('sub-second sources remain valid and cannot collapse to an empty range', () => {
    equalRange(moveEdge({ start: 0, end: 450 }, 'start', 400, 450), { start: 0, end: 450 });
    equalRange(moveEdge({ start: 0, end: 450 }, 'end', 10, 450), { start: 0, end: 450 });
});
test('loading, zero layout width and nonfinite input never create invalid offsets', () => {
    const r = { start: 0, end: 30000 };
    for (const w of [0, -1, NaN]) equalRange(dragEdge(r, 'start', 25, w, 30000), r);
    equalRange(dragEdge(r, 'start', NaN, 500, 30000), r);
    equalRange(moveEdge(r, 'start', 100, 0), r);
});
test('fine adjustments and timestamp formatting support 0.1 second precision', () => {
    equalRange(moveEdge({ start: 2000, end: 8000 }, 'start', 2100, 10000), { start: 2100, end: 8000 });
    assert.equal(formatClipTime(59100, true), '0:59.1');
    assert.equal(formatClipTime(59999, true), '1:00.0');
    assert.equal(formatClipTime(61000), '1:01');
    assert.equal(formatClipTime(NaN, true), '0:00.0');
});
