/** @jsxImportSource react */
import React, { useState, memo } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useIsFocused } from 'expo-router';
import { usePalette } from '../../design-system/palette';
import { Avatar } from '../UI/Avatar';
import { LiveAnalysisButton } from './LiveAnalysisButton';
import { DeepDiveModal } from './DeepDiveModal';
import { PosterArt } from '../UI/PosterArt';
import { FeedVideo, realThumb, formatNumber, formatClock, ago } from './feedMedia';

interface FeedItemProps {
    item: any;
    isActive: boolean;
    onLike: () => void;
    onComment: () => void;
    onSave: () => void;
    onMore: () => void;
    onSelect: () => void;
}

function FeedAction({ icon, count, label, selected, onPress, scale, like }: {
    icon?: keyof typeof Ionicons.glyphMap; count?: number; label: string; selected?: boolean; like?: boolean;
    onPress: () => void; scale?: Animated.Value;
}) {
    const p = usePalette();
    const [pressScale] = useState(() => new Animated.Value(1));
    const blue = p.isDark ? '#AFC2FF' : '#4767E8';
    const highlighted = like || selected;
    const filled = like && selected;
    const color = filled ? '#FFFFFF' : highlighted ? blue : p.isDark ? '#D5DBE6' : '#444D5E';
    const background = filled ? '#4F6DF5' : highlighted ? p.isDark ? '#192440' : '#EDF2FF' : p.isDark ? '#141820' : '#FFFFFF';
    const border = filled ? '#4F6DF5' : highlighted ? p.isDark ? '#33466D' : '#D6E0FF' : p.isDark ? '#2A303D' : '#E3E7EE';
    const animatePress = (pressed: boolean) => {
        Animated.spring(pressScale, { toValue: pressed ? 0.95 : 1, speed: 38, bounciness: 3, useNativeDriver: true }).start();
    };
    return <Animated.View style={[s.actionShell, { transform: [{ scale: pressScale }] }]}>
        <Pressable onPress={onPress} onPressIn={() => animatePress(true)} onPressOut={() => animatePress(false)}
            hitSlop={{ top: 7, bottom: 7, left: 2, right: 2 }}
            accessibilityRole="button" accessibilityLabel={`${label}${count ? `, ${formatNumber(count)}` : ''}`}
            accessibilityState={{ selected: !!selected }}
            style={({ pressed }) => [s.action, { backgroundColor: background, borderColor: border, opacity: pressed ? 0.8 : 1 }]}>
            <Animated.View style={[s.actionIcon, scale ? { transform: [{ scale }] } : undefined]}>
                {like ? <Text style={[s.sparkle, { color }]}>✦</Text> : icon ? <Ionicons name={icon} size={15} color={color} /> : null}
            </Animated.View>
            <Text numberOfLines={1} style={[s.actionLabel, { color, fontFamily: p.fonts.medium }]}>{label}</Text>
            {!!count && <Text style={[s.actionCount, { color, fontFamily: p.fonts.medium }]}>{formatNumber(count)}</Text>}
        </Pressable>
    </Animated.View>;
}

export const CoubClassicItem = memo(function CoubClassicItem({ item, isActive, onLike, onComment, onSave, onMore, onSelect }: FeedItemProps) {
    const p = usePalette();
    const { width: windowWidth } = useWindowDimensions();
    const [containerWidth, setContainerWidth] = useState(0);
    const [muted, setMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [durationMs, setDurationMs] = useState(Number(item.duration) * 1000 || 0);
    const [analysisOpen, setAnalysisOpen] = useState(false);
    const paused = analysisOpen;
    const [likeScale] = useState(() => new Animated.Value(1));
    const cardWidth = Math.min((containerWidth || windowWidth) - 36, 680);
    const mediaHeight = Math.round(cardWidth * 9 / 16);
    const router = useRouter();
    const focused = useIsFocused();
    const thumb = realThumb(item.thumbnailUrl);
    const when = ago(item.createdAt);
    const metadata = [item.views > 0 ? `${formatNumber(item.views)} views` : null, when ? (when === 'now' ? 'Just now' : `${when} ago`) : null].filter(Boolean).join(' · ');
    const votes = item.logicStats;
    const hasVotes = !!votes && votes.forScore + votes.againstScore > 0;
    const forPercent = hasVotes ? Math.max(0, Math.min(100, Math.round(votes.forPercentage))) : 0;
    const like = () => {
        Animated.sequence([
            Animated.spring(likeScale, { toValue: 1.22, speed: 45, bounciness: 8, useNativeDriver: true }),
            Animated.spring(likeScale, { toValue: 1, speed: 45, bounciness: 8, useNativeDriver: true }),
        ]).start();
        onLike();
    };
    return <View onLayout={e => setContainerWidth(e.nativeEvent.layout.width)} style={s.outer}>
        <View style={[s.article, { width: cardWidth, borderBottomColor: p.border }]}>
            <View style={[s.media, { height: mediaHeight }]}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onSelect}
                    accessibilityRole="button"
                    accessibilityLabel={`Watch ${item.title || 'video'}`}
                >
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        {item.videoUrl ? <FeedVideo url={item.videoUrl} seed={String(item.id)} thumb={thumb} active={isActive && focused} paused={paused} muted={muted}
                            onTime={(current, duration) => {
                                setProgress(duration > 0 ? Math.max(0, Math.min(1, current / duration)) : 0);
                                setDurationMs(previous => Math.abs(previous - duration) > 250 ? duration : previous);
                            }} /> : <PosterArt seed={String(item.id)} isDark />}
                    </View>
                </Pressable>
                <LinearGradient colors={['rgba(0,0,0,0.38)', 'transparent']} style={s.topShade} pointerEvents="none" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)']} style={s.bottomShade} pointerEvents="none" />
                <View style={s.mediaTop} pointerEvents="box-none">
                    <View style={s.topic}><View style={s.topicDot} /><Text numberOfLines={1} style={[s.topicText, { fontFamily: p.fonts.medium }]}>{String(item.category || 'Video')}</Text></View>
                    <Pressable onPress={() => setMuted(v => !v)} hitSlop={6} accessibilityRole="button" accessibilityLabel={muted ? 'Unmute video' : 'Mute video'} style={s.mediaButton}>
                        <Ionicons name={muted ? 'volume-mute-outline' : 'volume-high-outline'} size={18} color="#FFFFFF" />
                    </Pressable>
                </View>
                {paused && <View style={s.paused} pointerEvents="none"><View style={s.playDisc}><Ionicons name="play" size={24} color="#FFFFFF" style={{ marginLeft: 3 }} /></View></View>}
                <View style={s.mediaBottom} pointerEvents="box-none">
                    <Text style={[s.duration, { fontFamily: p.fonts.medium }]}>{durationMs > 0 ? formatClock(durationMs) : ''}</Text>
                    <Pressable onPress={onSelect} accessibilityRole="button" accessibilityLabel="Watch full screen" hitSlop={6} style={s.mediaButton}>
                        <Ionicons name="expand-outline" size={18} color="#FFFFFF" />
                    </Pressable>
                </View>
                <View style={s.track} pointerEvents="none"><View style={[s.progress, { width: `${progress * 100}%` }]} /></View>
            </View>
            <View style={s.body}>
                {!!item.title && <Pressable onPress={onSelect} accessibilityRole="button" accessibilityLabel={`Watch ${item.title}`}>
                    <Text numberOfLines={2} style={[s.title, { color: p.text, fontFamily: p.fonts.semibold }]}>{item.title}</Text>
                </Pressable>}
                <View style={s.authorRow}>
                    <Pressable onPress={() => { if (item.authorId) router.push(`/user/${item.authorId}`); }}
                        accessibilityRole="button" accessibilityLabel={`Open ${item.author || 'creator'} profile`} style={s.author}>
                        <Avatar uri={item.avatarUrl} name={item.author || '?'} size={24} />
                        <View style={{ flex: 1 }}>
                            <Text numberOfLines={1} style={[s.name, { color: p.text, fontFamily: p.fonts.medium }]}>{item.author || 'Creator'}</Text>
                            {!!metadata && <Text numberOfLines={1} style={[s.metadata, { color: p.faint, fontFamily: p.fonts.regular }]}>{metadata}</Text>}
                        </View>
                    </Pressable>
                    <View style={s.authorActions}>
                        <LiveAnalysisButton dark={p.isDark} active={isActive && focused && !analysisOpen}
                            onOpen={() => setAnalysisOpen(true)} />
                        <Pressable onPress={onMore} accessibilityRole="button" accessibilityLabel="More video options" style={s.more} hitSlop={4}><Ionicons name="ellipsis-horizontal" size={20} color={p.sub} /></Pressable>
                    </View>
                </View>
                {hasVotes && <View style={s.balance}>
                    <View style={s.balanceLabels}><Text style={[s.balanceText, { color: p.sub }]}>{forPercent}% for</Text><Text style={[s.balanceText, { color: p.faint }]}>{100 - forPercent}% against</Text></View>
                    <View style={[s.balanceTrack, { backgroundColor: p.soft }]}><View style={{ height: 3, width: `${forPercent}%`, backgroundColor: p.accent }} /></View>
                </View>}
                <View style={s.actions}>
                    <FeedAction like count={item.likes} selected={item.isLiked} label="Like" onPress={like} scale={likeScale} />
                    <FeedAction icon="chatbubble-ellipses-outline" count={item.comments} label="Comment" onPress={onComment} />
                    <FeedAction icon={item.isSaved ? 'bookmark' : 'bookmark-outline'} selected={item.isSaved} label={item.isSaved ? 'Saved' : 'Save'} onPress={onSave} />
                </View>
            </View>
        </View>
        <DeepDiveModal visible={analysisOpen} video={item} seconds={Math.floor(progress * durationMs / 1000)} onClose={() => setAnalysisOpen(false)} />
    </View>;
});

const s = StyleSheet.create({
    outer: { width: '100%', alignItems: 'center', paddingHorizontal: 18 },
    article: { borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 18, paddingBottom: 14 },
    media: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#10141C' },
    topShade: { position: 'absolute', left: 0, right: 0, top: 0, height: 95 },
    bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
    mediaTop: { position: 'absolute', left: 12, right: 8, top: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    topic: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, paddingRight: 10 },
    topicDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D9E4FF' },
    topicText: { color: '#FFFFFF', fontSize: 11, letterSpacing: 0.5 },
    mediaButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(10,14,22,0.38)', alignItems: 'center', justifyContent: 'center' },
    paused: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
    playDisc: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(10,14,22,0.42)', alignItems: 'center', justifyContent: 'center' },
    mediaBottom: { position: 'absolute', bottom: 10, left: 14, right: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    duration: { color: '#FFFFFF', fontSize: 12, fontVariant: ['tabular-nums'] },
    track: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.14)' },
    progress: { height: 2, backgroundColor: '#D9E4FF' },
    body: { paddingTop: 10 },
    title: { fontSize: 18, lineHeight: 23, letterSpacing: -0.35 },
    authorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3, gap: 8 },
    author: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1, minHeight: 40 },
    name: { fontSize: 12 },
    metadata: { fontSize: 10, marginTop: 1 },
    authorActions: { flexDirection: 'row', alignItems: 'center' },
    more: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
    actionShell: { height: 44, justifyContent: 'center', flexShrink: 1, minWidth: 0 },
    action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 30, paddingHorizontal: 8, borderRadius: 15, borderWidth: 1 },
    actionIcon: { width: 18, height: 20, alignItems: 'center', justifyContent: 'center' },
    sparkle: { fontSize: 20, lineHeight: 22, includeFontPadding: false },
    actionLabel: { fontSize: 11, flexShrink: 1, letterSpacing: -0.15 },
    actionCount: { fontSize: 10, fontVariant: ['tabular-nums'] },
    balance: { marginTop: 12 },
    balanceLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    balanceText: { fontSize: 11, fontFamily: 'Outfit_400Regular' },
    balanceTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
});
