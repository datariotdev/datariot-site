import React, { useEffect, useMemo, useState } from 'react';
import {
    FlatList, Image, Linking, Modal, Pressable, StyleSheet,
    Text, useWindowDimensions, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../Theme/ThemeProvider';
import type { Video } from '../../lib/supabase/hooks/useVideos';
import { CuratedFeedEntry, CuratedReel, mergeFeedEntries } from '../../lib/curated/reels';
import InstagramEmbed from './InstagramEmbed';

interface Props {
    videos: Video[];
    fetchError?: string | null;
    loading?: boolean;
    reels: CuratedReel[];
    grid: boolean;
    isFocused: boolean;
    paddingTop: number;
    onEndReached: () => void;
    onSelectNative: (id: string) => void;
}

function FeedCard({ entry, onPress, grid }: { entry: CuratedFeedEntry; onPress: () => void; grid: boolean }) {
    const external = entry.kind === 'instagram';
    const title = external ? entry.reel.title : entry.video.title;
    const creator = external ? entry.reel.creator : entry.video.author;
    const topic = external ? entry.reel.topic || entry.reel.category : entry.video.category;
    const thumbnail = entry.kind === 'native' ? entry.video.thumbnailUrl : null;
    const [failedThumbnail, setFailedThumbnail] = useState<string | null>(null);
    const showImage = !!thumbnail && thumbnail !== failedThumbnail && !/picsum\.photos|pravatar\.cc/.test(thumbnail);

    return (
        <Pressable onPress={onPress} accessibilityRole="button"
            accessibilityLabel={`Watch ${title} by ${creator}`}
            style={[styles.card, grid ? styles.squareCard : styles.wideCard]}>
            {showImage && <Image source={{ uri: thumbnail }} style={styles.cover} resizeMode="cover"
                onError={() => setFailedThumbnail(thumbnail)} />}
            {!showImage && <View style={styles.missingCover}><Ionicons name="videocam-outline" size={28} color="#D9E4FF" /></View>}
            <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.04)', 'rgba(0,0,0,0.46)', 'rgba(0,0,0,0.84)']}
                locations={[0, 0.3, 0.67, 1]}
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
                        <View style={styles.creatorAvatar}><Ionicons name="play" size={11} color="#8BB8F3" /></View>
                        <Text style={styles.creatorName} numberOfLines={1}>{creator || 'Datariot'}</Text>
                    </View>
                    <View style={styles.likes}><Ionicons name="heart" size={15} color="#D5E2FF" /><Text style={styles.likesText}>{external ? 0 : entry.video.likes}</Text></View>
                </View>
            </View>
        </Pressable>
    );
}

export function CuratedFeed({ videos, reels, grid, isFocused, paddingTop, onEndReached, onSelectNative, fetchError, loading }: Props) {
    const { theme } = useTheme();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);
    const [openingError, setOpeningError] = useState(false);
    const data = useMemo(() => mergeFeedEntries(videos, reels), [videos, reels]);
    const columns = grid ? (width > 1100 ? 3 : 2) : 1;
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
                key={`curated-${columns}`}
                data={data}
                keyExtractor={entry => entry.key}
                numColumns={columns}
                contentContainerStyle={{ paddingTop, paddingBottom: 120, paddingHorizontal: 8 }}
                showsVerticalScrollIndicator={false}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.3}
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={5}
                ListHeaderComponent={reels.length > 0 ? (
                    <View style={styles.heading}>
                        <Text style={[styles.headingTitle, { color: theme.colors.text.primary }]}>Worth your time</Text>
                        <Text style={{ color: theme.colors.text.secondary }}>
                            {reels.length} selected reels · ideas, science & how things work
                        </Text>
                    </View>
                ) : null}
                ListEmptyComponent={<Text style={[styles.heading, { color: theme.colors.text.secondary }]}>{loading ? 'Loading videos…' : fetchError ? `Could not load videos: ${fetchError}` : 'No playable videos available.'}</Text>}
                renderItem={({ item }) => (
                    <View style={{ width: `${100 / columns}%`, padding: 7 }}>
                        <FeedCard entry={item} grid={columns > 1} onPress={() => {
                            if (item.kind === 'instagram') setSelectedUrl(item.reel.source_url);
                            else onSelectNative(item.video.id);
                        }} />
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
    squareCard: { aspectRatio: 1 },
    wideCard: { height: 260 },
    cover: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    missingCover: { ...StyleSheet.absoluteFillObject, backgroundColor: '#202A39', alignItems: 'center', justifyContent: 'center' },
    categoryBadge: { position: 'absolute', top: 12, left: 12, maxWidth: '82%', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
    categoryText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
    cardBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 12, paddingBottom: 12 },
    cardTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', lineHeight: 18, marginBottom: 10 },
    cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    creatorRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 7 },
    creatorAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F7FAFF', alignItems: 'center', justifyContent: 'center' },
    creatorName: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', flexShrink: 1 },
    likes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    likesText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    heading: { paddingHorizontal: 12, paddingVertical: 20, gap: 6 },
    headingTitle: { fontSize: 24, fontWeight: '800' },
    card: { borderRadius: 18, overflow: 'hidden', backgroundColor: '#202A39' },
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
