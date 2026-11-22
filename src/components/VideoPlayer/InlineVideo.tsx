import React, { useEffect, useImperativeHandle, type Ref } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { encodeVideoUrl } from '../../lib/utils/url';

export interface InlineVideoHandle {
    seekTo: (positionMs: number) => void;
}

interface InlineVideoProps {
    url: string;
    playing: boolean;
    active?: boolean;
    muted?: boolean;
    contentFit?: 'cover' | 'contain';
    style?: StyleProp<ViewStyle>;
    playbackRef?: Ref<InlineVideoHandle>;
    onTimeUpdate?: (currentMs: number, durationMs: number) => void;
    onFirstFrame?: () => void;
    onError?: () => void;
    playbackRate?: number;
    onPlayingChange?: (playing: boolean) => void;
}

/** Managed expo-video lifecycle shared by previews and the full-screen feed. */
export function InlineVideo({ url, playing, muted = true, contentFit = 'cover', style, playbackRef, onTimeUpdate, onFirstFrame, onError }: InlineVideoProps) {
    const player = useVideoPlayer(encodeVideoUrl(url), instance => {
        instance.loop = true;
        instance.muted = true;
        instance.timeUpdateEventInterval = 0.25;
    });

    useEffect(() => {
        // expo-video exposes an imperative native handle, not immutable React state.
        // eslint-disable-next-line react-hooks/immutability
        player.muted = muted;
        if (playing) {
            Promise.resolve(player.play()).catch(() => {
                // Browsers may reject autoplay, or playback interrupted by navigation.
            });
        } else {
            player.pause();
        }
    }, [player, playing, muted]);

    useEventListener(player, 'timeUpdate', ({ currentTime }) => {
        onTimeUpdate?.(
            Number.isFinite(currentTime) ? currentTime * 1000 : 0,
            Number.isFinite(player.duration) ? player.duration * 1000 : 0,
        );
    });
    useEventListener(player, 'statusChange', ({ status }) => { if (status === 'error') onError?.(); });

    useImperativeHandle(playbackRef, () => ({
        seekTo(positionMs) {
            if (!Number.isFinite(positionMs)) return;
            player.currentTime = Math.max(0, Math.min(positionMs / 1000, player.duration || 0));
        },
    }), [player]);

    return (
        <View style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }, style]} pointerEvents="none">
            <VideoView player={player} style={StyleSheet.absoluteFill} contentFit={contentFit} nativeControls={false} playsInline onFirstFrameRender={onFirstFrame} surfaceType="textureView" />
        </View>
    );
}
