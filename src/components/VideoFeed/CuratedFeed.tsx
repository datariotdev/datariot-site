/** @jsxImportSource react */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    FlatList, Image, Linking, Modal, Pressable, StyleSheet,
    Text, useWindowDimensions, View,
} from 'react-native';
import type { ListViewToken } from 'react-native';
import { recordVideoExposure } from '../../lib/creator/playback';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../Theme/ThemeProvider';
import { usePalette } from '../../design-system/palette';
import type { Video } from '../../lib/supabase/hooks/useVideos';
import { CuratedFeedEntry, CuratedReel, mergeFeedEntries } from '../../lib/curated/reels';
import InstagramEmbed from './InstagramEmbed';
import { OrvelisMark } from '../UI/OrvelisMark';
import { useNavVisibility } from '../../context/NavVisibilityContext';

interface Props {
    videos: Video[];
    fetchError?: string | null;
    loading?: boolean;
    reels: CuratedReel[];
    grid: boolean;
    desktop?: boolean;
    onRetry?: () => void;
    isFocused: boolean;
    paddingTop: number;
    onEndReached: () => void;
    onSelectNative: (id: string) => void;
    onOpenOrvelis?: (video: Video) => void;
    viewerId?: string;
    feedOrder: 'ranked' | 'recent';
    onFeedOrder: (value: 'ranked' | 'recent') => void;
}

function FeedCard({ entry, onPress, grid, columns, desktop }: {
    entry: CuratedFeedEntry; onPress: () => void; grid: boolean; columns: number; desktop: boolean;
}) {
    const p = usePalette();
    const external = entry.kind === 'instagram';
    const title = external ? entry.reel.title : entry.video.title;
    const creator = external ? entry.reel.creator : entry.video.author;
    const topic = external ? entry.reel.topic || entry.reel.category : entry.video.category;
    const thumbnail = entry.kind === 'native' ? entry.video.thumbnailUrl : null;
    const [failedThumbnail, setFailedThumbnail] = useState<string | null>(null);
    const showImage = !!thumbnail && thumbnail !== failedThumbnail && !/picsum\.photos|pravatar\.cc/.test(thumbnail);

    if (desktop) {
        const likes = entry.kind === 'native' ? entry.video.likes : 0;
        const metadata = [creator || 'Datariot', topic].filter(Boolean).join(' · ');

        return (
            <Pressable accessibilityRole="button" accessibilityLabel={`Watch ${title} by ${creator}`} onPress={onPress}
                style={({ pressed }) => [styles.webCard, { opacity: pressed ? 0.8 : 1 }]}>
                <View style={styles.webCover}>
                    {showImage ? (
                        <Image source={{ uri: thumbnail }} style={styles.cover} resizeMode="cover"
                            onError={() => setFailedThumbnail(thumbnail)} />
                    ) : (
                        <LinearGradient colors={p.isDark ? ['#273650', '#151D2D'] : ['#E2ECFA', '#BED0E8']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={[StyleSheet.absoluteFill, styles.webMissing]}>
                            <Ionicons name="videocam-outline" size={30} color={p.isDark ? '#C3D8F9' : '#49688D'} />
                        </LinearGradient>
                    )}
                    <View style={styles.webPlay}>
                        <Ionicons name="play" size={16} color="#FFFFFF" />
                    </View>
                </View>
                <View style={styles.webDetails}>
                    <Text numberOfLines={2} style={[styles.webCardTitle, { color: p.text }]}>{title}</Text>
                    <View style={styles.cardMeta}>
                        <Text numberOfLines={1} style={[styles.webMeta, { color: p.sub }]}>{metadata}</Text>
                        {likes > 0 && (
                            <View style={styles.likes} accessibilityLabel={`${likes} likes`}>
                                <Ionicons name="heart-outline" size={13} color={p.sub} />
                                <Text style={[styles.webMeta, styles.webLikeCount, { color: p.sub }]}>{likes}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
        );
    }

    const cardStyle = grid ? styles.squareCard : (columns > 1 ? styles.compactCard : styles.mobileCard);

    return (
        <Pressable onPress={onPress} accessibilityRole="button"
            accessibilityLabel={`Watch ${title} by ${creator}`}
            style={[styles.card, cardStyle]}>
            {showImage && <Image source={{ uri: thumbnail }} style={styles.cover} resizeMode="cover"
                onError={() => setFailedThumbnail(thumbnail)} />}
            {!showImage && <View style={styles.missingCover}><Ionicons name="videocam-outline" size={26} color="#D9E4FF" /></View>}
            <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0.52)', 'rgba(0,0,0,0.88)']}
                locations={[0, 0.35, 0.7, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />
            <View style={styles.categoryBadge}>
                <Text style={styles.categoryText} numberOfLines={1}>{String(topic || 'VIDEO').toUpperCase()}</Text>
            </View>
            <View style={styles.cardBottom}>
                <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
                <View style={styles.cardMeta}>
                    <View style={styles.creatorRow}>
                        <View style={styles.creatorAvatar}><Ionicons name="play" size={10} color="#8BB8F3" /></View>
                        <Text style={styles.creatorName} numberOfLines={1}>{creator || 'Datariot'}</Text>
                    </View>
                    <View style={styles.likes}><Ionicons name="heart" size={13} color="#D5E2FF" /><Text style={styles.likesText}>{external ? 0 : (entry.video.likes || 0)}</Text></View>
                </View>
            </View>
        </Pressable>
    );
}

export function FeedOrderSwitch({ value, onChange }: { value: 'ranked' | 'recent'; onChange: (mode: 'ranked' | 'recent') => void }) {
    const p = usePalette();
    return (
        <View style={{ flexDirection: 'row', alignSelf: 'flex-start', padding: 3, borderRadius: 14, backgroundColor: p.soft }}>
            {(['ranked', 'recent'] as const).map(mode => (
                <Pressable key={mode} accessibilityRole="button" accessibilityState={{ selected: mode === value }}
                    onPress={() => onChange(mode)}
                    style={{ minHeight: 38, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 11, backgroundColor: mode === value ? p.card : 'transparent' }}>
                    <Text style={{ color: mode === value ? p.text : p.sub, fontSize: 13, fontFamily: p.fonts.semibold }}>
                        {mode === 'ranked' ? 'For you' : 'Latest'}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}

export function CuratedFeed({ videos, reels, grid, isFocused, paddingTop, onEndReached, onSelectNative, fetchError, loading, desktop = false, onRetry, onOpenOrvelis, viewerId, feedOrder, onFeedOrder }: Props) {
    const { theme } = useTheme();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { handleScroll } = useNavVisibility();
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);
    const [openingError, setOpeningError] = useState(false);
    const data = useMemo(() => feedOrder === 'ranked' ? mergeFeedEntries(videos, []) : mergeFeedEntries(videos, reels), [videos, reels, feedOrder]);
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50, minimumViewTime: 650 }).current;
    const visibility = useRef({ viewerId, active: isFocused && !selectedUrl });
    visibility.current = { viewerId, active: isFocused && !selectedUrl };
    const onViewableItemsChanged = useRef(({ changed }: { changed: ListViewToken[] }) => {
        const { viewerId: viewer, active } = visibility.current;
        if (!viewer || !active) return;
        changed.forEach(({ item: visibleItem, isViewable }) => {
            const item: CuratedFeedEntry = visibleItem;
            if (isViewable && item.kind === 'native') recordVideoExposure(viewer, item.video.id, item.video.authorId, 'feed');
        });
    }).current;
    const columns = desktop ? grid ? 3 : 2 : grid ? (width > 1000 ? 3 : 2) : (width > 560 ? 2 : 1);
    const selectedIndex = reels.findIndex(reel => reel.source_url === selectedUrl);
    const selected = reels[selectedIndex];

    useEffect(() => {
        if (!isFocused) setSelectedUrl(null);
    }, [isFocused]);
    useEffect(() => { setFailed(false); setOpeningError(false); }, [selectedUrl]);

    const openOriginal = async () => {
        if (!selected) return;
        try { await Linking.openURL(selected.source_url); }
        catch { setOpeningError(true); }
    };

    return (
        <>
            <FlatList
                key={`curated-${desktop}-${columns}-${feedOrder}`}
                data={data}
                keyExtractor={entry => entry.key}
                numColumns={columns}
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={onViewableItemsChanged}
                contentContainerStyle={desktop ? styles.webList : { paddingTop, paddingBottom: 120, paddingHorizontal: 8 }}
                columnWrapperStyle={desktop ? styles.webRow : undefined}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.3}
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={5}
                ListHeaderComponent={desktop ? undefined : (
                    <View style={styles.heading}>
                        <Text accessibilityRole="header" style={[styles.headingTitle, { color: theme.colors.text.primary }]}>
                            Things you’ll bring up later
                        </Text>
                        <Text style={[styles.headingSubtitle, { color: theme.colors.text.secondary }]}>
                            How things work. Why people disagree.
                        </Text>
                        <View style={[styles.editorialNote, { backgroundColor: theme.colors.surface.card, borderColor: theme.colors.surface.border }]}>
                            <Ionicons name="bulb-outline" size={18} color={theme.colors.text.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.noteTitle, { color: theme.colors.text.primary }]}>What did the clip leave out?</Text>
                                <Text style={[styles.noteSubtitle, { color: theme.colors.text.secondary }]}>Ask Orvelis AI for context or a second take.</Text>
                            </View>
                        </View>
                        <FeedOrderSwitch value={feedOrder} onChange={onFeedOrder} />
                    </View>
                )}
                ListEmptyComponent={desktop ? (
                    <View accessibilityLiveRegion="polite" style={styles.webEmpty}>
                        <Text style={[styles.webMeta, { color: theme.colors.text.secondary }]}>
                            {loading ? 'Loading videos…' : fetchError ? 'Couldn’t load videos.' : 'No videos in this topic yet.'}
                        </Text>
                        {!loading && fetchError && onRetry && (
                            <Pressable accessibilityRole="button" style={styles.webRetry} onPress={onRetry}>
                                <Text style={[styles.webMeta, { color: theme.colors.text.primary }]}>Try again</Text>
                            </Pressable>
                        )}
                    </View>
                ) : <Text style={[styles.heading, { color: theme.colors.text.secondary }]}>{loading ? 'Loading videos…' : fetchError ? `Could not load videos: ${fetchError}` : 'No playable videos available.'}</Text>}
                renderItem={({ item }) => (
                    <View style={desktop ? [styles.webCell, { width: `${100 / columns}%` }] : { width: `${100 / columns}%`, padding: 6 }}>
                        <FeedCard entry={item} grid={grid} columns={columns} desktop={desktop} onPress={() => {
                            if (item.kind === 'instagram') setSelectedUrl(item.reel.source_url);
                            else onSelectNative(item.video.id);
                        }} />
                        {item.kind === 'native' && onOpenOrvelis && <Pressable accessibilityRole="button"
                            accessibilityLabel={`Analyze ${item.video.title} with Orvelis`} onPress={() => onOpenOrvelis(item.video)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10 }}>
                            <OrvelisMark size={15} color="#587EB5" /><Text style={{ fontSize: 11, color: '#587EB5', flex: 1 }}>Unpack this clip</Text>
                            <Ionicons name="arrow-forward" size={15} color="#587EB5" />
                        </Pressable>}
                    </View>
                )}
            />
            {selected && isFocused && (
                <Modal visible animationType="slide" onRequestClose={() => setSelectedUrl(null)}>
                    <View style={[styles.modal, { backgroundColor: theme.colors.background.primary,
                        paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                        <View style={styles.toolbar}>
                            <Pressable accessibilityRole="button" accessibilityLabel="Close Instagram player"
                                onPress={() => setSelectedUrl(null)} style={styles.iconButton}>
                                <Ionicons name="close" size={25} color={theme.colors.text.primary} />
                            </Pressable>
                            <Text style={[styles.source, { color: theme.colors.text.secondary }]}>INSTAGRAM · {selectedIndex + 1} / {reels.length}</Text>
                            <Pressable accessibilityRole="link" accessibilityLabel="Open original on Instagram"
                                onPress={openOriginal} style={styles.iconButton}>
                                <Ionicons name="open-outline" size={22} color={theme.colors.text.primary} />
                            </Pressable>
                        </View>
                        <View style={styles.caption}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]} numberOfLines={2}>{selected.title}</Text>
                            <Text style={{ color: theme.colors.text.secondary }} numberOfLines={1}>{selected.creator}</Text>
                        </View>
                        <View style={styles.embed}>
                            {failed ? (
                                <View style={[styles.fallback, { backgroundColor: theme.colors.surface.card }]}>
                                    <Ionicons name="logo-instagram" size={36} color={theme.colors.primary.DEFAULT} />
                                    <Text style={[styles.failureText, { color: theme.colors.text.primary }]}>Instagram couldn’t load this reel here.</Text>
                                    <Pressable accessibilityRole="link" onPress={openOriginal} style={styles.openButton}>
                                        <Text style={{ color: theme.colors.primary.DEFAULT }}>Open original on Instagram ↗</Text>
                                    </Pressable>
                                </View>
                            ) : (
                                <InstagramEmbed key={selected.source_url} sourceUrl={selected.source_url}
                                    title={selected.title} onError={() => setFailed(true)} />
                            )}
                        </View>
                        <View style={styles.playerFooter}>
                            <Pressable accessibilityRole="button" accessibilityLabel="Previous reel" disabled={selectedIndex === 0}
                                onPress={() => setSelectedUrl(reels[selectedIndex - 1].source_url)}
                                style={[styles.iconButton, selectedIndex === 0 && styles.disabled]}>
                                <Ionicons name="chevron-back" size={25} color={theme.colors.text.primary} />
                            </Pressable>
                            <Pressable accessibilityRole="link" onPress={openOriginal} style={styles.openButton}>
                                <Text style={{ color: theme.colors.primary.DEFAULT }}>Open Instagram ↗</Text>
                            </Pressable>
                            <Pressable accessibilityRole="button" accessibilityLabel="Next reel" disabled={selectedIndex === reels.length - 1}
                                onPress={() => setSelectedUrl(reels[selectedIndex + 1].source_url)}
                                style={[styles.iconButton, selectedIndex === reels.length - 1 && styles.disabled]}>
                                <Ionicons name="chevron-forward" size={25} color={theme.colors.text.primary} />
                            </Pressable>
                        </View>
                        {openingError && <Text style={[styles.failureText, { color: theme.colors.text.secondary }]}>Couldn’t open Instagram. Please try again.</Text>}
                    </View>
                </Modal>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    webList: { paddingBottom: 32 },
    webRow: { marginHorizontal: -9 },
    webCell: { paddingHorizontal: 9, marginBottom: 24 },
    webCard: { width: '100%', borderRadius: 15 },
    webCover: { aspectRatio: 16 / 9, borderRadius: 15, overflow: 'hidden', backgroundColor: '#172132' },
    webMissing: { alignItems: 'center', justifyContent: 'center' },
    webPlay: { position: 'absolute', bottom: 11, right: 11, width: 35, height: 35, borderRadius: 18, backgroundColor: 'rgba(13, 23, 38, 0.72)', borderColor: 'rgba(255, 255, 255, 0.45)', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    webDetails: { paddingTop: 11, paddingHorizontal: 1, gap: 5 },
    webCardTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 18, lineHeight: 23, letterSpacing: -0.25 },
    webMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, flexShrink: 1 },
    webLikeCount: { flexShrink: 0 },
    webEmpty: { minHeight: 120, gap: 6, alignItems: 'center', justifyContent: 'center' },
    webRetry: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 16 },
    squareCard: { aspectRatio: 1 },
    compactCard: { aspectRatio: 16 / 10, minHeight: 150 },
    mobileCard: { aspectRatio: 16 / 9, maxHeight: 200, minHeight: 150 },
    wideCard: { height: 190 },
    cover: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
    missingCover: { ...StyleSheet.absoluteFill, backgroundColor: '#202A39', alignItems: 'center', justifyContent: 'center' },
    categoryBadge: { position: 'absolute', top: 10, left: 10, maxWidth: '82%', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    categoryText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    cardBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 10, paddingBottom: 10 },
    cardTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', lineHeight: 17, marginBottom: 6 },
    cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    creatorRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
    creatorAvatar: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#F7FAFF', alignItems: 'center', justifyContent: 'center' },
    creatorName: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', flexShrink: 1 },
    likes: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    likesText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
    heading: { paddingHorizontal: 8, paddingTop: 0, paddingBottom: 8, gap: 5 },
    headingSubtitle: { fontSize: 12, lineHeight: 16 },
    editorialNote: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginTop: 2 },
    noteTitle: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
    noteSubtitle: { fontSize: 10.5, lineHeight: 14, marginTop: 1 },
    sectionLabel: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.8, marginTop: 4 },
    headingTitle: { fontSize: 22, lineHeight: 26, fontWeight: '800', letterSpacing: -0.5 },
    card: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#202A39' },
    source: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    modal: { flex: 1 },
    toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
    iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    caption: { paddingHorizontal: 20, paddingBottom: 12, gap: 4 },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    embed: { flex: 1, width: '100%', maxWidth: 540, alignSelf: 'center', minHeight: 250, backgroundColor: '#fff' },
    fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
    failureText: { textAlign: 'center', paddingHorizontal: 20, paddingBottom: 8 },
    playerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
    openButton: { padding: 14, minHeight: 44, justifyContent: 'center' },
    disabled: { opacity: 0.3 },
});
