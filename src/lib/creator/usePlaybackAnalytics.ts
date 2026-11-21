import { useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import { createPlaybackSample, isVisibleApp, recordVideoExposure, sendVideoSample, VideoSurface } from './playback';

export function usePlaybackAnalytics(videoId: string, authorId: string, viewerId: string | undefined, surface: VideoSurface, active: boolean) {
    const sample = useMemo(() => createPlaybackSample(), [videoId, viewerId, surface]);
    const enabled = !!viewerId && viewerId !== authorId;
    const flush = () => {
        if (enabled) void sample.flush((watch, duration, sections) => sendVideoSample(videoId, surface, watch, duration, sections));
    };
    const flushRef = useRef(flush);
    flushRef.current = flush;

    useEffect(() => {
        if (!active || !enabled || !viewerId) return;
        recordVideoExposure(viewerId, videoId, authorId, surface);
        const save = flushRef.current;
        const pause = () => { sample.pause(); save(); };
        const subscription = AppState.addEventListener('change', state => { if (state !== 'active') pause(); });
        if (typeof document !== 'undefined') document.addEventListener('visibilitychange', pause);
        return () => {
            subscription.remove();
            if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', pause);
            pause();
        };
    }, [active, enabled, viewerId, videoId, authorId, surface, sample]);

    return (current: number, duration: number, rate: number, playing: boolean) => {
        if (!enabled || !active) return;
        if (!playing || AppState.currentState === 'background' || AppState.currentState === 'inactive' || !isVisibleApp()) {
            sample.pause();
            return;
        }
        sample.advance(current, duration, rate, performance.now());
        if (sample.due()) flush();
    };
}
