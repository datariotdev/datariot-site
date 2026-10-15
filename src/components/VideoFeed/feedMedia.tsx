import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Image, Platform } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEventListener } from 'expo';
import { HalftoneArt } from './MosaicFeed/HalftoneArt';
import { encodeVideoUrl } from '../../lib/utils/url';

/** Pieces of a video card that the deck, the arena pager and the originals strip all share */

export const formatNumber = (num: number): string => {
    const n = num || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
};

export const formatClock = (millis: number) => {
    const total = Math.floor(Math.max(0, millis) / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const sec = (total % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

/** 12M, 5H, 3D, 2MO: how long ago, short enough for a dot-matrix label */
export const ago = (iso?: string) => {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (isNaN(t)) return '';
    const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (mins < 60) return `${Math.max(1, mins)}M`;
    if (mins < 60 * 24) return `${Math.round(mins / 60)}H`;
    const days = Math.round(mins / (60 * 24));
    if (days < 30) return `${days}D`;
    if (days < 365) return `${Math.round(days / 30)}MO`;
    return `${Math.round(days / 365)}Y`;
};

// The placeholder picture service is not this clip's own picture
export const realThumb = (u?: string) => (u && !/picsum\.photos/.test(u) ? u : null);

interface FeedVideoProps {
    url: string;
    seed: string;
    thumb: string | null;
    active: boolean;
    paused: boolean;
    muted: boolean;
    onTime: (currentMs: number, durationMs: number) => void;
}

/** The clip itself. Shows the poster until the first frame is there, then plays. */
export const FeedVideo = ({ url, seed, thumb, active, paused, muted, onTime }: FeedVideoProps) => {
    const [ready, setReady] = useState(false);
    const [landscape, setLandscape] = useState(false);
    // The poster covers the player until its first frame is ready, then fades away
    const cover = useRef(new Animated.Value(1)).current;

    const player = useVideoPlayer(encodeVideoUrl(url), p => {
        p.loop = true;
        p.muted = true;
        p.timeUpdateEventInterval = 0.25;
    });

    useEventListener(player, 'timeUpdate', ({ currentTime }) => {
        onTime(currentTime * 1000, (player.duration || 0) * 1000);
    });
    useEventListener(player, 'statusChange', ({ status }) => {
        if (status === 'readyToPlay') setReady(true);
    });
    useEventListener(player, 'videoTrackChange', ({ videoTrack }) => {
        if (videoTrack?.size) setLandscape(videoTrack.size.width > videoTrack.size.height * 1.15);
    });

    useEffect(() => {
        player.muted = muted;
    }, [muted, player]);

    useEffect(() => {
        if (active && !paused) {
            // On the web play() hands back a promise that rejects when a quick scroll removes the clip
            Promise.resolve(player.play()).catch(() => {});
        } else {
            player.pause();
        }
    }, [active, paused, player]);

    useEffect(() => {
        Animated.timing(cover, { toValue: ready ? 0 : 1, duration: 260, useNativeDriver: true }).start();
    }, [ready, cover]);

    return (
        <View style={StyleSheet.absoluteFill}>
            {thumb ? (
                <>
                    {/* A softened copy of the poster fills what a wide clip leaves empty */}
                    <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={Platform.OS === 'web' ? 0 : 24} />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(7, 8, 12, 0.35)' }]} />
                </>
            ) : null}
            <VideoView player={player} style={StyleSheet.absoluteFill} contentFit={landscape ? 'contain' : 'cover'} nativeControls={false} />
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: cover, backgroundColor: '#06070A' }]} pointerEvents="none">
                {thumb ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <HalftoneArt seed={seed} isDark />}
            </Animated.View>
        </View>
    );
};

/** Four corner marks that appear while a clip plays, like a viewfinder locking on */
export const Viewfinder = ({ on }: { on: boolean }) => {
    const v = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(v, { toValue: on ? 1 : 0, duration: 350, useNativeDriver: true }).start();
    }, [on, v]);
    const mark = (pos: object, edges: object) => <View style={[styles.corner, pos, edges]} />;
    return (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: v }]} pointerEvents="none">
            {mark({ top: 12, left: 12 }, { borderTopWidth: 1.5, borderLeftWidth: 1.5, borderTopLeftRadius: 10 })}
            {mark({ top: 12, right: 12 }, { borderTopWidth: 1.5, borderRightWidth: 1.5, borderTopRightRadius: 10 })}
            {mark({ bottom: 14, left: 12 }, { borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderBottomLeftRadius: 10 })}
            {mark({ bottom: 14, right: 12 }, { borderBottomWidth: 1.5, borderRightWidth: 1.5, borderBottomRightRadius: 10 })}
        </Animated.View>
    );
};


/** A clip's first frame, paused, for cards that have no picture of their own */
export const PausedFrame = ({ url }: { url: string }) => {
    const player = useVideoPlayer(encodeVideoUrl(url), pl => {
        pl.muted = true;
        pl.loop = false;
        pl.pause();
    });
    return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
};

const styles = StyleSheet.create({
    corner: { position: 'absolute', width: 18, height: 18, borderColor: 'rgba(218, 230, 247, 0.7)' },
});
