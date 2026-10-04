import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useVideos, Video } from '../../lib/supabase/hooks/useVideos';
import { useSearchProfiles, PersonResult } from '../../lib/supabase/hooks/useSearchProfiles';
import { usePosts, Post } from '../../lib/supabase/hooks/usePosts';
import { useDebounced } from '../../lib/hooks/useDebounced';
import { useTabBarHeight } from '../../lib/hooks/useTabBarHeight';
import { VIDEO_CATEGORIES } from '../../lib/constants/categories';
import { FONT, NO_OUTLINE, RADIUS, useUI } from '../../design-system/ui';
import { Txt } from '../../components/core/Txt';
import { Chip } from '../../components/core/Chip';
import { Tabs } from '../../components/core/Tabs';
import { Avatar } from '../../components/core/Avatar';
import { Button } from '../../components/core/Button';
import { EmptyState } from '../../components/core/EmptyState';
import { Skeleton } from '../../components/core/Skeleton';
import { PosterTile } from '../../components/Explore/PosterTile';
import { PersonRow } from '../../components/Explore/PersonRow';
import { DebateCard } from '../../components/Debate/DebateCard';

type Scope = 'videos' | 'people' | 'debates';

const SCOPES: { key: Scope; label: string }[] = [
    { key: 'videos', label: 'Videos' },
    { key: 'people', label: 'People' },
    { key: 'debates', label: 'Debates' },
];

/**
 * Explore: one search box for videos, people and debates, categories as chips,
 * and, before you type anything, what is popular and who is worth following.
 */
export default function DiscoverScreen() {
    const { c, isDark } = useUI();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const tabBarHeight = useTabBarHeight();
    const params = useLocalSearchParams<{ category?: string; focus?: string }>();

    const inputRef = useRef<TextInput>(null);
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);
    const [category, setCategory] = useState<string | null>(null);
    const [scope, setScope] = useState<Scope>('videos');

    const debounced = useDebounced(query.trim(), 300);
    const searching = debounced.length >= 2;

    // A category tapped on a clip, or the search icon on Home, lands here with a request
    useEffect(() => {
        if (params.category) {
            setCategory(String(params.category));
            setScope('videos');
            router.setParams({ category: undefined });
        }
    }, [params.category]); // eslint-disable-line react-hooks/exhaustive-deps

    useFocusEffect(
        useCallback(() => {
            if (!params.focus) return;
            const t = setTimeout(() => {
                inputRef.current?.focus();
                router.setParams({ focus: undefined });
            }, 320);
            return () => clearTimeout(t);
        }, [params.focus]), // eslint-disable-line react-hooks/exhaustive-deps
    );

    const feed = useVideos({
        type: 'search',
        searchQuery: searching ? debounced : undefined,
        category: category || undefined,
        sort: searching ? 'recent' : 'popular',
    });
    const people = useSearchProfiles(debounced);
    const debates = usePosts();

    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            if (scope === 'debates') await debates.refresh?.();
            else feed.refresh();
        } finally {
            setTimeout(() => setRefreshing(false), 600);
        }
    }, [scope, feed, debates]);

    const openClip = (video: Video) =>
        router.push({
            pathname: '/video-player',
            params: {
                type: 'search',
                ...(searching ? { searchQuery: debounced } : {}),
                ...(category ? { category } : {}),
                sort: searching ? 'recent' : 'popular',
                initialVideoId: video.id,
            },
        });

    const openPerson = (id: string) => router.push(`/user/${id}` as any);

    const cancel = () => {
        setQuery('');
        setFocused(false);
        inputRef.current?.blur();
    };

    const q = debounced.toLowerCase();
    const matchingDebates = searching ? debates.posts.filter(p => p.content.toLowerCase().includes(q)) : debates.posts;

    /* ---------- search bar, chips, scope tabs: fixed above the list ---------- */
    const top = (
        <View style={{ paddingTop: insets.top + 8, backgroundColor: c.bg }}>
            <View style={styles.searchRow}>
                <View style={[styles.search, { backgroundColor: c.surface, borderColor: focused ? c.textTertiary : c.hairline }]}>
                    <Ionicons name="search" size={18} color={c.textTertiary} />
                    <TextInput
                        ref={inputRef}
                        value={query}
                        onChangeText={setQuery}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="Search videos, people, debates"
                        placeholderTextColor={c.textTertiary}
                        style={[styles.input, { color: c.text }, NO_OUTLINE]}
                        returnKeyType="search"
                        autoCapitalize="none"
                        autoCorrect={false}
                        clearButtonMode="never"
                    />
                    {query.length > 0 ? (
                        <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
                            <Ionicons name="close-circle" size={18} color={c.textTertiary} />
                        </Pressable>
                    ) : null}
                </View>
                {focused || query.length > 0 ? (
                    <Pressable onPress={cancel} hitSlop={8} accessibilityRole="button">
                        <Txt variant="bodyStrong">Cancel</Txt>
                    </Pressable>
                ) : null}
            </View>

            {scope === 'videos' || !searching ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
                    <Chip label="All" active={category === null} onPress={() => setCategory(null)} />
                    {VIDEO_CATEGORIES.map(cat => (
                        <Chip key={cat} label={cat} active={category === cat} onPress={() => setCategory(category === cat ? null : cat)} />
                    ))}
                </ScrollView>
            ) : null}

            {searching ? <Tabs tabs={SCOPES} active={scope} onChange={setScope} /> : <View style={{ height: 6 }} />}
        </View>
    );

    /* ---------- the three lists ---------- */
    const listPadding = { paddingBottom: tabBarHeight + 24 };
    const refresh = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.textSecondary} />;

    let list: React.ReactNode;

    if (scope === 'people' && searching) {
        list = (
            <FlatList<PersonResult>
                key="people"
                data={people.people}
                keyExtractor={p => p.id}
                renderItem={({ item }) => (
                    <PersonRow person={item} onPress={() => openPerson(item.id)} onToggleFollow={() => people.toggleFollow(item.id)} />
                )}
                contentContainerStyle={listPadding}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ListEmptyComponent={
                    people.loading ? (
                        <View style={{ padding: 20, gap: 12 }}><Skeleton style={{ height: 52 }} /><Skeleton style={{ height: 52 }} /></View>
                    ) : (
                        <EmptyState icon="person-outline" title="No one by that name" body="Check the spelling, or try a handle." />
                    )
                }
            />
        );
    } else if (scope === 'debates' && searching) {
        list = (
            <FlatList<Post>
                key="debates"
                data={matchingDebates}
                keyExtractor={p => p.id}
                renderItem={({ item }) => <DebateCard item={item} onPress={() => router.push(`/debate/${item.id}` as any)} />}
                contentContainerStyle={listPadding}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                refreshControl={refresh}
                ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="No debates match" body="Try another word, or start the debate yourself." actionLabel="Propose a thesis" onAction={() => router.push('/publish')} />}
            />
        );
    } else {
        const suggestions = !searching && !category && people.people.length > 0;
        list = (
            <FlatList<Video>
                key="videos"
                data={feed.videos}
                keyExtractor={v => v.id}
                numColumns={2}
                renderItem={({ item }) => <PosterTile video={item} onPress={() => openClip(item)} />}
                contentContainerStyle={[{ paddingHorizontal: 11 }, listPadding]}
                onEndReached={feed.loadMore}
                onEndReachedThreshold={0.6}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                refreshControl={refresh}
                ListHeaderComponent={
                    <View style={{ marginHorizontal: -11 }}>
                        {suggestions ? (
                            <View style={{ marginBottom: 6 }}>
                                <Txt variant="title" style={styles.section}>People to follow</Txt>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.people} keyboardShouldPersistTaps="handled">
                                    {people.people.slice(0, 10).map(p => (
                                        <Pressable key={p.id} onPress={() => openPerson(p.id)} style={styles.person} accessibilityRole="button">
                                            <Avatar uri={p.avatarUrl} name={p.displayName} size={64} />
                                            <Txt variant="callout" numberOfLines={1} style={{ marginTop: 8, maxWidth: 88 }}>{p.displayName}</Txt>
                                            <Button
                                                label={p.isFollowing ? 'Following' : 'Follow'}
                                                variant={p.isFollowing ? 'ghost' : 'secondary'}
                                                size="sm"
                                                onPress={() => people.toggleFollow(p.id)}
                                                style={{ marginTop: 6, height: 32, paddingHorizontal: 14 }}
                                            />
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            </View>
                        ) : null}
                        <Txt variant="title" style={styles.section}>
                            {searching ? `Videos for “${debounced}”` : category ? category : 'Trending now'}
                        </Txt>
                    </View>
                }
                ListEmptyComponent={
                    feed.loading ? (
                        <View style={styles.skeletonGrid}>
                            {[0, 1, 2, 3].map(i => (
                                <View key={i} style={styles.skeletonCell}>
                                    <Skeleton style={styles.skeletonTile} />
                                </View>
                            ))}
                        </View>
                    ) : (
                        <EmptyState
                            icon="film-outline"
                            title={searching ? 'No videos found' : 'Nothing here yet'}
                            body={searching ? 'Try a different word, or look under People and Debates.' : 'Be the first to post in this category.'}
                            actionLabel={category ? 'Show everything' : undefined}
                            onAction={category ? () => setCategory(null) : undefined}
                        />
                    )
                }
            />
        );
    }

    return (
        <View style={[styles.root, { backgroundColor: c.bg }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            {top}
            {list}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingBottom: 12 },
    search: {
        flex: 1,
        height: 46,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
    },
    input: { flex: 1, height: '100%', fontFamily: FONT.regular, fontSize: 16, padding: 0 },
    chips: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
    section: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
    people: { paddingHorizontal: 16, gap: 16, paddingBottom: 10 },
    person: { alignItems: 'center', width: 96 },
    skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    skeletonCell: { width: '50%', padding: 5 },
    skeletonTile: { aspectRatio: 0.74, borderRadius: 16 },
});
