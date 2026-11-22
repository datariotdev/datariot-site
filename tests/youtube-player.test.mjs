import test from 'node:test';
import assert from 'node:assert/strict';
import { youtubeVideoId, syncYouTubePlayback, youtubeSeekSeconds } from '../src/lib/utils/youtube.ts';

test('supported HTTPS YouTube URLs resolve to one canonical ID', () => {
    const id = 'UlBFeDhGzx0';
    for (const url of [
        'https://www.youtube.com/watch?v=' + id,
        'https://www.youtube.com/shorts/' + id,
        'https://youtu.be/' + id + '?t=4',
        'https://www.youtube-nocookie.com/embed/' + id,
        'https://m.youtube.com/watch?v=' + id + '&feature=share',
    ]) assert.equal(youtubeVideoId(url), id);
});

test('rejects executable URLs, host spoofing, credentials and malformed IDs', () => {
    for (const value of [
        null, {}, 'UlBFeDhGzx0', 'javascript:alert(1)', 'http://youtube.com/watch?v=UlBFeDhGzx0',
        'https://youtube.com.evil.test/watch?v=UlBFeDhGzx0',
        'https://youtube.com@evil.test/watch?v=UlBFeDhGzx0',
        'https://attacker@youtube.com/watch?v=UlBFeDhGzx0',
        'https://youtu.be/UlBFeDhGzx0/extra', 'https://youtube.com/watch?v=short',
        'https://youtube.com:444/watch?v=UlBFeDhGzx0',
    ]) assert.equal(youtubeVideoId(value), null);
});

test('switching away explicitly pauses the player; returning restores requested audio and rate', () => {
    const calls = [];
    const player = {
        playVideo: () => calls.push('play'), pauseVideo: () => calls.push('pause'),
        mute: () => calls.push('mute'), unMute: () => calls.push('unmute'),
        setPlaybackRate: rate => calls.push(rate), getAvailablePlaybackRates: () => [1, 1.5, 2],
    };
    syncYouTubePlayback(player, { playing: true, muted: false, rate: 1.5 });
    assert.deepEqual(calls, ['unmute', 1.5, 'play']);
    calls.length = 0;
    syncYouTubePlayback(player, { playing: false, muted: true, rate: 3 });
    assert.deepEqual(calls, ['mute', 1, 'pause']);
});

test('seeking clamps to media boundaries and rejects invalid metadata', () => {
    assert.equal(youtubeSeekSeconds(5000, 60), 5);
    assert.equal(youtubeSeekSeconds(-1000, 60), 0);
    assert.equal(youtubeSeekSeconds(90000, 60), 60);
    assert.equal(youtubeSeekSeconds(Infinity, 60), null);
    assert.equal(youtubeSeekSeconds(1000, 0), null);
});
