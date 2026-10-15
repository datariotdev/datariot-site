import React, { useRef, useState, memo } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../Theme/ThemeProvider';
import { Avatar } from '../UI/Avatar';
import { HalftoneArt } from './MosaicFeed/HalftoneArt';
import { FeedVideo, Viewfinder, realThumb, formatNumber, formatClock, ago } from './feedMedia';

const ICE = '#DAE6F7';
const INK = '#07080C';
const GLASS = 'rgba(7, 8, 12, 0.62)';
const GLASS_LINE = 'rgba(218, 230, 247, 0.24)';
const METER_DOTS = 22;

interface FeedItemProps {
    item: any;
    isActive: boolean;
    onLike: () => void;
    onComment: () => void;
    onSave: () => void;
    onMore: () => void;
    onSelect: () => void;
}


interface RailButtonProps {
    icon: keyof typeof Ionicons.glyphMap;
    count?: number;
    on?: boolean;
    label: string;
    onPress: () => void;
    scale?: Animated.Value;
}

/** A round glass button with its count in dot-matrix digits underneath */
const RailButton = ({ icon, count, on, label, onPress, scale }: RailButtonProps) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.railItem}>
        <Animated.View
            style={[
                styles.railBtn,
                on ? { backgroundColor: ICE, borderColor: ICE } : null,
                scale ? { transform: [{ scale }] } : null,
            ]}
        >
            <Ionicons name={icon} size={21} color={on ? INK : '#FFFFFF'} />
        </Animated.View>
        {count !== undefined ? <Text style={styles.railCount}>{formatNumber(count)}</Text> : null}
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
    const [muted, setMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [durationMs, setDurationMs] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const { width: windowWidth } = useWindowDimensions();
    const { mode } = useTheme();

    const isWeb = Platform.OS === 'web';
    const isMobileWeb = isWeb && windowWidth <= 768;
    const isDark = mode === 'dark';

    const gutter = isWeb ? (isMobileWeb ? 12 : 16) : 16;
    const cardWidth = Math.min(isWeb && !isMobileWeb ? 680 : windowWidth - gutter * 2, 680);
    const cardHeight = Math.min(Math.round(cardWidth * 1.22), 560);

    const router = useRouter();
    const isFocused = useIsFocused();
    const thumb = realThumb(item.thumbnailUrl);
    const playing = isActive && isFocused && !isPaused;

    // Animation for the like button
    const likeScale = useRef(new Animated.Value(1)).current;

    const handleLike = () => {
        Animated.sequence([
            Animated.spring(likeScale, { toValue: 1.3, useNativeDriver: true, speed: 50, bounciness: 10 }),
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
    const lit = voted ? Math.round((stats.forPercentage / 100) * METER_DOTS) : 0;
    const when = ago(item.createdAt);

    return (
        <View style={[styles.card, { width: '100%', paddingHorizontal: gutter }]}>
            <View
                style={[
                    styles.frame,
                    { width: cardWidth, height: cardHeight },
                    isDark
                        ? { borderColor: 'rgba(218, 230, 247, 0.12)' }
                        : { borderColor: 'rgba(7, 8, 12, 0.08)', shadowColor: '#1E2A55', shadowOpacity: 0.16, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
                ]}
            >
                {/* The clip, or a dot picture of it when it has none */}
                <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsPaused(p => !p)} accessibilityLabel={isPaused ? 'Play' : 'Pause'}>
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#06070A' }]}>
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
                            <HalftoneArt seed={String(item.id)} isDark />
                        )}
                    </View>
                </Pressable>

                {/* Shade so the white text and buttons always read */}
                <LinearGradient colors={['rgba(7, 8, 12, 0.55)', 'rgba(7, 8, 12, 0)']} style={styles.topShade} pointerEvents="none" />
                <LinearGradient
                    colors={['rgba(7, 8, 12, 0)', 'rgba(7, 8, 12, 0.55)', 'rgba(7, 8, 12, 0.94)']}
                    locations={[0, 0.5, 1]}
                    style={styles.bottomShade}
                    pointerEvents="none"
                />

                {/* Keeps the buttons readable on a bright picture */}
                <LinearGradient
                    colors={['rgba(7, 8, 12, 0)', 'rgba(7, 8, 12, 0.5)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.rightShade}
                    pointerEvents="none"
                />

                <Viewfinder on={playing} />

                {isPaused && (
                    <View style={styles.pauseOverlay} pointerEvents="none">
                        <View style={styles.pauseDisc}>
                            <Ionicons name="play" size={30} color={INK} style={{ marginLeft: 3 }} />
                        </View>
                    </View>
                )}

                {/* Top row: what it is, and the two things you can do with the picture */}
                <View style={styles.topRow} pointerEvents="box-none">
                    <View style={styles.chip}>
                        <View style={[styles.chipDot, playing && { backgroundColor: ICE }]} />
                        <Text style={styles.chipText} numberOfLines={1}>
                            {String(item.category || 'trending').toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.topBtns}>
                        <Pressable onPress={() => setMuted(m => !m)} accessibilityLabel={muted ? 'Unmute' : 'Mute'} style={styles.roundSm}>
                            <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={17} color="#FFFFFF" />
                        </Pressable>
                        <Pressable onPress={onSelect} accessibilityLabel="Open full screen" style={styles.roundSm}>
                            <Ionicons name="expand-outline" size={17} color="#FFFFFF" />
                        </Pressable>
                    </View>
                </View>

                {/* Right rail */}
                <View style={styles.rail} pointerEvents="box-none">
                    <RailButton
                        icon={item.isLiked ? 'star' : 'star-outline'}
                        count={item.likes}
                        on={item.isLiked}
                        label="Like"
                        onPress={handleLike}
                        scale={likeScale}
                    />
                    <RailButton icon="chatbubble-outline" count={item.comments} label="Comments" onPress={onComment} />
                    <RailButton
                        icon={item.isSaved ? 'bookmark' : 'bookmark-outline'}
                        count={item.saved || item.shares || 0}
                        on={item.isSaved}
                        label="Save"
                        onPress={onSave}
                    />
                    <RailButton icon="ellipsis-horizontal" label="More" onPress={onMore} />
                </View>

                {/* Bottom: who, what, who is winning */}
                <View style={styles.info} pointerEvents="box-none">
                    <Pressable onPress={handleNavigateProfile} style={styles.authorRow}>
                        <Avatar uri={item.avatarUrl} name={item.author || '?'} size={30} />
                        <Text style={styles.author} numberOfLines={1}>
                            {item.author || 'Unknown'}
                        </Text>
                        {!!when && <Text style={styles.when}>{when}</Text>}
                    </Pressable>

                    <Pressable onPress={() => setIsExpanded(e => !e)}>
                        <Text style={styles.title} numberOfLines={isExpanded ? undefined : 2}>
                            {item.title || ''}
                        </Text>
                    </Pressable>

                    {!!item.hashtag && <Text style={styles.hashtag}>{`#${String(item.hashtag).toUpperCase()}`}</Text>}

                    {stats ? (
                        <View style={styles.meterWrap}>
                            <View style={styles.meter}>
                                {Array.from({ length: METER_DOTS }, (_, i) => (
                                    <View key={i} style={[styles.mDot, { opacity: voted ? (i < lit ? 1 : 0.22) : 0.2 }]} />
                                ))}
                            </View>
                            <View style={styles.meterCaps}>
                                <Text style={styles.cap}>{voted ? `FOR ${forPct}%` : 'NO VOTES YET'}</Text>
                                {voted && <Text style={[styles.cap, { opacity: 0.6 }]}>{`AGAINST ${100 - forPct}%`}</Text>}
                            </View>
                        </View>
                    ) : null}

                    <View style={styles.footer}>
                        <View style={styles.views}>
                            <Ionicons name="play" size={10} color={ICE} />
                            <Text style={styles.footNum}>{formatNumber(item.views)}</Text>
                        </View>
                        {durationMs > 0 && <Text style={styles.footNum}>{formatClock(durationMs)}</Text>}
                    </View>
                </View>

                {/* Progress, same ice line as the full-screen player */}
                <View style={styles.progressTrack} pointerEvents="none">
                    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                    {progress > 0 && <View style={[styles.progressDot, { left: `${progress * 100}%` }]} />}
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
    card: {
        marginBottom: 22,
        alignItems: 'center',
    },
    frame: {
        borderRadius: 30,
        borderWidth: 1,
        overflow: 'hidden',
        backgroundColor: '#06070A',
    },
    topShade: { position: 'absolute', left: 0, right: 0, top: 0, height: 96 },
    rightShade: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 110 },
    bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%' },
    pauseOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    pauseDisc: { width: 68, height: 68, borderRadius: 34, backgroundColor: ICE, alignItems: 'center', justifyContent: 'center' },

    topRow: {
        position: 'absolute',
        top: 14,
        left: 14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    chip: {
        maxWidth: '58%',
        flexDirection: 'row',
        alignItems: 'center',
        height: 30,
        paddingHorizontal: 12,
        borderRadius: 15,
        backgroundColor: GLASS,
        borderWidth: 1,
        borderColor: GLASS_LINE,
    },
    chipDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(218, 230, 247, 0.45)', marginRight: 8 },
    chipText: { flexShrink: 1, fontFamily: 'Doto_900Black', fontSize: 13, letterSpacing: 1, color: ICE, includeFontPadding: false },
    topBtns: { flexDirection: 'row', gap: 8 },
    roundSm: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: GLASS,
        borderWidth: 1,
        borderColor: GLASS_LINE,
        alignItems: 'center',
        justifyContent: 'center',
    },

    rail: {
        position: 'absolute',
        right: 12,
        bottom: 66,
        alignItems: 'center',
        gap: 8,
    },
    railItem: { alignItems: 'center', gap: 3 },
    railBtn: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: GLASS,
        borderWidth: 1,
        borderColor: GLASS_LINE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    railCount: {
        fontFamily: 'Doto_900Black',
        fontSize: 13,
        letterSpacing: 0.6,
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
        includeFontPadding: false,
    },

    info: {
        position: 'absolute',
        left: 16,
        right: 74,
        bottom: 16,
    },
    authorRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
    author: { flexShrink: 1, fontFamily: 'Outfit_600SemiBold', fontSize: 14.5, color: 'rgba(255, 255, 255, 0.92)' },
    when: { fontFamily: 'Doto_700Bold', fontSize: 12, letterSpacing: 1, color: 'rgba(218, 230, 247, 0.78)', includeFontPadding: false },
    title: { fontFamily: 'Outfit_700Bold', fontSize: 22, lineHeight: 27, letterSpacing: -0.4, color: '#FFFFFF' },
    hashtag: { fontFamily: 'Doto_700Bold', fontSize: 13, letterSpacing: 1.2, color: ICE, marginTop: 6, includeFontPadding: false },
    meterWrap: { marginTop: 12 },
    meter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    mDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: ICE },
    meterCaps: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    cap: { fontFamily: 'Doto_700Bold', fontSize: 11.5, letterSpacing: 1.3, color: '#FFFFFF', includeFontPadding: false },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginRight: -58 },
    views: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    footNum: { fontFamily: 'Doto_900Black', fontSize: 15, letterSpacing: 0.6, color: 'rgba(226, 235, 250, 0.95)', includeFontPadding: false },

    progressTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: 'rgba(218, 230, 247, 0.16)' },
    progressFill: { height: '100%', backgroundColor: ICE, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
    progressDot: {
        position: 'absolute',
        top: -3,
        width: 9,
        height: 9,
        borderRadius: 4.5,
        marginLeft: -4.5,
        backgroundColor: ICE,
        shadowColor: ICE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
});
