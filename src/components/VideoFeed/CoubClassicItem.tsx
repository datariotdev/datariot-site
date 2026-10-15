import React, { useRef, useState, memo } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { usePalette } from '../../design-system/palette';
import { Avatar } from '../UI/Avatar';
import { PosterArt } from '../UI/PosterArt';
import { FeedVideo, realThumb, formatNumber, formatClock, ago } from './feedMedia';

const ICE = '#DAE6F7';
const GLASS = 'rgba(10, 12, 18, 0.5)';
const GLASS_LINE = 'rgba(255, 255, 255, 0.16)';
// The one place the dot-matrix face stays: how long a clip is
const DURATION_FONT = 'Doto_900Black';

interface FeedItemProps {
    item: any;
    isActive: boolean;
    onLike: () => void;
    onComment: () => void;
    onSave: () => void;
    onMore: () => void;
    onSelect: () => void;
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

interface ActionProps {
    icon: keyof typeof Ionicons.glyphMap;
    count?: number;
    on?: boolean;
    label: string;
    onPress: () => void;
    scale?: Animated.Value;
    color: string;
    onColor: string;
}

/** An icon with its count beside it, the way a post's action bar reads */
const Action = ({ icon, count, on, label, onPress, scale, color, onColor }: ActionProps) => (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label} style={styles.action}>
        <Animated.View style={scale ? { transform: [{ scale }] } : null}>
            <Ionicons name={icon} size={22} color={on ? onColor : color} />
        </Animated.View>
        {count !== undefined ? <Text style={[styles.actionCount, { color }]}>{formatNumber(count)}</Text> : null}
    </Pressable>
);

export const CoubClassicItem = memo(({
    item,
    isActive,
    onLike,
    onComment,
    onSave,
    onMore,
    onSelect,
}: FeedItemProps) => {
    const p = usePalette();
    const [muted, setMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [durationMs, setDurationMs] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const { width: windowWidth } = useWindowDimensions();

    const isWeb = Platform.OS === 'web';
    const gutter = isWeb && windowWidth <= 768 ? 12 : 16;
    const cardWidth = Math.min(windowWidth - gutter * 2, 680);
    const mediaWidth = cardWidth - 12;
    const mediaHeight = Math.min(Math.round(mediaWidth * 1.16), 540);

    const router = useRouter();
    const isFocused = useIsFocused();
    const thumb = realThumb(item.thumbnailUrl);

    const likeScale = useRef(new Animated.Value(1)).current;
    const handleLike = () => {
        Animated.sequence([
            Animated.spring(likeScale, { toValue: 1.35, useNativeDriver: true, speed: 50, bounciness: 12 }),
            Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 10 }),
        ]).start();
        onLike();
    };

    const handleNavigateProfile = () => {
        if (item.authorId) router.push(`/user/${item.authorId}`);
    };

    const stats = item.logicStats;
    const voted = !!stats && stats.forScore + stats.againstScore > 0;
    const forPct = voted ? Math.round(stats.forPercentage) : 0;
    const when = ago(item.createdAt);
    const meta = [`${formatNumber(item.views)} views`, when && `${when} ago`.replace('now ago', 'just now')].filter(Boolean).join('  ·  ');

    return (
        <View style={[styles.outer, { paddingHorizontal: gutter }]}>
            <View
                style={[
                    styles.card,
                    { width: cardWidth, backgroundColor: p.card, borderColor: p.border },
                    !p.isDark && styles.cardShadow,
                ]}
            >
                {/* The clip */}
                <View style={[styles.media, { height: mediaHeight }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsPaused(v => !v)} accessibilityLabel={isPaused ? 'Play' : 'Pause'}>
                        {item.videoUrl ? (
                            <FeedVideo
                                url={item.videoUrl}
                                seed={String(item.id)}
                                thumb={thumb}
                                active={isActive && isFocused}
                                paused={isPaused}
                                muted={muted}
                                onTime={(cur, dur) => {
                                    setProgress(dur > 0 ? cur / dur : 0);
                                    setDurationMs(prev => (Math.abs(prev - dur) > 250 ? dur : prev));
                                }}
                            />
                        ) : (
                            <PosterArt seed={String(item.id)} isDark />
                        )}
                    </Pressable>

                    <LinearGradient colors={['rgba(7, 8, 12, 0.45)', 'rgba(7, 8, 12, 0)']} style={styles.topShade} pointerEvents="none" />
                    <LinearGradient colors={['rgba(7, 8, 12, 0)', 'rgba(7, 8, 12, 0.5)']} style={styles.bottomShade} pointerEvents="none" />

                    {isPaused && (
                        <View style={styles.center} pointerEvents="none">
                            <View style={styles.playDisc}>
                                <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
                            </View>
                        </View>
                    )}

                    <View style={styles.topRow} pointerEvents="box-none">
                        <View style={styles.chip}>
                            <Text style={styles.chipText} numberOfLines={1}>
                                {capitalize(String(item.category || 'Trending'))}
                            </Text>
                        </View>
                        <Pressable onPress={() => setMuted(m => !m)} accessibilityLabel={muted ? 'Unmute' : 'Mute'} hitSlop={6} style={styles.round}>
                            <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={17} color="#FFFFFF" />
                        </Pressable>
                    </View>

                    {durationMs > 0 && (
                        <View style={styles.durPill} pointerEvents="none">
                            <Text style={styles.durText}>{formatClock(durationMs)}</Text>
                        </View>
                    )}

                    <View style={styles.track} pointerEvents="none">
                        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
                    </View>
                </View>

                {/* Who, what, and what people think */}
                <View style={styles.body}>
                    <View style={styles.authorRow}>
                        <Pressable onPress={handleNavigateProfile} style={styles.author}>
                            <Avatar uri={item.avatarUrl} name={item.author || '?'} size={36} />
                            <View style={{ flexShrink: 1 }}>
                                <Text style={[styles.name, { color: p.text, fontFamily: p.fonts.semibold }]} numberOfLines={1}>
                                    {item.author || 'Unknown'}
                                </Text>
                                <Text style={[styles.meta, { color: p.sub, fontFamily: p.fonts.regular }]} numberOfLines={1}>
                                    {meta}
                                </Text>
                            </View>
                        </Pressable>
                        <Pressable onPress={onMore} hitSlop={8} accessibilityLabel="More" style={[styles.moreBtn, { backgroundColor: p.soft }]}>
                            <Ionicons name="ellipsis-horizontal" size={18} color={p.sub} />
                        </Pressable>
                    </View>

                    {!!item.title && (
                        <Pressable onPress={() => setIsExpanded(e => !e)}>
                            <Text style={[styles.title, { color: p.text, fontFamily: p.fonts.bold }]} numberOfLines={isExpanded ? undefined : 2}>
                                {item.title}
                            </Text>
                        </Pressable>
                    )}

                    {!!item.hashtag && (
                        <Text style={[styles.hashtag, { color: p.sub, fontFamily: p.fonts.medium }]}>{`#${item.hashtag}`}</Text>
                    )}

                    {stats ? (
                        <View style={styles.balance}>
                            <View style={styles.balanceLabels}>
                                <Text style={[styles.balanceText, { color: p.text, fontFamily: p.fonts.semibold }]}>
                                    {voted ? `For ${forPct}%` : 'No votes yet'}
                                </Text>
                                {voted && (
                                    <Text style={[styles.balanceText, { color: p.sub, fontFamily: p.fonts.semibold }]}>{`${100 - forPct}% Against`}</Text>
                                )}
                            </View>
                            <View style={[styles.balanceTrack, { backgroundColor: p.soft }]}>
                                {voted && <View style={[styles.balanceFill, { width: `${forPct}%`, backgroundColor: p.accent }]} />}
                            </View>
                        </View>
                    ) : null}

                    <View style={[styles.actions, { borderTopColor: p.border }]}>
                        <Action
                            icon={item.isLiked ? 'star' : 'star-outline'}
                            count={item.likes}
                            on={item.isLiked}
                            label="Like"
                            onPress={handleLike}
                            scale={likeScale}
                            color={p.text}
                            onColor={p.accent}
                        />
                        <Action icon="chatbubble-outline" count={item.comments} label="Comments" onPress={onComment} color={p.text} onColor={p.accent} />
                        <Action
                            icon={item.isSaved ? 'bookmark' : 'bookmark-outline'}
                            count={item.saved || item.shares || 0}
                            on={item.isSaved}
                            label="Save"
                            onPress={onSave}
                            color={p.text}
                            onColor={p.accent}
                        />
                        <View style={{ flex: 1 }} />
                        <Pressable onPress={onSelect} accessibilityLabel="Watch full screen" style={[styles.watch, { backgroundColor: p.accent }]}>
                            <Ionicons name="expand" size={14} color={p.onAccent} />
                            <Text style={[styles.watchText, { color: p.onAccent, fontFamily: p.fonts.semibold }]}>Watch</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.isActive === nextProps.isActive &&
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.likes === nextProps.item.likes &&
        prevProps.item.isLiked === nextProps.item.isLiked &&
        prevProps.item.saved === nextProps.item.saved &&
        prevProps.item.isSaved === nextProps.item.isSaved
    );
});

CoubClassicItem.displayName = 'CoubClassicItem';

const styles = StyleSheet.create({
    outer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 18,
    },
    card: {
        borderRadius: 28,
        borderWidth: 1,
        padding: 6,
    },
    cardShadow: {
        shadowColor: '#1E2A55',
        shadowOpacity: 0.12,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
    },
    media: {
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: '#06070A',
    },
    topShade: { position: 'absolute', left: 0, right: 0, top: 0, height: 80 },
    bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80 },
    center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    playDisc: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: GLASS,
        borderWidth: 1,
        borderColor: GLASS_LINE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topRow: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    chip: {
        maxWidth: '70%',
        height: 30,
        paddingHorizontal: 12,
        borderRadius: 15,
        justifyContent: 'center',
        backgroundColor: GLASS,
        borderWidth: 1,
        borderColor: GLASS_LINE,
    },
    chipText: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: '#FFFFFF' },
    round: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: GLASS,
        borderWidth: 1,
        borderColor: GLASS_LINE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    durPill: {
        position: 'absolute',
        right: 12,
        bottom: 14,
        height: 26,
        paddingHorizontal: 10,
        borderRadius: 13,
        justifyContent: 'center',
        backgroundColor: GLASS,
        borderWidth: 1,
        borderColor: GLASS_LINE,
    },
    durText: { fontFamily: DURATION_FONT, fontSize: 14, letterSpacing: 0.6, color: '#FFFFFF', includeFontPadding: false },
    track: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(255, 255, 255, 0.18)' },
    fill: { height: '100%', backgroundColor: ICE },

    body: { paddingHorizontal: 10, paddingTop: 14, paddingBottom: 4 },
    authorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    author: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
    name: { fontSize: 15 },
    meta: { fontSize: 12.5, marginTop: 1 },
    moreBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 19, lineHeight: 25, letterSpacing: -0.3, marginTop: 12 },
    hashtag: { fontSize: 13.5, marginTop: 4 },
    balance: { marginTop: 14 },
    balanceLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    balanceText: { fontSize: 12.5 },
    balanceTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 6 },
    balanceFill: { height: '100%', borderRadius: 3 },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 22,
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionCount: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, fontVariant: ['tabular-nums'] },
    watch: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 14, borderRadius: 17 },
    watchText: { fontSize: 13.5 },
});
