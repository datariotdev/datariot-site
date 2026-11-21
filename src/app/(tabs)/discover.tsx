import React, { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import {
    ActivityIndicator, FlatList, Image, Keyboard, Platform, Pressable, RefreshControl,
    StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { DebateCard } from '@components/Debate/DebateCard';
import { DebateSwitcher } from '@components/Discovery/DebateSwitcher';
import type { DebateTab } from '@components/Discovery/DebateSwitcher';
import { UserSearchResults } from '@components/Discovery/UserSearchResults';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { usePalette } from '@design-system/palette';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { usePosts } from '@lib/supabase/hooks/usePosts';
import type { Post } from '@lib/supabase/hooks/usePosts';
import { useRecommendedUsers } from '@lib/supabase/hooks/useRecommendedUsers';
import type { RecommendedUser } from '@lib/supabase/hooks/useRecommendedUsers';
import { useUserSearch } from '@lib/supabase/hooks/useUserSearch';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Topic = { title: string; description: string; icon: IconName; match: RegExp; tint?: string };

const topics: Topic[] = [
    { title: 'The Resource Crisis', description: 'Scarcity, energy and who gets what.', icon: 'earth-outline', match: /\b(resources?|scarcity|climate|energy|water)\b/i, tint: '#EAF2F8' },
    { title: 'Life on Mars', description: 'What would it take to start over?', icon: 'planet-outline', match: /\b(mars|space|colony|colonies|coloniz\w*)\b/i, tint: '#E8EEF9' },
    { title: 'The Future of Money', description: 'Bitcoin, banks and who holds the keys.', icon: 'logo-bitcoin', match: /\b(bitcoin|crypto\w*|bank\w*|finance|money)\b/i, tint: '#EBF0F6' },
];

const focusTopics: Topic[] = [
    { title: 'Artificial intelligence', description: 'Models, ethics and what comes next.', icon: 'hardware-chip-outline', match: /\b(ai|artificial intelligence|llms?|machine learning|chatgpt|language models?)\b/i },
    { title: 'The future of work', description: 'Automation, skills and jobs.', icon: 'briefcase-outline', match: /\b(jobs?|careers?|workers?|employment|automation|future of work)\b/i },
];

function CreatorAvatar({ creator, backgroundColor, color }: {
    creator: RecommendedUser;
    backgroundColor: string;
    color: string;
}) {
    const [imageFailed, setImageFailed] = useState(false);
    return (
        <View style={[styles.avatar, { backgroundColor }]}>
            {creator.avatarUrl && !imageFailed ? (
                <Image source={{ uri: creator.avatarUrl }} style={styles.coverImage} onError={() => setImageFailed(true)} />
            ) : (
                <Text style={[styles.avatarInitial, { color }]}>{creator.displayName.charAt(0).toUpperCase()}</Text>
            )}
        </View>
    );
}

export default function DiscoverScreen() {
    const p = usePalette();
    const { width } = useWindowDimensions();
    const desktop = Platform.OS === 'web' && width > 768;
    const wide = desktop && width >= 900;
    const { q } = useLocalSearchParams<{ q?: string }>();
    const routeQuery = typeof q === 'string' ? q : '';
    const isFocused = useIsFocused();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState(routeQuery);
    const [searchFocused, setSearchFocused] = useState(false);
    const [topic, setTopic] = useState<Topic | null>(null);
    const [activeTab, setActiveTab] = useState<DebateTab>('latest');
    const [refreshing, setRefreshing] = useState(false);
    const list = useRef<FlatList<Post>>(null);
    const debateOffset = useRef(0);
    const { user } = useAuth();
    const { posts, loading: loadingPosts, refresh: refreshPosts } = usePosts();
    const { users: creators, toggleFollowUser } = useRecommendedUsers();

    const query = searchQuery.trim();
    const isTagSearch = query.startsWith('@');
    const browsing = !query && !topic;
    const userSearch = useUserSearch(query, user?.id);
    const line = p.isDark ? '#263548' : '#DDE6F0';
    const accent = p.isDark ? '#C9DFFA' : '#365A80';
    const iconFill = p.isDark ? '#1E3046' : '#EAF2FB';
    const muted = p.isDark ? '#ACBBD0' : '#51637A';

    useEffect(() => {
        if (isFocused && routeQuery) {
            setTopic(null);
            setSearchQuery(routeQuery);
            list.current?.scrollToOffset({ offset: 0, animated: false });
        }
    }, [isFocused, routeQuery]);

    function changeSearch(value: string) {
        setTopic(null);
        setSearchQuery(value);
        if (routeQuery) router.setParams({ q: undefined });
        list.current?.scrollToOffset({ offset: 0, animated: false });
    }

    function selectTopic(nextTopic: Topic) {
        Keyboard.dismiss();
        setTopic(nextTopic);
        list.current?.scrollToOffset({ offset: 0, animated: false });
    }

    async function onRefresh() {
        setRefreshing(true);
        try {
            await refreshPosts();
        } finally {
            setRefreshing(false);
        }
    }

    let visiblePosts = posts;
    if (isTagSearch) {
        visiblePosts = [];
    } else if (topic) {
        visiblePosts = posts.filter(post => topic.match.test(post.content));
    } else if (query) {
        const normalizedQuery = query.toLowerCase();
        visiblePosts = posts.filter(post => post.content.toLowerCase().includes(normalizedQuery));
    } else if (activeTab === 'discussed') {
        visiblePosts = [...posts].sort((left, right) => right.comments - left.comments || right.likes - left.likes);
    } else if (activeTab === 'video') {
        visiblePosts = posts.filter(post => !!post.videoUrl);
    }

    const listHeader = (
        <View>
            {browsing && (
                <View style={styles.dashboard}>
                    <Pressable accessibilityRole="link" onPress={() => router.push('/animated-shorts')}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 17, borderWidth: 1, borderColor: line, backgroundColor: iconFill }}>
                        <Ionicons name="film-outline" size={24} color={accent} />
                        <View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: p.text }]}>Animated Shorts</Text>
                            <Text style={[styles.rowDetail, { color: muted }]}>Short cartoons that explain how things work.</Text></View>
                        <Ionicons name="arrow-forward" size={18} color={accent} />
                    </Pressable>
                    <View style={[styles.spotlight, wide && styles.spotlightWide]}>
                        <View style={[styles.hero, wide && styles.heroWide]}>
                            <Image accessible={false} source={require('../../../assets/discover-orbit.jpg')}
                                style={styles.coverImage} resizeMode="cover" />
                            <LinearGradient
                                colors={['rgba(5, 13, 28, 0.99)', 'rgba(5, 13, 28, 0.80)', 'rgba(5, 13, 28, 0.04)']}
                                locations={wide ? [0, 0.36, 0.86] : [0, 0.38, 1]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFill}
                            />
                            <View style={[styles.heroCopy, wide && styles.heroCopyWide]}>
                                <Text accessibilityRole="header"
                                    style={[styles.heroTitle, wide && styles.heroTitleWide]}>
                                    Find your next{'\n'}<Text style={styles.heroAccent}>rabbit hole.</Text>
                                </Text>
                                <Text style={styles.heroNote}>Big questions worth debating.</Text>
                                <Pressable accessibilityRole="button"
                                    onPress={() => list.current?.scrollToOffset({ offset: debateOffset.current, animated: true })}
                                    style={({ pressed }) => [styles.heroAction, pressed && styles.pressed]}>
                                    <Text style={styles.heroActionLabel}>Browse debates</Text>
                                    <Ionicons name="arrow-down" size={15} color="#132A43" />
                                </Pressable>
                            </View>
                        </View>

                        <View style={[styles.focus, wide && styles.focusWide, { backgroundColor: p.card, borderColor: line }]}>
                            <View style={styles.focusHeader}>
                                <Ionicons name="pulse-outline" size={21} color={accent} />
                                <Text accessibilityRole="header" style={[styles.focusTitle, { color: p.text }]}>In focus</Text>
                            </View>
                            {focusTopics.map((item, index) => (
                                <Pressable key={item.title} accessibilityRole="button" onPress={() => selectTopic(item)}
                                    style={({ pressed }) => [
                                        styles.focusItem, { borderColor: line }, index > 0 && styles.focusDivider,
                                        pressed && styles.pressed,
                                    ]}>
                                    <View style={[styles.focusIcon, { backgroundColor: iconFill }]}>
                                        <Ionicons name={item.icon} size={19} color={accent} />
                                    </View>
                                    <View style={styles.flex}>
                                        <Text style={[styles.rowTitle, { color: p.text }]}>{item.title}</Text>
                                        <Text style={[styles.rowDetail, { color: muted }]}>{item.description}</Text>
                                    </View>
                                    <Ionicons name="arrow-forward" size={16} color={accent} />
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: p.text }]}>Explore topics</Text>
                        <View style={[styles.topics, wide && styles.topicsWide]}>
                            {topics.map(item => (
                                <Pressable key={item.title} accessibilityRole="button" onPress={() => selectTopic(item)}
                                    style={({ pressed }) => [
                                        styles.topicCard, wide && styles.topicCardWide,
                                        { backgroundColor: p.isDark ? '#142236' : item.tint, borderColor: line },
                                        pressed && styles.pressed,
                                    ]}>
                                    <View pointerEvents="none" style={styles.topicArtwork}>
                                        <Ionicons name={item.icon} size={112} color={accent} />
                                    </View>
                                    <View style={styles.topicCopy}>
                                        <Text style={[styles.topicTitle, { color: p.text }]}>{item.title}</Text>
                                        <Text style={[styles.rowDetail, { color: muted }]}>{item.description}</Text>
                                    </View>
                                    <View style={[styles.topicArrow, { backgroundColor: p.card }]}>
                                        <Ionicons name="arrow-up-outline" size={16} color={accent} style={styles.diagonalArrow} />
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {creators.length > 0 && (
                        <View style={styles.section}>
                            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: p.text }]}>People to discover</Text>
                            <View style={[styles.creators, wide && styles.creatorsWide]}>
                                {creators.slice(0, 3).map(creator => (
                                    <View key={creator.id}
                                        style={[styles.creatorCard, wide && styles.creatorCardWide, { backgroundColor: p.card, borderColor: line }]}>
                                        <Pressable accessibilityRole="button" accessibilityLabel={`View @${creator.username} profile`}
                                            onPress={() => router.push({ pathname: '/user/[id]', params: { id: creator.id } })}
                                            style={({ pressed }) => [styles.creatorProfile, pressed && styles.pressed]}>
                                            <CreatorAvatar key={creator.avatarUrl} creator={creator} backgroundColor={iconFill} color={accent} />
                                            <View style={styles.flex}>
                                                <Text numberOfLines={1} style={[styles.rowTitle, { color: p.text }]}>{creator.displayName}</Text>
                                                <Text numberOfLines={1} style={[styles.rowDetail, { color: muted }]}>@{creator.username}</Text>
                                            </View>
                                        </Pressable>
                                        {user && (
                                            <Pressable accessibilityRole="button"
                                                accessibilityLabel={`${creator.isFollowing ? 'Unfollow' : 'Follow'} @${creator.username}`}
                                                onPress={() => toggleFollowUser(creator.id)}
                                                style={({ pressed }) => [styles.follow, { backgroundColor: iconFill }, pressed && styles.pressed]}>
                                                <Ionicons name={creator.isFollowing ? 'checkmark' : 'person-add-outline'} size={17} color={accent} />
                                            </Pressable>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}

            {!!query && <UserSearchResults {...userSearch} onRetry={userSearch.retry} />}

            {!isTagSearch && (
                <View onLayout={event => { debateOffset.current = event.nativeEvent.layout.y; }} style={styles.debateHeader}>
                    {topic && (
                        <Pressable accessibilityRole="button" onPress={() => setTopic(null)}
                            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
                            <Ionicons name="arrow-back" size={17} color={accent} />
                            <Text style={[styles.rowTitle, { color: accent }]}>All topics</Text>
                        </Pressable>
                    )}
                    <Text accessibilityRole="header" style={[styles.sectionTitle, { color: p.text }]}>
                        {topic?.title ?? (query ? 'Debate results' : 'Active debates')}
                    </Text>
                    {browsing && <DebateSwitcher activeTab={activeTab} onTabChange={setActiveTab} />}
                </View>
            )}
        </View>
    );

    const emptyMessage = topic ? 'No debates on this topic yet.'
        : query ? 'No debates match your search.'
        : activeTab === 'video' ? 'No debates with video yet.' : 'No debates yet.';

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
            <View style={[styles.masthead, desktop && styles.mastheadDesktop]}>
                <Text accessibilityRole="header" aria-level={1}
                    style={[styles.title, desktop && styles.titleDesktop, { color: p.text }]}>Discover</Text>
                <View style={[
                    styles.search, desktop && styles.searchDesktop,
                    { backgroundColor: p.card, borderColor: searchFocused ? accent : line },
                ]}>
                    <Ionicons name="search-outline" size={19} color={accent} />
                    <TextInput
                        style={[styles.searchInput, { color: p.text }]}
                        accessibilityLabel="Search debates or users by username"
                        placeholder="Search debates or @username"
                        placeholderTextColor={muted}
                        value={searchQuery}
                        onChangeText={changeSearch}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="search"
                    />
                    {!!searchQuery && (
                        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => changeSearch('')} hitSlop={10}>
                            <Ionicons name="close-circle-outline" size={20} color={muted} />
                        </Pressable>
                    )}
                </View>
            </View>

            <FlatList
                ref={list}
                data={visiblePosts}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <DebateCard item={item}
                        onPress={() => router.push({ pathname: '/debate/[id]', params: { id: item.id } })} />
                )}
                ListHeaderComponent={listHeader}
                ListEmptyComponent={!isTagSearch ? (
                    <View style={[styles.empty, { backgroundColor: p.card, borderColor: line }]}>
                        {loadingPosts ? <ActivityIndicator color={accent} /> : (
                            <Text style={[styles.rowDetail, { color: muted }]}>{emptyMessage}</Text>
                        )}
                    </View>
                ) : undefined}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, minHeight: 0 },
    flex: { flex: 1, minWidth: 0 },
    masthead: { marginHorizontal: 16, paddingTop: 14, paddingBottom: 18, gap: 12 },
    mastheadDesktop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 25, paddingBottom: 20, gap: 24 },
    title: { fontFamily: 'Outfit_700Bold', fontSize: 35, lineHeight: 42, letterSpacing: -1.5 },
    titleDesktop: { fontSize: 48, lineHeight: 54, letterSpacing: -2.4 },
    search: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 15, borderRadius: 15, borderWidth: 1 },
    searchDesktop: { flex: 1, maxWidth: 380 },
    searchInput: { flex: 1, minWidth: 0, minHeight: 46, padding: 0, fontFamily: 'Inter_400Regular', fontSize: 14 },
    listContent: { paddingBottom: 104 },
    dashboard: { marginHorizontal: 16, gap: 26 },
    spotlight: { gap: 12 },
    spotlightWide: { flexDirection: 'row', alignItems: 'stretch', gap: 14 },
    hero: { justifyContent: 'center', minHeight: 243, borderRadius: 24, overflow: 'hidden', backgroundColor: '#071120' },
    heroWide: { flex: 2.2, minHeight: 280 },
    coverImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
    heroCopy: { alignItems: 'flex-start', paddingVertical: 26, paddingHorizontal: 22 },
    heroCopyWide: { paddingHorizontal: 34, paddingVertical: 35 },
    heroTitle: { fontFamily: 'Outfit_700Bold', fontSize: 36, lineHeight: 37, letterSpacing: -1.35, color: '#FFFFFF' },
    heroTitleWide: { fontSize: 54, lineHeight: 52, letterSpacing: -2.2 },
    heroAccent: { color: '#BFDAFA' },
    heroNote: { color: '#D5E2F0', fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginTop: 12 },
    heroAction: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 13, paddingHorizontal: 14, minHeight: 44, marginTop: 20, backgroundColor: '#D8EAFE' },
    heroActionLabel: { color: '#132A43', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
    focus: { borderRadius: 23, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13 },
    focusWide: { flex: 1, justifyContent: 'center', paddingHorizontal: 17, paddingVertical: 16 },
    focusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
    focusTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 22, letterSpacing: -0.35 },
    focusItem: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 72, paddingVertical: 10 },
    focusDivider: { borderTopWidth: 1 },
    focusIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    rowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 19 },
    rowDetail: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
    section: { gap: 11 },
    sectionTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 26, lineHeight: 31, letterSpacing: -0.6 },
    topics: { gap: 8 },
    topicsWide: { flexDirection: 'row', gap: 12 },
    topicCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        padding: 14, minHeight: 82, borderWidth: 1, borderRadius: 17, overflow: 'hidden' },
    topicCardWide: { flex: 1, minWidth: 0, alignItems: 'flex-end', minHeight: 119 },
    topicArtwork: { position: 'absolute', right: 16, top: -34, opacity: 0.14, transform: [{ rotate: '-13deg' }] },
    topicCopy: { flex: 1, minWidth: 0, gap: 3 },
    topicTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 19, lineHeight: 23, letterSpacing: -0.3 },
    topicArrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    diagonalArrow: { transform: [{ rotate: '45deg' }] },
    creators: { gap: 8 },
    creatorsWide: { flexDirection: 'row', gap: 12 },
    creatorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 67,
        borderWidth: 1, borderRadius: 17, paddingHorizontal: 10, paddingVertical: 8 },
    creatorCardWide: { flex: 1, minWidth: 0 },
    creatorProfile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 0 },
    avatar: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarInitial: { fontFamily: 'Outfit_600SemiBold', fontSize: 18 },
    follow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
    debateHeader: { marginHorizontal: 16, paddingTop: 24, paddingBottom: 14, gap: 10 },
    back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 40 },
    empty: { alignItems: 'center', marginHorizontal: 16, paddingVertical: 26, paddingHorizontal: 12, borderWidth: 1, borderRadius: 17 },
    pressed: { opacity: 0.75 },
});
