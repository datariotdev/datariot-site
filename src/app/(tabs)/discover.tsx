import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, useWindowDimensions, RefreshControl, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { useRecommendedUsers } from '@lib/supabase/hooks/useRecommendedUsers';
import { useRouter } from 'expo-router';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { usePosts, Post } from '@lib/supabase/hooks/usePosts';

import { SectionHeader } from '@components/Discovery/SectionHeader';
import { DiscoverHero } from '@components/Discovery/DiscoverHero';
import { CategoryPills } from '@components/Discovery/CategoryPills';
import { TopicBento, TOPICS } from '@components/Discovery/TopicBento';
import { MindsRail } from '@components/Discovery/MindsRail';
import { DebateSwitcher } from '@components/Discovery/DebateSwitcher';
import { DebateCard } from '@components/Debate/DebateCard';
import { pageBg } from '@design-system/surface';
import { pixelClip } from '@design-system/pixel';
import { FONT } from '@design-system/fonts';

/** Quick filters: label on the chip, text it searches for. */
const CATEGORIES = [
    { label: 'All', keyword: '' },
    { label: 'Logic', keyword: 'logic' },
    { label: 'AI', keyword: 'AI' },
    { label: 'Ethics', keyword: 'ethic' },
    { label: 'Space', keyword: 'space' },
    { label: 'Finance', keyword: 'financ' },
    { label: 'Work', keyword: 'job' },
];

const BRANCHES: Record<string, { title: string; subtitle: string; sort: (a: Post, b: Post) => number }> = {
    active: {
        title: 'Arenas',
        subtitle: 'Fresh arguments, newest first',
        sort: (a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '') || 0,
    },
    historical: {
        title: 'History',
        subtitle: 'The canon: most endorsed',
        sort: (a, b) => (b.likes || 0) - (a.likes || 0),
    },
    dives: {
        title: 'Deep dives',
        subtitle: 'Where the threads run deepest',
        sort: (a, b) => (b.comments || 0) - (a.comments || 0),
    },
};

const MAX_WIDTH = 1120;

/**
 * Short queries ("AI") must start a word: as a bare substring they hit
 * "maintainers" and "again". Longer ones match anywhere, as typed.
 */
const matches = (text: string, query: string) => {
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    if (q.length > 3) return t.includes(q);
    return new RegExp(`(^|[^a-z0-9])${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t);
};

export default function DiscoverScreen() {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const router = useRouter();
    const { width: windowWidth } = useWindowDimensions();

    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [activeBranch, setActiveBranch] = useState('active');
    // The page column, not the window: the sidebar takes a slice on desktop.
    const [colWidth, setColWidth] = useState(windowWidth);

    const { posts: textPosts, refresh: refreshPosts } = usePosts();
    const { users: recommendedUsers, toggleFollowUser } = useRecommendedUsers();

    const narrow = colWidth < 640;
    const columns = colWidth >= 900 ? 2 : 1;
    const searching = searchQuery.trim().length > 0;

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        const w = Math.round(e.nativeEvent.layout.width);
        setColWidth((prev) => (Math.abs(prev - w) > 1 ? w : prev));
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        refreshPosts();
        setTimeout(() => setRefreshing(false), 1000);
    }, [refreshPosts]);

    const minds = useMemo(
        () => (recommendedUsers || []).slice(0, 8).map((u, i) => ({
            id: u.id || `u-${i}`,
            username: u.username || u.displayName || 'thinker',
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            isFollowing: u.isFollowing,
        })),
        [recommendedUsers],
    );

    const branch = BRANCHES[activeBranch] || BRANCHES.active;
    const posts = useMemo(() => {
        const q = searchQuery.trim();
        const matched = q ? textPosts.filter((p) => matches(p.content || '', q)) : textPosts;
        // Search keeps the order the user picked; sorting copies, never mutates the hook's array.
        return [...matched].sort(branch.sort);
    }, [textPosts, searchQuery, branch]);

    const activeCategory = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const hit = CATEGORIES.find((c) => c.keyword.toLowerCase() === q);
        return hit ? hit.label : null;
    }, [searchQuery]);

    const onCategory = useCallback((label: string) => {
        const c = CATEGORIES.find((x) => x.label === label);
        setSearchQuery(c ? c.keyword : '');
    }, []);

    const header = (
        <View onLayout={onLayout}>
            <DiscoverHero
                query={searchQuery}
                onChangeQuery={setSearchQuery}
                narrow={narrow}
                stats={[
                    { label: 'ARENAS', value: textPosts.length },
                    { label: 'ROOMS', value: TOPICS.length },
                    { label: 'MINDS', value: minds.length },
                ]}
            />

            <View style={styles.pills}>
                <CategoryPills
                    categories={CATEGORIES.map((c) => c.label)}
                    activeCategory={activeCategory ?? (searching ? null : 'All')}
                    onCategoryPress={onCategory}
                />
            </View>

            {!searching && (
                <>
                    <SectionHeader
                        index="02"
                        title="Rooms on fire"
                        subtitle="Topics people are arguing about right now"
                        meta={`${TOPICS.length} LIVE`}
                    />
                    <View style={styles.pad}>
                        <TopicBento
                            width={colWidth - 32}
                            onPress={(t) => setSearchQuery(t.keyword)}
                        />
                    </View>

                    {minds.length > 0 && (
                        <>
                            <SectionHeader
                                index="03"
                                title="Minds to follow"
                                subtitle="Sharp thinkers from across the arena"
                                meta={`${minds.length} ONLINE`}
                            />
                            <MindsRail
                                minds={minds}
                                onFollow={toggleFollowUser}
                                onPress={(id) => router.push(`/user/${id}` as any)}
                            />
                        </>
                    )}
                </>
            )}

            <SectionHeader
                index={searching ? '02' : '04'}
                title={searching ? 'Results' : branch.title}
                subtitle={searching ? `Arguments matching "${searchQuery.trim()}"` : branch.subtitle}
                meta={`${posts.length} ${posts.length === 1 ? 'SIGNAL' : 'SIGNALS'}`}
            />
            {!searching && <DebateSwitcher activeTab={activeBranch} onTabChange={setActiveBranch} />}
        </View>
    );

    const empty = (
        <View style={[styles.empty, pixelClip(6), { borderColor: isDark ? 'rgba(218, 230, 247, 0.16)' : 'rgba(7, 8, 12, 0.16)' }]}>
            <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>[ NO SIGNAL ]</Text>
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                {searching ? 'Nothing in the arena matches that yet.' : 'No arguments here yet.'}
            </Text>
            <View style={styles.emptyActions}>
                {searching && (
                    <Pressable onPress={() => setSearchQuery('')} style={[styles.emptyBtn, pixelClip(3), { borderColor: theme.colors.text.muted }]}>
                        <Text style={[styles.emptyBtnText, { color: theme.colors.text.secondary }]}>[ CLEAR SEARCH ]</Text>
                    </Pressable>
                )}
                <Pressable
                    onPress={() => router.push('/(tabs)/create' as any)}
                    style={[styles.emptyBtn, pixelClip(3), { borderColor: theme.colors.primary.DEFAULT, backgroundColor: theme.colors.primary.DEFAULT }]}
                >
                    <Text style={[styles.emptyBtnText, { color: theme.colors.primary.onPrimary }]}>[ START THE FIRST ]</Text>
                </Pressable>
            </View>
        </View>
    );

    // An odd last row gets a spacer so its card keeps the width of a column.
    const listData = useMemo(
        () => (columns > 1 && posts.length % columns ? [...posts, { id: '__pad' } as Post] : posts),
        [posts, columns],
    );

    const renderItem = useCallback(({ item }: { item: Post }) => {
        if (item.id === '__pad') return <View style={styles.cell} />;
        return (
        <View style={columns > 1 ? styles.cell : undefined}>
            <DebateCard
                item={{ ...item, createdAt: item.createdAt || new Date().toISOString() }}
                style={columns > 1 ? styles.cardInCol : undefined}
                onPress={() => router.push({ pathname: '/(tabs)', params: { postId: item.id } })}
            />
        </View>
        );
    }, [columns, router]);

    return (
        <View style={[styles.container, { backgroundColor: pageBg(theme.colors.background.primary) }]}>
            <SafeAreaView style={styles.safeArea}>
                <FlatList
                    // numColumns can't change on a mounted list
                    key={`cols-${columns}`}
                    numColumns={columns}
                    data={listData}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    style={styles.list}
                    contentContainerStyle={styles.content}
                    columnWrapperStyle={columns > 1 ? styles.columnRow : undefined}
                    ListHeaderComponent={header}
                    ListEmptyComponent={empty}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.primary.DEFAULT}
                        />
                    }
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    list: {
        flex: 1,
    },
    content: {
        width: '100%',
        maxWidth: MAX_WIDTH,
        alignSelf: 'center',
        paddingBottom: 120,
    },
    pad: {
        paddingHorizontal: 16,
    },
    pills: {
        marginTop: 4,
    },
    columnRow: {
        paddingHorizontal: 16,
        gap: 14,
    },
    cell: {
        flex: 1,
    },
    // Columns supply their own gutters; cards in a row share its height.
    cardInCol: {
        marginHorizontal: 0,
        flex: 1,
    },
    empty: {
        marginHorizontal: 16,
        paddingVertical: 44,
        paddingHorizontal: 20,
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
    },
    emptyTitle: {
        fontFamily: FONT.display,
        fontSize: 22,
        letterSpacing: 1.5,
    },
    emptyText: {
        fontFamily: FONT.sans,
        fontSize: 14,
        textAlign: 'center',
    },
    emptyActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginTop: 6,
    },
    emptyBtn: {
        borderWidth: 1,
        paddingHorizontal: 16,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyBtnText: {
        fontFamily: FONT.techBold,
        fontSize: 10.5,
        letterSpacing: 1.6,
    },
});
