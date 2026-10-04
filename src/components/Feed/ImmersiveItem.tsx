import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, GestureResponderEvent, Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from '../../lib/supabase/hooks/useVideos';
import { timeAgo } from '../../lib/utils/format';
import { ICE, INK, ON_VIDEO, RADIUS, useUI } from '../../design-system/ui';
import { Txt } from '../core/Txt';
import { ActionRail } from './ActionRail';
import { ImmersiveVideo } from './ImmersiveVideo';

/** What the feed lets an item do. Stable for the life of the feed (see ImmersiveFeed). */
export interface ItemHandlers {
    like: (id: string) => void;
    likeOnly: (id: string) => void;
    comment: (id: string) => void;
    save: (id: string) => void;
    share: (video: Video) => void;
    follow: (authorId: string) => void;
    openProfile: (authorId: string) => void;
    openCategory: (category: string) => void;
    deepDive: (video: Video) => void;
}

interface ImmersiveItemProps {
    video: Video;
    width: number;
    height: number;
    /** Height of the floating tab bar: the caption, rail and progress line sit above it. */
    bottomInset: number;
    /** The page in view. */
    active: boolean;
    /** Close enough to the page in view to hold a player. */
    near: boolean;
    /** This screen is the one being looked at, and nothing is covering it. */
    focused: boolean;
    autoplay: boolean;
    muted: boolean;
    isOwn: boolean;
    handlers: ItemHandlers;
}

const DOUBLE_TAP_MS = 280;

const textShadow = {
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
} as const;

function GlassChip({ label, icon, strong, onPress }: { label: string; icon?: keyof typeof Ionicons.glyphMap; strong?: boolean; onPress?: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => [
                styles.chip,
                strong ? { backgroundColor: ICE, borderColor: ICE } : { backgroundColor: ON_VIDEO.glass, borderColor: 'rgba(255,255,255,0.16)' },
                pressed && { opacity: 0.75 },
            ]}
        >
            {icon ? <Ionicons name={icon} size={13} color={strong ? INK : '#FFFFFF'} /> : null}
            <Txt variant="caption" style={{ color: strong ? INK : '#FFFFFF' }}>{label}</Txt>
        </Pressable>
    );
}

/** The heart that blooms where a double tap lands. */
function HeartBurst({ burst }: { burst: { id: number; x: number; y: number } | null }) {
    const { c } = useUI();
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!burst) return;
        scale.setValue(0.3);
        opacity.setValue(1);
        Animated.sequence([
            Animated.spring(scale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
            Animated.delay(220),
            Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }),
        ]).start();
    }, [burst?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!burst) return null;
    return (
        <Animated.View
            pointerEvents="none"
            style={{ position: 'absolute', left: burst.x - 48, top: burst.y - 48, opacity, transform: [{ scale }, { rotate: '-10deg' }] }}
        >
            <Ionicons name="heart" size={96} color={c.like} style={{ textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 12, textShadowOffset: { width: 0, height: 2 } }} />
        </Animated.View>
    );
}

function ImmersiveItemBase({ video, width, height, bottomInset, active, near, focused, autoplay, muted, isOwn, handlers }: ImmersiveItemProps) {
    const [userPaused, setUserPaused] = useState(!autoplay);
    const [failed, setFailed] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const [burst, setBurst] = useState<{ id: number; x: number; y: number } | null>(null);

    const progress = useRef(new Animated.Value(0)).current;
    const posterOpacity = useRef(new Animated.Value(1)).current;
    const lastTap = useRef(0);
    const singleTap = useRef<ReturnType<typeof setTimeout> | null>(null);

    const playing = near && active && focused && !userPaused && !failed;

    // A clip you left starts over when you come back to it, as feeds do
    useEffect(() => {
        if (!active) {
            setUserPaused(!autoplay);
            setExpanded(false);
            progress.setValue(0);
        }
    }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

    // Out of the window, the player is gone: the poster has to cover again
    useEffect(() => {
        if (!near) {
            posterOpacity.setValue(1);
        }
    }, [near, posterOpacity]);

    useEffect(() => () => { if (singleTap.current) clearTimeout(singleTap.current); }, []);

    const handleReady = useCallback(() => {
        Animated.timing(posterOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }, [posterOpacity]);

    const handleFailed = useCallback(() => setFailed(true), []);

    const retry = () => {
        setFailed(false);
        posterOpacity.setValue(1);
        setRetryKey(k => k + 1);
    };

    // One tap pauses or resumes, two likes (and keeps liking, never un-liking)
    const onTap = (e: GestureResponderEvent) => {
        const now = Date.now();
        // A browser's click carries no locationX; bloom in the middle of the clip then
        const x = Number.isFinite(e.nativeEvent.locationX) ? e.nativeEvent.locationX : width / 2;
        const y = Number.isFinite(e.nativeEvent.locationY) ? e.nativeEvent.locationY : height * 0.45;
        if (now - lastTap.current < DOUBLE_TAP_MS) {
            if (singleTap.current) clearTimeout(singleTap.current);
            lastTap.current = now;
            setBurst({ id: now, x, y });
            handlers.likeOnly(video.id);
        } else {
            lastTap.current = now;
            singleTap.current = setTimeout(() => setUserPaused(p => !p), DOUBLE_TAP_MS);
        }
    };

    const when = timeAgo(video.createdAt);
    const hasDescription = !!video.description && video.description.trim().length > 0 && video.description.trim() !== video.title.trim();

    return (
        <View style={{ width, height, backgroundColor: '#000' }}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onTap} accessibilityLabel={userPaused ? 'Play video' : 'Pause video'}>
                {near && !!video.videoUrl ? (
                    <ImmersiveVideo
                        key={retryKey}
                        url={video.videoUrl}
                        playing={playing}
                        muted={muted}
                        progress={progress}
                        onReady={handleReady}
                        onFailed={handleFailed}
                    />
                ) : null}

                {/* The thumbnail covers until the first frame, then gets out of the way */}
                {video.posterUrl ? (
                    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: posterOpacity }]}>
                        <Image source={{ uri: video.posterUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    </Animated.View>
                ) : null}
            </Pressable>

            {/* Legibility: a soft dark at the top and a deeper one at the bottom, nothing in between */}
            <LinearGradient
                pointerEvents="none"
                colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
                style={[styles.topScrim, { height: 150 }]}
            />
            <LinearGradient
                pointerEvents="none"
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.38)', 'rgba(0,0,0,0.72)']}
                locations={[0, 0.55, 1]}
                style={[styles.bottomScrim, { height: bottomInset + 300 }]}
            />

            <HeartBurst burst={burst} />

            {userPaused && !failed ? (
                <View pointerEvents="none" style={styles.centerWrap}>
                    <View style={styles.playDisc}>
                        <Ionicons name="play" size={34} color="#FFFFFF" style={{ marginLeft: 4 }} />
                    </View>
                </View>
            ) : null}

            {failed ? (
                <View style={styles.centerWrap}>
                    <Ionicons name="cloud-offline-outline" size={30} color="#FFFFFF" />
                    <Txt variant="bodyStrong" tone="onVideo" style={{ marginTop: 10 }}>Couldn&apos;t load this video</Txt>
                    <Pressable onPress={retry} accessibilityRole="button" style={styles.retry}>
                        <Txt variant="callout" style={{ color: INK }}>Try again</Txt>
                    </Pressable>
                </View>
            ) : null}

            {/* Creator, caption, and the two ways in: its category and its Deep Dive */}
            <View style={[styles.caption, { bottom: bottomInset + 18 }]} pointerEvents="box-none">
                <Pressable onPress={() => handlers.openProfile(video.authorId)} style={styles.authorRow} accessibilityRole="button">
                    <Txt variant="headline" tone="onVideo" style={textShadow} numberOfLines={1}>@{video.author}</Txt>
                    {when ? <Txt variant="callout" tone="onVideoDim" style={textShadow}>  ·  {when}</Txt> : null}
                </Pressable>

                <Pressable onPress={() => setExpanded(v => !v)} accessibilityRole="button" accessibilityLabel={expanded ? 'Show less' : 'Show more'}>
                    <Txt variant="bodyStrong" tone="onVideo" style={textShadow} numberOfLines={expanded ? 6 : 2}>{video.title}</Txt>
                    {hasDescription ? (
                        <Txt variant="callout" tone="onVideoDim" style={[textShadow, { marginTop: 3 }]} numberOfLines={expanded ? 8 : 1}>
                            {video.description}
                        </Txt>
                    ) : null}
                </Pressable>

                <View style={styles.chips}>
                    <GlassChip label="Deep dive" icon="sparkles" strong onPress={() => handlers.deepDive(video)} />
                    {video.category ? <GlassChip label={video.category} onPress={() => handlers.openCategory(video.category as string)} /> : null}
                </View>
            </View>

            <View style={[styles.railWrap, { bottom: bottomInset + 14 }]} pointerEvents="box-none">
                <ActionRail
                    video={video}
                    isOwn={isOwn}
                    onLike={() => handlers.like(video.id)}
                    onComment={() => handlers.comment(video.id)}
                    onSave={() => handlers.save(video.id)}
                    onShare={() => handlers.share(video)}
                    onFollow={() => handlers.follow(video.authorId)}
                    onOpenProfile={() => handlers.openProfile(video.authorId)}
                />
            </View>

            {/* How far through you are */}
            {active ? (
                <View style={[styles.progressTrack, { bottom: bottomInset }]} pointerEvents="none">
                    <Animated.View
                        style={[
                            styles.progressFill,
                            { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
                        ]}
                    />
                </View>
            ) : null}
        </View>
    );
}

export const ImmersiveItem = memo(ImmersiveItemBase, (a, b) =>
    a.video === b.video &&
    a.width === b.width &&
    a.height === b.height &&
    a.bottomInset === b.bottomInset &&
    a.active === b.active &&
    a.near === b.near &&
    a.focused === b.focused &&
    a.autoplay === b.autoplay &&
    a.muted === b.muted &&
    a.isOwn === b.isOwn &&
    a.handlers === b.handlers,
);

const styles = StyleSheet.create({
    topScrim: { position: 'absolute', top: 0, left: 0, right: 0 },
    bottomScrim: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    centerWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    playDisc: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: ON_VIDEO.glassStrong,
        alignItems: 'center',
        justifyContent: 'center',
    },
    retry: {
        marginTop: 14,
        height: 38,
        paddingHorizontal: 20,
        borderRadius: RADIUS.pill,
        backgroundColor: ICE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    caption: { position: 'absolute', left: 16, right: 84, gap: 6 },
    authorRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
    chip: {
        height: 30,
        paddingHorizontal: 12,
        borderRadius: RADIUS.pill,
        borderWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    railWrap: { position: 'absolute', right: 8 },
    progressTrack: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: ON_VIDEO.track },
    progressFill: { height: 2, backgroundColor: '#FFFFFF' },
});
