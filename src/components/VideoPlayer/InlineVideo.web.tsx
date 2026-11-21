import React, { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { encodeVideoUrl } from '../../lib/utils/url';

export interface InlineVideoHandle { seekTo: (positionMs: number) => void }
interface Props {
    url: string;
    playing: boolean;
    muted?: boolean;
    contentFit?: 'cover' | 'contain';
    style?: StyleProp<ViewStyle>;
    playbackRef?: Ref<InlineVideoHandle>;
    onTimeUpdate?: (currentMs: number, durationMs: number) => void;
    onFirstFrame?: () => void;
    onError?: () => void;
}

/** Catch the actual HTML play promise, including cancellation when a card unmounts. */
export function InlineVideo({ url, playing, muted = true, contentFit = 'cover', style, playbackRef, onTimeUpdate, onFirstFrame, onError }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        const element = videoRef.current;
        if (!element) return;
        if (playing) void element.play().catch(() => { /* Autoplay denial and removed media are recoverable. */ });
        else element.pause();
        return () => element.pause();
    }, [playing, url, muted]);
    useImperativeHandle(playbackRef, () => ({
        seekTo(positionMs) {
            const element = videoRef.current;
            if (!element || !Number.isFinite(positionMs) || !Number.isFinite(element.duration)) return;
            element.currentTime = Math.max(0, Math.min(positionMs / 1000, element.duration));
        },
    }), []);
    const updateTime = () => {
        const element = videoRef.current;
        if (element) onTimeUpdate?.(Number.isFinite(element.currentTime) ? element.currentTime * 1000 : 0, Number.isFinite(element.duration) ? element.duration * 1000 : 0);
    };
    return <video ref={videoRef} src={encodeVideoUrl(url) || undefined} muted={muted} loop playsInline controls={false} preload="metadata"
        onLoadedData={onFirstFrame} onError={onError} onTimeUpdate={updateTime} onLoadedMetadata={updateTime}
        style={{ ...StyleSheet.absoluteFill, width: '100%', height: '100%', ...(StyleSheet.flatten(style) as React.CSSProperties), objectFit: contentFit, pointerEvents: 'none' }} />;
}
