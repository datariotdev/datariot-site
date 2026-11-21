import React, { useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ListViewToken } from 'react-native';
import { CoubClassicItem } from './CoubClassicItem';
import { usePalette } from '../../design-system/palette';
import { SectionHeader } from '../Discovery/SectionHeader';
import { ArenaPager } from '../Discovery/ArenaPager';
import { OriginalsStrip } from '../Discovery/OriginalsStrip';
import { Video } from '../../lib/supabase/hooks/useVideos';

interface CoubClassicFeedProps {
    videos: Video[];
    onEndReached: () => void;
    onLike: (videoId: string) => void;
    onComment: (videoId: string) => void;
    onSave: (videoId: string) => void;
    onMore: (videoId: string) => void;
    onFollow: (authorId: string) => void;
    onSelect: (videoId: string) => void;
    isScreenFocused?: boolean;
    initialScrollIndex?: number;
    paddingTop?: number;
    paddingBottom?: number;
    collection?: boolean;
    title?: string;
}

export function CoubClassicFeed({
    videos,
    onEndReached,
    onLike,
    onComment,
    onSave,
    onMore,
    onFollow,
    onSelect,
    isScreenFocused = true,
    initialScrollIndex = 0,
    paddingTop = 0,
    paddingBottom = 40,
    collection = false,
    title = 'Latest videos',
}: CoubClassicFeedProps) {
    const [activeVideoIndex, setActiveVideoIndex] = useState(initialScrollIndex);
    const flatListRef = useRef<FlatList>(null);
    const p = usePalette();
    const background = p.isDark ? '#08090D' : '#F7F8FA';

    const allSynergy = useMemo(() => videos.filter(v => v.isHighSynergy), [videos]);

    const featuredVideos = useMemo(() => {
        const base = allSynergy.slice(0, 3).map(v => ({
            id: v.id,
            title: v.title,
            author: v.author,
            avatarUrl: v.avatarUrl || 'https://picsum.photos/seed/' + v.id + '/100',
            videoUrl: v.videoUrl,
            thumbnailUrl: v.thumbnailUrl,
            views: v.views,
            likes: v.likes,
            logicStats: v.logicStats
        }));
        return base;
    }, [allSynergy]);

    const synergyVideos = useMemo(() => {
        let base;
        // If we have few total synergy videos (e.g. 5 or less), show all of them in the carousel
        // to avoid an empty section, even if they are already featured.
        if (allSynergy.length <= 5) {
            base = allSynergy;
        } else {
            // Otherwise, show the next set for discovery
            base = allSynergy.slice(3, 11);
        }
        return base;
    }, [allSynergy]);

    const scrollVideos = videos;

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
            if (viewableItems.length > 0) {
                const index = viewableItems[0].index;
                if (index != null) {
                    setActiveVideoIndex(index);
                }
            }
        }
    ).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 60,
    }).current;

    const header = collection ? (
        <View style={[styles.collectionHeader, { paddingTop: paddingTop + 12 }]}>
            <Text style={[styles.collectionTitle, { color: p.text, fontFamily: p.fonts.semibold }]}>{title}</Text>
            <Text style={[styles.count, { color: p.sub, fontFamily: p.fonts.regular }]}>{videos.length} {videos.length === 1 ? 'video' : 'videos'}</Text>
        </View>
    ) : videos.length <= 5 ? (
        <View style={[styles.feedHeader, { paddingTop: paddingTop + 18 }]}>
            <View style={styles.headerMeta}>
                <Text style={[styles.eyebrow, { color: p.faint, fontFamily: p.fonts.medium }]}>THE FEED</Text>
                <Text style={[styles.count, { color: p.faint, fontFamily: p.fonts.regular }]}>{videos.length} {videos.length === 1 ? 'video' : 'videos'}</Text>
            </View>
            <Text style={[styles.feedTitle, { color: p.text, fontFamily: p.fonts.semibold }]}>{title}</Text>
            <Text style={[styles.feedSubtitle, { color: p.sub, fontFamily: p.fonts.regular }]}>New ideas, one video at a time.</Text>
        </View>
    ) : (
        <View style={{ marginBottom: 8, marginTop: paddingTop + 10 }}>
            {featuredVideos.length > 0 && (
                <>
                    <SectionHeader
                        title="Featured videos"
                        subtitle="Recent videos worth exploring"
                        index="01"
                        meta={`${featuredVideos.length} PICKS`}
                    />
                    <ArenaPager featuredVideos={featuredVideos} onVideoPress={onSelect} />
                </>
            )}

            <SectionHeader
                title="Datariot Originals"
                subtitle="Curated high-signal video"
                index="02"
                meta={`${synergyVideos.length} PICKS`}
            />
            <OriginalsStrip videos={synergyVideos} onSelect={onSelect} />

            <SectionHeader
                title="Latest videos"
                subtitle="Everything moving across the platform"
                index="03"
                meta={`${scrollVideos.length} SIGNALS`}
            />
        </View>
    );

    const renderItem = ({ item, index }: { item: Video; index: number }) => {
        const isActive = index === activeVideoIndex && isScreenFocused;

        return (
            <CoubClassicItem
                item={item}
                isActive={isActive}
                onLike={() => onLike(item.id)}
                onComment={() => onComment(item.id)}
                onSave={() => onSave(item.id)}
                onMore={() => onMore(item.id)}
                onSelect={() => onSelect(item.id)}
            />
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            <FlatList
                ref={flatListRef}
                data={scrollVideos}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={header}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                removeClippedSubviews={false}
                maxToRenderPerBatch={3}
                windowSize={5}
                initialNumToRender={2}
                initialScrollIndex={initialScrollIndex}
                onScrollToIndexFailed={(info) => {
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                        flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                    });
                }}
                contentContainerStyle={{
                    paddingBottom: paddingBottom + 80,
                    width: '100%',
                    // No max width here. This container holds the section
                    // headers and the horizontal rows as well as the video
                    // items. Each CoubClassicItem caps and centres itself.
                    paddingHorizontal: 0,
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    collectionHeader: { paddingHorizontal: 18, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    collectionTitle: { fontSize: 24, lineHeight: 29, letterSpacing: -0.6, flex: 1 },
    feedHeader: { paddingHorizontal: 20, paddingBottom: 23 },
    headerMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
    eyebrow: { fontSize: 9, letterSpacing: 1.7 },
    count: { fontSize: 11 },
    feedTitle: { fontSize: 30, lineHeight: 35, letterSpacing: -1 },
    feedSubtitle: { fontSize: 13, marginTop: 6 },
});
