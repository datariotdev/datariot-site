import { supabase } from '../supabase/client';

export type VideoSurface = 'feed' | 'profile' | 'other';
type Sender = (videoId: string, surface: VideoSurface, watchMs: number, durationMs: number, sections: number) => Promise<boolean>;

export const sendVideoSample: Sender = async (videoId, surface, watchMs, durationMs, sections) => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.rpc('record_video_sample', {
            p_video: videoId,
            p_surface: surface,
            p_watch_ms: watchMs,
            p_duration_ms: durationMs,
            p_sections: sections,
        });
        return !error;
    } catch {
        return false;
    }
};

export const isVisibleApp = () => typeof document === 'undefined' || document.visibilityState === 'visible';

// Accumulate decoded media time. Seeks, background playback and pausing never add watch time.
export function createPlaybackSample() {
    let previous: { at: number; position: number; duration: number } | undefined;
    let watched = 0;
    let duration = 0;
    let sections = 0;
    let sent = 0;
    let pending = false;
    let lastAttempt = -Infinity;
    const coverage = Array<number>(20).fill(0);

    return {
        pause() { previous = undefined; },
        advance(position: number, length: number, rate: number, at: number) {
            if (!Number.isFinite(position) || !Number.isFinite(length) || length < 0.25 || position < 0 || position > length + 0.1) {
                previous = undefined;
                return;
            }
            const last = previous;
            previous = { position, duration: length, at };
            if (!last) return;
            if (duration > 0 && Math.abs(duration - length) > 0.5) {
                watched = 0;
                sent = 0;
                sections = 0;
                coverage.fill(0);
                duration = length;
                return;
            }
            duration = length;
            const elapsed = (at - last.at) / 1000;
            const allowed = elapsed * Math.min(Math.max(rate || 1, 0.25), 2) + 0.18;
            if (elapsed <= 0 || elapsed > 1.5 || Math.abs(last.duration - length) > 0.5) return;
            function add(from: number, to: number) {
                if (to <= from) return;
                watched = Math.min(watched + to - from, length * 2, 900);
                const bucket = length / 20;
                for (let step = 0; step < coverage.length; step++) {
                    const overlap = Math.min(to, (step + 1) * bucket) - Math.max(from, step * bucket);
                    if (overlap <= 0) continue;
                    coverage[step] += overlap;
                    if (coverage[step] >= bucket * 0.65) sections |= 1 << step;
                }
            }
            const end = Math.min(position, length);
            const step = end - last.position;
            if (step >= 0 && step <= allowed) add(last.position, end);
            else if (last.position > length - allowed && end < allowed && length - last.position + end <= allowed) {
                add(last.position, length);
                add(0, end);
            }
        },
        due() { return performance.now() - lastAttempt >= 3000 && watched - sent >= (sent === 0 ? 0.8 : 5); },
        async flush(send: (watchMs: number, durationMs: number, mask: number) => Promise<boolean>) {
            if (pending || watched < 0.25 || watched - sent < 0.15) return;
            pending = true;
            lastAttempt = performance.now();
            const snapshot = watched;
            try {
                if (await send(Math.round(snapshot * 1000), Math.round(duration * 1000), sections)) sent = snapshot;
            } finally {
                pending = false;
            }
        },
    };
}

// Suppress repeated impression writes in the app. The database also deduplicates across devices.
const impressions = new Map<string, number>();
export function recordVideoExposure(viewer: string, video: string, author: string, surface: VideoSurface) {
    if (viewer === author || !isVisibleApp()) return;
    const key = `${viewer}:${video}:${surface}`;
    const day = Math.floor(Date.now() / 86400000);
    if (impressions.get(key) === day) return;
    if (impressions.size >= 1500) impressions.delete(impressions.keys().next().value!);
    impressions.set(key, day);
    void sendVideoSample(video, surface, 0, 0, 0).then(ok => {
        if (!ok && impressions.get(key) === day) impressions.delete(key);
    });
}
