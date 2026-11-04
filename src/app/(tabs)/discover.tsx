import React, { useState } from 'react';
import {
    ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView,
    StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { useTheme } from '@components/Theme/ThemeProvider';
import { FullScreenVideoModal } from '@components/VideoFeed/FullScreenVideoModal';
import { usePosts, type Post } from '@lib/supabase/hooks/usePosts';
import { useRecommendedUsers } from '@lib/supabase/hooks/useRecommendedUsers';
import { useVideos } from '@lib/supabase/hooks/useVideos';

const TOPICS = [
    { label: 'AI & minds', icon: 'sparkles-outline', pattern: /\b(ai|artificial intelligence|consciousness|robots?|llm)\b/i },
    { label: 'Engineering', icon: 'construct-outline', pattern: /\b(engineering|energy|nuclear|infrastructure|robots?|technology)\b/i },
    { label: 'Space', icon: 'planet-outline', pattern: /\b(space|mars|moon|orbit|spacecraft|satellites?)\b/i },
    { label: 'Markets', icon: 'trending-up-outline', pattern: /\b(markets?|crypto|bitcoin|finance|economy|capitalism)\b/i },
    { label: 'Ethics', icon: 'scale-outline', pattern: /\b(ethics?|moral|rights?|privacy|justice|personhood)\b/i },
] as const;

export default function DiscoverScreen() {
    const router = useRouter();
    const { theme, mode } = useTheme();
    const insets = useSafeAreaInsets();
    const { colors, typography: { fontFamilies } } = theme;
    const isDark = mode === 'dark';
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

    const { posts, loading, refresh: refreshPosts } = usePosts();
    const { users, toggleFollowUser } = useRecommendedUsers();
    const { videos, toggleLike, toggleFollow } = useVideos({ type: 'trending' });

    const query = search.trim();
    const topic = TOPICS.find((entry) => entry.label === query);
    const searchablePosts = posts.filter((post) => post.content?.trim());
    const featured = query ? undefined : searchablePosts.reduce<Post | undefined>(
        (best, post) => !best || post.comments > best.comments ? post : best, undefined,
    );
    const results = query
        ? searchablePosts.filter((post) => topic
            ? topic.pattern.test(post.content)
            : `${post.content} ${post.authorName}`.toLowerCase().includes(query.toLowerCase()))
        : searchablePosts.filter((post) => post.id !== featured?.id);

    const balance = featured?.logicStats;
    const hasBalance = balance && balance.forScore + balance.againstScore > 0;
    const forPercent = Math.round(balance?.forPercentage ?? 0);

    const openDebate = (id: string) => router.push({ pathname: '/debate/[id]', params: { id } });

    const refresh = async () => {
        setRefreshing(true);
        try {
            await refreshPosts();
        } finally {
            setRefreshing(false);
        }
    };

    const ink = { color: colors.text.primary };
    const muted = { color: colors.text.secondary };
    const accent = { color: colors.primary.DEFAULT };
    const edge = { borderColor: colors.surface.border };
    const bold = { fontFamily: fontFamilies.bold };
    const regular = { fontFamily: fontFamilies.regular };
    const heroColors = isDark ? ['#101521', '#222641'] as const : ['#F0F3FE', '#DFE6FC'] as const;
    const orbitColor = isDark ? 'rgba(183, 202, 255, 0.22)' : 'rgba(58, 87, 164, 0.21)';

    const header = (
        <View style={styles.header}>
            <View>
                <View style={styles.eyebrowRow}>
                    <View style={[styles.signal, { backgroundColor: colors.primary.DEFAULT }]} />
                    <Text style={[styles.eyebrow, accent, bold]}>DATARIOT / EXPLORE</Text>
                </View>
                <Text accessibilityRole="header" style={[styles.title, ink, bold]}>
                    Discover<Text style={accent}>.</Text>
                </Text>
                <Text style={[styles.subtitle, muted, regular]}>Find a question worth following.</Text>
            </View>

            <View style={[styles.search, edge, { backgroundColor: colors.background.secondary }]}>
                <Ionicons name="search-outline" size={19} color={colors.text.secondary} />
                <TextInput
                    accessibilityLabel="Search debates or authors"
                    placeholder="Search debates or authors"
                    placeholderTextColor={colors.text.secondary}
                    style={[styles.searchInput, ink, regular]}
                    returnKeyType="search"
                    value={search}
                    onChangeText={setSearch}
                />
                {!!search && (
                    <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => setSearch('')}>
                        <Ionicons name="close" size={21} color={colors.text.secondary} />
                    </Pressable>
                )}
            </View>

            {featured && (
                <Pressable accessibilityRole="button" accessibilityHint="Opens the debate thread" onPress={() => openDebate(featured.id)}
                    style={({ pressed }) => [styles.feature, edge, pressed && styles.pressed]}>
                    <LinearGradient colors={heroColors} start={{ x: 0.12, y: 0.82 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                    <View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={styles.orbit}>
                        {[184, 144, 104, 64].map((size) => (
                            <View key={size} style={[styles.orbitRing, { width: size, height: size, borderRadius: size / 2, borderColor: orbitColor }]} />
                        ))}
                        <View style={[styles.orbitDot, { backgroundColor: colors.primary.DEFAULT }]} />
                    </View>

                    <Text style={[styles.eyebrow, accent, bold]}>IN FOCUS</Text>
                    <Text style={[styles.question, ink, bold]} numberOfLines={4}>{featured.content.trim()}</Text>
                    {hasBalance && (
                        <View style={styles.balance}>
                            <View style={[styles.balanceTrack, { backgroundColor: colors.surface.border }]}>
                                <View style={{ width: `${forPercent}%`, backgroundColor: colors.primary.DEFAULT }} />
                            </View>
                            <View style={styles.balanceLabels}>
                                <Text style={[styles.meta, accent, bold]}>For {forPercent}%</Text>
                                <Text style={[styles.meta, muted, regular]}>Against {100 - forPercent}%</Text>
                            </View>
                        </View>
                    )}
                    <View style={styles.featureFooter}>
                        <View style={styles.featureInfo}>
                            <Text style={[styles.author, ink, bold]} numberOfLines={1}>{featured.authorName}</Text>
                            <Text style={[styles.meta, muted, regular]}>
                                {featured.comments} {featured.comments === 1 ? 'reply' : 'replies'}
                            </Text>
                        </View>
                        <View style={[styles.featureArrow, { backgroundColor: colors.primary.DEFAULT }]}>
                            <Feather name="arrow-up-right" size={24} color={colors.primary.onPrimary} />
                        </View>
                    </View>
                </Pressable>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.topicRail}>
                {TOPICS.map(({ label, icon }) => {
                    const selected = topic?.label === label;
                    return (
                        <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }}
                            onPress={() => setSearch(selected ? '' : label)}
                            style={({ pressed }) => [styles.topic, edge, {
                                backgroundColor: selected ? colors.primary.DEFAULT : colors.background.secondary,
                            }, pressed && styles.pressed]}>
                            <Ionicons name={icon} size={15} color={selected ? colors.primary.onPrimary : colors.primary.DEFAULT} />
                            <Text style={[styles.topicLabel, bold, { color: selected ? colors.primary.onPrimary : colors.text.primary }]}>{label}</Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {!query && videos.length > 0 && (
                <View style={styles.section}>
                    <Text accessibilityRole="header" style={[styles.sectionTitle, ink, bold]}>Short takes</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.videoRail}>
                        {videos.slice(0, 5).map((video) => (
                            <Pressable key={video.id} accessibilityRole="button" accessibilityLabel={`Play ${video.title}`}
                                onPress={() => setSelectedVideoId(video.id)}
                                style={({ pressed }) => [styles.video, pressed && styles.pressed]}>
                                <View style={[styles.poster, edge, { backgroundColor: colors.background.tertiary }]}>
                                    {video.thumbnailUrl && <Image source={{ uri: video.thumbnailUrl }} style={StyleSheet.absoluteFill} />}
                                    <View style={styles.playIcon}>
                                        <Ionicons name="play" size={13} color="#FFF" />
                                    </View>
                                </View>
                                <Text style={[styles.videoTitle, ink, bold]} numberOfLines={2}>{video.title}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            )}

            {!query && users.length > 0 && (
                <View style={styles.section}>
                    <Text accessibilityRole="header" style={[styles.sectionTitle, ink, bold]}>People to follow</Text>
                    {users.slice(0, 5).map((user) => (
                        <View key={user.id} style={[styles.person, edge]}>
                            <Pressable accessibilityRole="button" style={styles.profile}
                                onPress={() => router.push({ pathname: '/user/[id]', params: { id: user.id } })}>
                                <View style={[styles.avatar, { backgroundColor: colors.background.tertiary }]}>
                                    <Text style={[ink, bold]}>{user.displayName.slice(0, 1).toUpperCase()}</Text>
                                    {user.avatarUrl && <Image source={{ uri: user.avatarUrl }} style={StyleSheet.absoluteFill} />}
                                </View>
                                <View style={styles.featureInfo}>
                                    <Text style={[styles.author, ink, bold]} numberOfLines={1}>{user.displayName}</Text>
                                    <Text style={[styles.meta, muted, regular]} numberOfLines={1}>@{user.username}</Text>
                                </View>
                            </Pressable>
                            <Pressable accessibilityRole="button" accessibilityLabel={`${user.isFollowing ? 'Unfollow' : 'Follow'} ${user.displayName}`}
                                onPress={() => toggleFollowUser(user.id)}
                                style={({ pressed }) => [styles.follow, edge, pressed && styles.pressed]}>
                                <Ionicons name={user.isFollowing ? 'checkmark' : 'add'} size={20} color={colors.primary.DEFAULT} />
                            </Pressable>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.sectionHeading}>
                <Text accessibilityRole="header" style={[styles.sectionTitle, ink, bold]}>{query ? 'Search results' : 'Latest debates'}</Text>
                {!loading && <Text style={[styles.meta, muted, regular]}>{results.length}</Text>}
            </View>
        </View>
    );

    return (
        <SafeAreaView edges={['top', 'left', 'right']}>
            <FlatList
                data={results}
                keyExtractor={(post) => post.id}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 8) + 76 }]}
                ListHeaderComponent={header}
                ListEmptyComponent={loading
                    ? <ActivityIndicator color={colors.primary.DEFAULT} style={styles.empty} />
                    : <Text style={[styles.empty, muted, regular]}>{query ? 'No debates match your search.' : 'No more debates yet.'}</Text>}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary.DEFAULT} />}
                renderItem={({ item }) => (
                    <Pressable accessibilityRole="button" onPress={() => openDebate(item.id)}
                        style={({ pressed }) => [styles.debate, edge, pressed && styles.pressed]}>
                        <View style={styles.featureInfo}>
                            <Text style={[styles.debateTitle, ink, bold]} numberOfLines={3}>{item.content.trim()}</Text>
                            <Text style={[styles.meta, muted, regular]} numberOfLines={1}>{item.authorName} · {item.comments} {item.comments === 1 ? 'reply' : 'replies'}</Text>
                        </View>
                        <Feather name="arrow-up-right" size={18} color={colors.primary.DEFAULT} />
                    </Pressable>
                )}
            />
            {selectedVideoId && (
                <FullScreenVideoModal
                    visible
                    videos={videos}
                    initialVideoId={selectedVideoId}
                    onClose={() => setSelectedVideoId(null)}
                    onLike={toggleLike}
                    onSave={(id) => console.log('Save:', id)}
                    onFollow={toggleFollow}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    list: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 18 },
    header: { gap: 20 },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    signal: { width: 7, height: 7, borderRadius: 4 },
    eyebrow: { fontSize: 11, letterSpacing: 1.7 },
    title: { fontSize: 55, letterSpacing: -3.8, marginTop: 3 },
    subtitle: { fontSize: 16, marginTop: 2 },
    search: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 15, minHeight: 48, paddingHorizontal: 14, gap: 10 },
    searchInput: { flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 10 },
    feature: { borderRadius: 25, borderWidth: 1, overflow: 'hidden', padding: 20, gap: 15 },
    orbit: { position: 'absolute', width: 188, height: 188, top: -66, right: -36, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-22deg' }, { scaleY: 0.72 }] },
    orbitRing: { position: 'absolute', borderWidth: 1 },
    orbitDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, right: 30, bottom: 35 },
    question: { maxWidth: 520, fontSize: 28, letterSpacing: -0.7 },
    balance: { gap: 5 },
    balanceTrack: { height: 4, borderRadius: 2, overflow: 'hidden', flexDirection: 'row' },
    balanceLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    featureFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 2 },
    featureInfo: { flex: 1, minWidth: 0, gap: 3 },
    author: { fontSize: 15 },
    meta: { fontSize: 13 },
    featureArrow: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
    topicRail: { gap: 8, alignItems: 'center' },
    topic: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, minHeight: 42 },
    topicLabel: { fontSize: 13 },
    section: { gap: 10, marginTop: 2 },
    sectionTitle: { fontSize: 23, letterSpacing: -0.5 },
    sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 6 },
    videoRail: { gap: 12 },
    video: { width: 124, gap: 7 },
    poster: { width: '100%', aspectRatio: 1, borderRadius: 17, overflow: 'hidden', borderWidth: 1, justifyContent: 'flex-end', padding: 7 },
    playIcon: { backgroundColor: '#111625', borderRadius: 15, height: 28, width: 28, alignItems: 'center', justifyContent: 'center' },
    videoTitle: { fontSize: 14 },
    person: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, paddingVertical: 8 },
    profile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
    avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    follow: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    debate: { flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, paddingVertical: 14 },
    debateTitle: { fontSize: 17 },
    pressed: { opacity: 0.72 },
    empty: { paddingVertical: 18 },
});
