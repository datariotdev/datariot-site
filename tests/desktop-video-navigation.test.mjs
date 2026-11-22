import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesktopWheelGesture, adjacentDesktopVideoId } from '../src/lib/utils/desktopVideoNavigation.ts';

test('a long trackpad gesture changes exactly one clip despite momentum', () => {
    const wheel = createDesktopWheelGesture();
    const steps = [];
    for (let at = 0; at < 1600; at += 20) steps.push(wheel(at < 200 ? 20 : 4, 0, at));
    assert.equal(steps.filter(Boolean).length, 1);
    assert.equal(steps.find(Boolean), 1);
});
test('a new gesture works immediately after an idle gap', () => {
    const wheel = createDesktopWheelGesture();
    assert.equal(wheel(100, 0, 0), 1);
    assert.equal(wheel(100, 0, 200), 1);
    assert.equal(wheel(-100, 0, 400), -1);
});
test('small trackpad samples accumulate into a deliberate switch', () => {
    const wheel = createDesktopWheelGesture();
    assert.equal(wheel(15, 0, 0), 0);
    assert.equal(wheel(15, 0, 10), 0);
    assert.equal(wheel(15, 0, 20), 1);
});
test('changing direction discards old accumulated movement', () => {
    const wheel = createDesktopWheelGesture();
    assert.equal(wheel(35, 0, 0), 0);
    assert.equal(wheel(-25, 0, 20), 0);
    assert.equal(wheel(-25, 0, 40), -1);
});
test('line and page wheel units are supported', () => {
    assert.equal(createDesktopWheelGesture()(3, 1, 0), 1);
    assert.equal(createDesktopWheelGesture()(-1, 2, 0), -1);
});
test('empty or invalid wheel movement does not navigate', () => {
    const wheel = createDesktopWheelGesture();
    assert.equal(wheel(0, 0, 0), 0);
    assert.equal(wheel(NaN, 0, 10), 0);
    assert.equal(wheel(Infinity, 0, 20), 0);
});
test('explicit navigation has no cooldown and respects both boundaries', () => {
    const ids = ['a', 'b', 'c'];
    assert.equal(adjacentDesktopVideoId(ids, 'a', -1), null);
    assert.equal(adjacentDesktopVideoId(ids, 'a', 1), 'b');
    assert.equal(adjacentDesktopVideoId(ids, 'b', 1), 'c');
    assert.equal(adjacentDesktopVideoId(ids, 'c', 1), null);
    assert.equal(adjacentDesktopVideoId(ids, 'c', -1), 'b');
});
test('navigation follows video identity when the feed changes', () => {
    assert.equal(adjacentDesktopVideoId(['new', 'a', 'b', 'c'], 'b', 1), 'c');
    assert.equal(adjacentDesktopVideoId(['a'], 'missing', 1), 'a');
    assert.equal(adjacentDesktopVideoId([], 'missing', 1), null);
});
