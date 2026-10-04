import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer, VideoContentFit } from 'expo-video';
import { useEventListener } from 'expo';
import { encodeVideoUrl } from '../../lib/utils/url';

interface ImmersiveVideoProps {
    url: string;
    /** Should be running right now: this page, on screen, not paused by the viewer. */
    playing: boolean;
    muted: boolean;
    /** Written 0..1 while playing, for the thin progress line. */
    progress: Animated.Value;
    onReady: () => void;
    onFailed: () => void;
}

/**
 * One clip: the player, the sound, the progress. Mounted only for the page in
 * view and the pages next to it, so a long feed holds three players, not forty.
 */
export function ImmersiveVideo({ url, playing, muted, progress, onReady, onFailed }: ImmersiveVideoProps) {
    const source = encodeVideoUrl(url) || '';
    const player = useVideoPlayer(source, p => {
        p.loop = true;
        p.muted = muted;
    });

    // Portrait clips fill the screen (the app asks for 9:16); a landscape one sits whole in
    // the middle once the phone reports its size. Until then, and on the web where the size
    // is not reported, assume portrait.
    const [fit, setFit] = useState<VideoContentFit>('cover');

    const applySize = (size?: { width: number; height: number } | null) => {
        if (!size || !size.width || !size.height) return;
        setFit(size.height / size.width >= 1.2 ? 'cover' : 'contain');
    };

    useEffect(() => {
        player.muted = muted;
    }, [muted, player]);

    useEffect(() => {
        try {
            if (playing) player.play();
            else player.pause();
        } catch (e) {
            console.warn('[ImmersiveVideo] play/pause failed:', e);
        }
    }, [playing, player]);

    useEventListener(player, 'statusChange', ({ status }) => {
        if (status === 'readyToPlay') {
            try {
                applySize(player.videoTrack?.size ?? player.availableVideoTracks?.[0]?.size);
            } catch { /* not reported on this platform */ }
            onReady();
        } else if (status === 'error') {
            onFailed();
        }
    });

    useEventListener(player, 'videoTrackChange', ({ videoTrack }) => applySize(videoTrack?.size));

    // The thin progress line: sampled four times a second, only while playing
    useEffect(() => {
        if (!playing) return;
        const id = setInterval(() => {
            try {
                const d = player.duration;
                if (d > 0) progress.setValue(Math.min(1, player.currentTime / d));
            } catch { /* player released */ }
        }, 250);
        return () => clearInterval(id);
    }, [playing, player, progress]);

    return (
        <VideoView
            player={player}
            // width/height as well as absoluteFill: a browser's <video> keeps its own size otherwise
            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
            contentFit={fit}
            nativeControls={false}
        />
    );
}
