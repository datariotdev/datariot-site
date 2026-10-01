import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { encodeVideoUrl } from '../../lib/utils/url';
import { VideoScrubber, formatCount } from '../VideoPlayer/VideoControls';
import { FONT } from '@design-system/fonts';
import { ICE, INK } from '@design-system/theme';
import { pixelClip } from '@design-system/pixel';

/**
 * The full-screen player on the web.
 *
 * Laid out like the phone: the video, then over its foot the author and title,
 * a row with Like / Comment / Save / More and the comment bar, and the
 * scrubber along the bottom edge. On a wide window the video is a centred 9:16
 * stage rather than a wall of black; on a phone-sized window it is the whole
 * window. Native keeps the overlay controls in VideoControls.
 *
 * It plays through a plain <video>: expo-av's web element keeps its natural
 * size and sits in the corner of any container larger than the clip, and it
 * has no way to seek.
 *
 * `shouldLoad` is true only for the clip on screen and its neighbours. The
 * list mounts many rows at once, and a <video> that is mounted starts
 * downloading and decoding whether or not anyone is watching it.
 */

interface WebVideoStageProps {
    item: any;
    isActive: boolean;
    shouldLoad: boolean;
    width: number;
    height: number;
    onLike: () => void;
    onComment: () => void;
    onSave: () => void;
    onMore: () => void;
    onFollow: () => void;
}

const HAIRLINE = 'rgba(218, 230, 247, 0.18)';
const GLASS = 'rgba(218, 230, 247, 0.1)';

const ActionButton = ({
    label,
    active,
    onPress,
    children,
}: {
    label: string;
    active?: boolean;
    onPress: () => void;
    children: (color: string) => React.ReactNode;
}) => {
    const [hovered, setHovered] = useState(false);
    return (
        <Pressable
            onPress={onPress}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            style={styles.action}
            accessibilityLabel={label}
        >
            <View
                style={[
                    styles.actionTile,
                    pixelClip(4),
                    {
                        backgroundColor: active ? ICE : hovered ? 'rgba(218, 230, 247, 0.2)' : GLASS,
                        borderColor: active ? ICE : hovered ? 'rgba(218, 230, 247, 0.5)' : HAIRLINE,
                    },
                ]}
            >
                {children(active ? INK : ICE)}
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
        </Pressable>
    );
};

export function WebVideoStage({ item, isActive, shouldLoad, width, height, onLike, onComment, onSave, onMore, onFollow }: WebVideoStageProps) {
    const router = useRouter();
    const videoRef = useRef<any>(null);
    const [paused, setPaused] = useState(false);
    const [clock, setClock] = useState({ time: 0, duration: 0 });
    const [imageError, setImageError] = useState(false);

    const compact = width < 760;
    const stageH = compact ? height : Math.max(360, height - 110);
    const stageW = compact ? width : Math.min(Math.round((stageH * 9) / 16), 600);
    const narrow = stageW < 460;

    const url = item.videoUrl || item.url;
    const author = item.author || item.authorName || '';

    // Play only the active, un-paused clip.
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (isActive && !paused) {
            const p = v.play?.();
            if (p && typeof p.catch === 'function') p.catch(() => { });
        } else {
            v.pause?.();
        }
    }, [isActive, paused, shouldLoad]);

    // A clip that has scrolled away starts over next time.
    useEffect(() => {
        if (!isActive) {
            setPaused(false);
            const v = videoRef.current;
            if (v) v.currentTime = 0;
        }
    }, [isActive]);

    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(250)
        .onEnd(() => { onLike(); });

    const openProfile = () => {
        if (item.authorId) router.push(`/user/${item.authorId}`);
    };

    const seek = (ms: number) => {
        const v = videoRef.current;
        if (v) v.currentTime = ms / 1000;
    };

    const stage = (
        <GestureDetector gesture={doubleTap}>
            <View
                style={[
                    styles.stage,
                    compact ? null : [pixelClip(10), { borderWidth: 1, borderColor: HAIRLINE }],
                    { width: stageW, height: stageH },
                ]}
            >
                {url && shouldLoad ? (
                    React.createElement('video', {
                        ref: videoRef,
                        src: encodeVideoUrl(url) || '',
                        muted: true,
                        loop: true,
                        playsInline: true,
                        preload: isActive ? 'auto' : 'metadata',
                        onTimeUpdate: isActive ? (e: any) => {
                            const v = e.currentTarget;
                            setClock({
                                time: (v.currentTime || 0) * 1000,
                                duration: Number.isFinite(v.duration) ? v.duration * 1000 : 0,
                            });
                        } : undefined,
                        style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000' },
                    })
                ) : !url ? (
                    <View style={[StyleSheet.absoluteFill, styles.center]}>
                        <Ionicons name="videocam-off" size={56} color="rgba(218,230,247,0.2)" />
                    </View>
                ) : null}

                <Pressable style={StyleSheet.absoluteFill} onPress={() => setPaused(p => !p)} accessibilityLabel={paused ? 'Play' : 'Pause'}>
                    {paused && (
                        <View style={[StyleSheet.absoluteFill, styles.center]}>
                            <View style={[styles.pauseTile, pixelClip(6)]}>
                                <Ionicons name="play" size={34} color={INK} style={{ marginLeft: 3 }} />
                            </View>
                        </View>
                    )}
                </Pressable>

                <LinearGradient
                    colors={['transparent', 'rgba(7,8,12,0.6)', 'rgba(7,8,12,0.94)']}
                    locations={[0, 0.5, 1]}
                    style={styles.scrim}
                    pointerEvents="none"
                />

                {/* Who and what */}
                <View style={styles.info} pointerEvents="box-none">
                    <View style={styles.authorRow}>
                        <Pressable onPress={openProfile} style={[styles.avatar, pixelClip(3)]}>
                            {item.avatarUrl && !imageError ? (
                                <Image source={{ uri: item.avatarUrl }} style={StyleSheet.absoluteFill} onError={() => setImageError(true)} />
                            ) : (
                                <Text style={styles.avatarText}>{author[0]?.toUpperCase() || '?'}</Text>
                            )}
                        </Pressable>
                        <Pressable onPress={openProfile} style={{ flexShrink: 1 }}>
                            <Text style={styles.author} numberOfLines={1}>{author ? `> @${author.toLowerCase()}` : '> @unknown'}</Text>
                        </Pressable>
                        {!item.isFollowing && !!item.authorId && (
                            <Pressable onPress={onFollow} style={[styles.follow, pixelClip(2)]}>
                                <Text style={styles.followText}>[ FOLLOW ]</Text>
                            </Pressable>
                        )}
                    </View>
                    <Text style={styles.title} numberOfLines={2}>
                        {item.title || ''}
                        {item.hashtag ? <Text style={styles.hashtag}>{`  #${item.hashtag}`}</Text> : null}
                    </Text>
                </View>

                {/* Like / Comment / Save / More and the comment bar */}
                <View style={styles.controls} pointerEvents="box-none">
                    <View style={styles.actions}>
                        <ActionButton label={formatCount(item.likes || 0)} active={!!item.isLiked} onPress={onLike}>
                            {(c) => <Text style={{ color: c, fontSize: 20 }}>✦</Text>}
                        </ActionButton>
                        <ActionButton label={formatCount(item.comments || 0)} onPress={onComment}>
                            {(c) => <Ionicons name="chatbubble-outline" size={20} color={c} />}
                        </ActionButton>
                        <ActionButton label={formatCount(item.saved || 0)} active={!!item.isSaved} onPress={onSave}>
                            {(c) => <Ionicons name={item.isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={c} />}
                        </ActionButton>
                        <ActionButton label="MORE" onPress={onMore}>
                            {(c) => <Ionicons name="ellipsis-horizontal" size={20} color={c} />}
                        </ActionButton>
                    </View>

                    <Pressable onPress={onComment} style={[styles.commentBar, pixelClip(4)]}>
                        <Text style={styles.commentPlaceholder} numberOfLines={1}>{narrow ? 'Comment...' : 'Add a comment...'}</Text>
                        <View style={[styles.send, pixelClip(3)]}>
                            <Ionicons name="arrow-up" size={16} color={INK} />
                        </View>
                    </Pressable>
                </View>

                {/* Timeline */}
                <View style={styles.timeline} pointerEvents="box-none">
                    <VideoScrubber currentTime={clock.time} duration={clock.duration} onSeek={seek} />
                </View>
            </View>
        </GestureDetector>
    );

    if (compact) {
        return <View style={{ width, height, backgroundColor: '#000' }}>{stage}</View>;
    }

    return <View style={[styles.outer, { width, height }]}>{stage}</View>;
}

const styles = StyleSheet.create({
    outer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    stage: {
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pauseTile: {
        width: 76,
        height: 76,
        backgroundColor: ICE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrim: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 290,
    },
    info: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 128,
        gap: 10,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatar: {
        width: 34,
        height: 34,
        overflow: 'hidden',
        backgroundColor: GLASS,
        borderWidth: 1,
        borderColor: HAIRLINE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: ICE,
        fontFamily: FONT.display,
        fontSize: 18,
    },
    author: {
        color: ICE,
        fontFamily: FONT.techMedium,
        fontSize: 12,
        letterSpacing: 0.6,
    },
    follow: {
        borderWidth: 1,
        borderColor: 'rgba(218, 230, 247, 0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    followText: {
        color: ICE,
        fontFamily: FONT.tech,
        fontSize: 9,
        letterSpacing: 1.4,
    },
    title: {
        color: '#EEF2FA',
        fontFamily: FONT.sansBold,
        fontSize: 17,
        lineHeight: 23,
    },
    hashtag: {
        color: ICE,
        fontFamily: FONT.tech,
        fontSize: 12,
    },
    controls: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 44,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    action: {
        alignItems: 'center',
        gap: 4,
        // @ts-ignore — web-only
        cursor: 'pointer',
    },
    actionTile: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        // @ts-ignore — web-only
        transition: 'background-color 0.18s ease, border-color 0.18s ease',
    },
    actionLabel: {
        color: ICE,
        fontFamily: FONT.tech,
        fontSize: 10,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    commentBar: {
        flex: 1,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 14,
        paddingRight: 4,
        backgroundColor: GLASS,
        borderWidth: 1,
        borderColor: HAIRLINE,
        // @ts-ignore — web-only
        cursor: 'text',
    },
    commentPlaceholder: {
        flex: 1,
        color: 'rgba(238, 242, 250, 0.6)',
        fontFamily: FONT.sans,
        fontSize: 14,
    },
    send: {
        width: 30,
        height: 30,
        backgroundColor: ICE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeline: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 4,
    },
});
