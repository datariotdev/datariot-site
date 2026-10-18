import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, FlatList, useWindowDimensions, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { theme as baseTheme } from '@design-system/theme';
import { useRecommendedUsers } from '@lib/supabase/hooks/useRecommendedUsers';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { usePosts } from '@lib/supabase/hooks/usePosts';
import { AmbientGlow } from '../../components/UI/AmbientGlow';

// Intelligence Hub Components
import { SectionHeader } from '@components/Discovery/SectionHeader';
import { DNAMatchCard } from '@components/Discovery/DNAMatchCard';
import { DebateCard } from '@components/Debate/DebateCard';
import { TrendingTopics } from '@components/Discovery/TrendingTopics';
import { TrendingBullets } from '@components/Discovery/TrendingBullets';
import { DebateSwitcher } from '@components/Discovery/DebateSwitcher';
import { IntellectRecommendations } from '@components/Discovery/IntellectRecommendations';

export default function DiscoverScreen() {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [activeBranch, setActiveBranch] = useState('active');
    const router = useRouter();

    // 1. Fetch Debates (Posts)
    const {
        posts: textPosts,
        refresh: refreshPosts
    } = usePosts();

    // 2. Recommended Minds (Real Data)
    const {
        users: recommendedUsers,
        toggleFollowUser
    } = useRecommendedUsers();

    // --- Intelligence Hub Data ---

    // 1. Recommended Accounts (Top 5 active)
    const recommendedAccounts = (recommendedUsers || []).slice(0, 5).map((user, i) => ({
        id: user.id || `u-${i}`,
        username: user.username || 'Thinker',
        avatarUrl: user.avatarUrl || `https://i.pravatar.cc/150?u=${i}`,
        logicScore: Math.floor(Math.random() * 15000) + 5000,
        activity: i % 2 === 0 ? 'Active in AI Ethics' : 'Top Rebutter in Space Law'
    }));

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        refreshPosts();
        setTimeout(() => setRefreshing(false), 1000);
    }, [refreshPosts]);

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* 1. Trending Topics (Primary Hierarchy) */}
            {!searchQuery && (
                <View style={styles.sectionPadding}>
                    <TrendingTopics onItemPress={(id) => setSearchQuery(id)} />
                </View>
            )}

            {/* 2. Trending Now (Secondary Categories) */}
            {!searchQuery && (
                <View style={styles.sectionPadding}>
                    <TrendingBullets onItemPress={(id) => setSearchQuery(id)} />
                </View>
            )}

            {/* 3. Recommended Accounts (5 accounts) */}
            {!searchQuery && (
                <View style={styles.sectionPadding}>
                    <IntellectRecommendations
                        intellects={recommendedAccounts}
                        onFollow={(id) => toggleFollowUser(id)}
                        onPress={(id) => router.push(`/(tabs)/profile`)}
                    />
                </View>
            )}

            {/* 4. Debate Switcher & Feed Header */}
            <View style={{ marginTop: 8 }}>
                <SectionHeader
                    title={searchQuery ? 'Strategic Search' : 'Active Debates'}
                    subtitle={searchQuery ? `Logic for "${searchQuery}"` : 'Filter by knowledge branch'}
                />
                {!searchQuery && (
                    <DebateSwitcher
                        activeTab={activeBranch}
                        onTabChange={setActiveBranch}
                    />
                )}
            </View>
        </View>
    );

    const renderDebateItem = ({ item }: { item: any }) => (
        <DebateCard
            item={{
                ...item,
                createdAt: item.createdAt || new Date().toISOString()
            }}
            onPress={() => {
                router.push({
                    pathname: '/(tabs)',
                    params: { postId: item.id }
                });
            }}
        />
    );

    const filteredPosts = searchQuery
        ? textPosts.filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase()))
        : textPosts;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <AmbientGlow color={isDark ? "rgba(217, 228, 255, 0.08)" : "rgba(217, 228, 255, 0.04)"} size={380} opacity={0.6} duration={25000} delay={0} />
            <SafeAreaView style={styles.safeArea}>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={styles.searchBarBlur}>
                        <View style={[styles.searchBar, {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
                        }]}>
                            <Ionicons name="search-outline" size={18} color={theme.colors.text.muted} />
                            <TextInput
                                style={[styles.searchInput, { color: theme.colors.text.primary }]}
                                placeholder="Search the Arena..."
                                placeholderTextColor={theme.colors.text.muted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <Pressable onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={18} color={theme.colors.text.muted} />
                                </Pressable>
                            )}
                        </View>
                    </BlurView>
                </View>

                <FlatList
                    data={filteredPosts}
                    renderItem={renderDebateItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.colors.text.muted }]}>No debates found matching your search.</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.primary.light}
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
    headerContainer: {
        paddingTop: Platform.OS === 'android' ? 10 : 0,
        gap: 8,
    },
    searchContainer: {
        paddingHorizontal: baseTheme.spacing.lg,
        paddingTop: 12,
        paddingBottom: 16,
    },
    searchBarBlur: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: baseTheme.colors.text.primary,
        height: '100%',
    },
    sectionPadding: {
        paddingBottom: 8,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
});
