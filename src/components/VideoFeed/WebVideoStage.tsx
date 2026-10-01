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
 * On a wide window a vertical video is a column, not a wall: a centred 9:16
 * stage with the video, its title and the scrubber inside it, the actions in a
 * rail beside it and the comment bar underneath, all the stage's own width. On
 * a phone-sized window the stage is the whole window and the rail floats over
 * its right edge. Native keeps the overlay controls in VideoControls.
 *
 * It plays through a plain <video>: expo-av's web element keeps its natural
 * size and sits in the corner of any container larger than the clip, and it
 * has no way to seek.
 */

interface WebVideoStageProps {
    item: any;
    isActive: boolean;
    width: number;
    height: number;
    onLike: () => void;
    onComment: () => void;
    onSave: () => void;
    onMore: () => void;
    onFollow: () => void;
}

const HAIRLINE = 'rgba(218, 230, 247, 0.18)';
const GLASS = 'rgba(218, 230, 247, 0.08)';

const RailButton = ({
    label,
    count,
    active,
    onPress,
    compact,
    children,
}: {
    label: string;
    count?: number;
    active?: boolean;
    onPress: () => void;
    compact: boolean;
    children: (color: string) => React.ReactNode;
}) => {
    const [hovered, setHovered] = useState(false);
    const size = compact ? 46 : 54;
    return (
        <Pressable
            onPress={onPress}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            style={styles.railItem}
            accessibilityLabel={label}
        >
            <View
                style={[
                    styles.railTile,
                    pixelClip(4),
                    {
                        width: size,
                        height: size,
                        backgroundColor: active ? ICE : hovered ? 'rgba(218, 230, 247, 0.16)' : GLASS,
                        borderColor: active ? ICE : hovered ? 'rgba(218, 230, 247, 0.5)' : HAIRLINE,
                    },
                ]}
            >
                {children(active ? INK : ICE)}
            </View>
            <Text style={styles.railLabel}>{count !== undefined ? formatCount(count) : label}</Text>
        </Pressable>
    );
};

export function WebVideoStage({ item, isActive, width, height, onLike, onComment, onSave, onMore, onFollow }: WebVideoStageProps) {
    const router = useRouter();
    const videoRef = useRef<any>(null);
    const [paused, setPaused] = useState(false);
    const [clock, setClock] = useState({ time: 0, duration: 0 });
    const [imageError, setImageError] = useState(false);

    const compact = width < 760;
    const stageH = compact ? height : Math.max(360, height - 150);
    const stageW = compact ? width : Math.min(Math.round((stageH * 9) / 16), 600);

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
    }, [isActive, paused]);

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
                {url ? (
                    React.createElement('video', {
                        ref: videoRef,
                        src: encodeVideoUrl(url) || '',
                        muted: true,
                        loop: true,
                        playsInline: true,
                        preload: 'auto',
                        onTimeUpdate: (e: any) => {
                            const v = e.currentTarget;
                            setClock({
                                time: (v.currentTime || 0) * 1000,
                                duration: Number.isFinite(v.duration) ? v.duration * 1000 : 0,
                            });
                        },
                        style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000' },
                    })
                ) : (
                    <View style={[StyleSheet.absoluteFill, styles.center]}>
                        <Ionicons name="videocam-off" size={56} color="rgba(218,230,247,0.2)" />
                    </View>
                )}

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
                    colors={['transparent', 'rgba(7,8,12,0.55)', 'rgba(7,8,12,0.92)']}
                    locations={[0, 0.5, 1]}
                    style={[styles.scrim, { height: compact ? 300 : 230 }]}
                    pointerEvents="none"
                />

                {/* Who and what */}
                <View style={[styles.info, { bottom: compact ? 118 : 50, right: compact ? 84 : 20 }]} pointerEvents="box-none">
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

                {/* Timeline */}
                <View style={[styles.timeline, { bottom: compact ? 66 : 6 }]} pointerEvents="box-none">
                    <VideoScrubber currentTime={clock.time} duration={clock.duration} onSeek={seek} />
                </View>

                {compact && (
                    <View style={[styles.rail, { right: 12, bottom: 128 }]}>{renderRail()}</View>
                )}

                {compact && (
                    <View style={[styles.commentWrap, { left: 14, right: 14, bottom: 14 }]}>{renderCommentBar()}</View>
                )}
            </View>
        </GestureDetector>
    );

    function renderRail() {
        return (
            <>
                <RailButton label="Like" count={item.likes || 0} active={!!item.isLiked} onPress={onLike} compact={compact}>
                    {(c) => <Text style={{ color: c, fontSize: 22 }}>✦</Text>}
                </RailButton>
                <RailButton label="Comment" count={item.comments || 0} onPress={onComment} compact={compact}>
                    {(c) => <Ionicons name="chatbubble-outline" size={22} color={c} />}
                </RailButton>
                <RailButton label="Save" count={item.saved || 0} active={!!item.isSaved} onPress={onSave} compact={compact}>
                    {(c) => <Ionicons name={item.isSaved ? 'bookmark' : 'bookmark-outline'} size={22} color={c} />}
                </RailButton>
                <RailButton label="More" onPress={onMore} compact={compact}>
                    {(c) => <Ionicons name="ellipsis-horizontal" size={22} color={c} />}
                </RailButton>
            </>
        );
    }

    function renderCommentBar() {
        return (
            <Pressable onPress={onComment} style={[styles.commentBar, pixelClip(4)]}>
                <Text style={styles.commentPlaceholder}>Add a comment...</Text>
                <View style={[styles.send, pixelClip(3)]}>
                    <Ionicons name="arrow-up" size={16} color={INK} />
                </View>
            </Pressable>
        );
    }

    if (compact) {
        return <View style={{ width, height, backgroundColor: '#000' }}>{stage}</View>;
    }

    return (
        <View style={[styles.outer, { width, height }]}>
            <View style={{ width: stageW }}>
                <View>
                    {stage}
                    <View style={[styles.rail, { left: stageW + 20, bottom: 0 }]}>{renderRail()}</View>
                </View>
                <View style={styles.commentRow}>{renderCommentBar()}</View>
            </View>
        </View>
    );
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
    },
    info: {
        position: 'absolute',
        left: 18,
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
    timeline: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
    rail: {
        position: 'absolute',
        gap: 14,
        alignItems: 'center',
    },
    railItem: {
        alignItems: 'center',
        gap: 6,
        // @ts-ignore — web-only
        cursor: 'pointer',
    },
    railTile: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        // @ts-ignore — web-only
        transition: 'background-color 0.18s ease, border-color 0.18s ease',
    },
    railLabel: {
        color: ICE,
        fontFamily: FONT.tech,
        fontSize: 10,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    commentRow: {
        marginTop: 16,
    },
    commentWrap: {
        position: 'absolute',
    },
    commentBar: {
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16,
        paddingRight: 8,
        backgroundColor: GLASS,
        borderWidth: 1,
        borderColor: HAIRLINE,
        // @ts-ignore — web-only
        cursor: 'text',
    },
    commentPlaceholder: {
        flex: 1,
        color: 'rgba(238, 242, 250, 0.55)',
        fontFamily: FONT.sans,
        fontSize: 14,
    },
    send: {
        width: 32,
        height: 32,
        backgroundColor: ICE,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
