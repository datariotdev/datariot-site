import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Image, Platform, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent, useEventListener } from 'expo';
import { PosterArt } from '../UI/PosterArt';
import { encodeVideoUrl } from '../../lib/utils/url';

/** Pieces of a video card that the deck, the arena pager and the originals strip all share */

export const formatNumber = (num: number): string => {
    const n = num || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toString();
};

export const formatClock = (millis: number) => {
    const total = Math.floor(Math.max(0, millis) / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const sec = (total % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

/** How long ago, the short way social apps write it: now, 12m, 5h, 3d, 11mo, 2y */
export const ago = (iso?: string) => {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (isNaN(t)) return '';
    const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    if (mins < 60 * 24) return `${Math.round(mins / 60)}h`;
    const days = Math.round(mins / (60 * 24));
    if (days < 30) return `${days}d`;
    if (days < 365) return `${Math.round(days / 30)}mo`;
    return `${Math.round(days / 365)}y`;
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

/** The clip itself. Its picture (or a soft gradient) shows until the first frame is there. */
export const FeedVideo = ({ url, seed, thumb, active, paused, muted, onTime }: FeedVideoProps) => {
    const player = useVideoPlayer(encodeVideoUrl(url), p => {
        p.loop = true;
        p.muted = true;
        p.timeUpdateEventInterval = 0.25;
    });

    // useEvent starts from the player's current state, so a clip that was ready before
    // this listener attached is not stuck behind its poster
    const { status } = useEvent(player, 'statusChange', { status: player.status });
    const { videoTrack } = useEvent(player, 'videoTrackChange', { videoTrack: player.videoTrack });
    const [started, setStarted] = useState(false);

    useEventListener(player, 'timeUpdate', ({ currentTime }) => {
        if (currentTime > 0 && !started) setStarted(true);
        onTime(currentTime * 1000, (player.duration || 0) * 1000);
    });

    const ready = status === 'readyToPlay' || started;
    const landscape = !!videoTrack?.size && videoTrack.size.width > videoTrack.size.height * 1.15;

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

    const cover = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.timing(cover, { toValue: ready ? 0 : 1, duration: 280, useNativeDriver: true }).start();
    }, [ready, cover]);

    return (
        <View style={StyleSheet.absoluteFill}>
            {thumb ? (
                <>
                    {/* A softened copy of the picture fills what a wide clip leaves empty */}
                    <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={Platform.OS === 'web' ? 0 : 24} />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(7, 8, 12, 0.35)' }]} />
                </>
            ) : null}
            <VideoView player={player} style={StyleSheet.absoluteFill} contentFit={landscape ? 'contain' : 'cover'} nativeControls={false} />
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: cover, backgroundColor: '#06070A' }]} pointerEvents="none">
                {thumb ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <PosterArt seed={seed} isDark glyph={false} />}
                {active && status !== 'error' ? (
                    <View style={styles.loading}>
                        <ActivityIndicator color="rgba(255, 255, 255, 0.8)" />
                    </View>
                ) : null}
            </Animated.View>
        </View>
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
    loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
