import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, FlatList, RefreshControl, Share, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { useVideos, Video } from '@lib/supabase/hooks/useVideos';
import { usePosts, Post } from '@lib/supabase/hooks/usePosts';
import { supabase } from '@lib/supabase/client';
import { useUI } from '../../design-system/ui';
import { useTabBarHeight } from '../../lib/hooks/useTabBarHeight';
import { contentStamp } from '../../lib/utils/freshness';
import { DebateCard } from '@components/Debate/DebateCard';
import { Tabs } from '../../components/core/Tabs';
import { EmptyState } from '../../components/core/EmptyState';
import { ProfileHeader } from '../../components/Profile/ProfileHeader';
import { GridRow, chunk } from '../../components/Profile/ProfileGrid';
import { CreatorSheet, CreatorStats } from '../../components/Profile/CreatorSheet';
import { notify, confirmAction } from '../../lib/utils/dialogs';

interface ProfileData {
    username: string;
    display_name: string;
    avatar_url: string | null;
    banner_url: string | null;
    bio: string | null;
    followers_count: number;
    following_count: number;
    videos_count: number;
    theses_count: number;
    arguments_count: number;
    created_at: string;
    total_impact_score: number;
    global_rank?: number | string;
    top_category?: string;
    activity_level?: string;
    win_rate?: string;
}

type TabKey = 'videos' | 'posts' | 'saved';
const TABS: { key: TabKey; label: string }[] = [
    { key: 'videos', label: 'Videos' },
    { key: 'posts', label: 'Debates' },
    { key: 'saved', label: 'Saved' },
];

type Row = { kind: 'row'; id: string; videos: Video[] } | { kind: 'post'; id: string; post: Post };

/** Your page: who you are, what you have posted, what you have kept. */
export default function ProfileScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { c, isDark } = useUI();
    const tabBarHeight = useTabBarHeight();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const { tab } = useLocalSearchParams<{ tab?: string }>();
    const [activeTab, setActiveTab] = useState<TabKey>(tab === 'saved' ? 'saved' : 'videos');
    const [showStats, setShowStats] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const mine = useVideos({ type: 'user', userId: user?.id });
    const saved = useVideos({ type: 'user', savedBy: user?.id, enabled: activeTab === 'saved' && !!user });
    const { posts, loading: loadingPosts, refresh: refreshPosts, deletePost } = usePosts(user?.id);

    // This tab stays mounted, so a later "open my saved videos" arrives as a new param
    useEffect(() => {
        if (tab === 'saved') setActiveTab('saved');
    }, [tab]);

    const fetchProfile = useCallback(async () => {
        if (!supabase || !user) return;
        try {
            const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profileError) throw profileError;

            const count = async (table: string) => {
                const { count: n } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq('user_id', user.id);
                return n || 0;
            };
            const [videoCount, thesisCount, argumentCount] = await Promise.all([count('videos'), count('posts'), count('comments')]);

            // The category they post in most
            let topCat = 'General';
            const { data: userVideos } = await supabase.from('videos').select('category').eq('user_id', user.id).limit(50);
            if (userVideos?.length) {
                const tally: Record<string, number> = {};
                userVideos.forEach((v: any) => { if (v.category) tally[v.category] = (tally[v.category] || 0) + 1; });
                const best = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
                if (best) topCat = best[0].charAt(0).toUpperCase() + best[0].slice(1);
            }

            // Rank by impact score
            let rank: string | number = '—';
            const { count: ahead } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('total_impact_score', profileData?.total_impact_score || 0);
            if (ahead !== null) rank = `#${ahead + 1}`;

            const total = videoCount + thesisCount + argumentCount;
            const activity = total > 50 ? 'High' : total > 10 ? 'Medium' : 'Low';

            // Likes on what they wrote, per contribution, capped at 100
            let approval = '0%';
            try {
                const { data: cl } = await supabase.from('comments').select('likes_count').eq('user_id', user.id);
                const { data: pl } = await supabase.from('posts').select('likes_count').eq('user_id', user.id);
                const likes = (cl?.reduce((s: number, x: any) => s + (x.likes_count || 0), 0) || 0) + (pl?.reduce((s: number, x: any) => s + (x.likes_count || 0), 0) || 0);
                if (total > 0) approval = `${Math.min(100, Math.floor((likes / total) * 100))}%`;
            } catch (e) {
                console.error('Error calculating approval rate:', e);
            }

            if (profileData) {
                setProfile({
                    ...profileData,
                    videos_count: videoCount,
                    theses_count: thesisCount,
                    arguments_count: argumentCount,
                    top_category: topCat,
                    global_rank: rank,
                    activity_level: activity,
                    win_rate: approval,
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    }, [user]);

    // Something was posted while this tab was out of view: reload what it lists
    const reload = useRef<() => void>(() => { });
    reload.current = () => { mine.refresh(); refreshPosts?.(); };
    const seenStamp = useRef(contentStamp());

    useFocusEffect(useCallback(() => {
        fetchProfile();
        const stamp = contentStamp();
        if (stamp !== seenStamp.current) {
            seenStamp.current = stamp;
            reload.current();
        }
    }, [fetchProfile]));

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([fetchProfile(), refreshPosts?.()]);
            mine.refresh();
        } finally {
            setTimeout(() => setRefreshing(false), 500);
        }
    };

    const confirmDelete = async (postId: string) => {
        const yes = await confirmAction('Delete this debate?', { message: 'This removes it for everyone.', confirmLabel: 'Delete', destructive: true });
        if (!yes) return;
        try { await deletePost(postId); } catch { notify('Could not delete', 'Please try again.'); }
    };

    const openVideo = (video: Video) =>
        router.push({
            pathname: '/video-player',
            params: activeTab === 'saved'
                ? { type: 'user', savedBy: user?.id, initialVideoId: video.id }
                : { type: 'user', userId: user?.id, initialVideoId: video.id },
        });

    const shareProfile = () => {
        if (!user) return;
        const name = profile?.display_name || profile?.username || 'me';
        Share.share({ message: `${name} on Datariot · https://datariot.xyz/user/${user.id}` }).catch(() => { });
    };

    const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

    const stats: CreatorStats = {
        memberSince: profile?.created_at,
        impact: profile?.total_impact_score || 0,
        rank: profile?.global_rank,
        topInterest: profile?.top_category,
        activity: profile?.activity_level,
        approval: profile?.win_rate,
    };

    const activeVideos = activeTab === 'saved' ? saved : mine;

    const rows: Row[] = useMemo(() => {
        if (activeTab === 'posts') return posts.map(p => ({ kind: 'post' as const, id: p.id, post: p }));
        return chunk(activeVideos.videos).map((vs, i) => ({ kind: 'row' as const, id: `row-${i}-${vs[0].id}`, videos: vs }));
    }, [activeTab, posts, activeVideos.videos]);

    if (!user) {
        return (
            <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center' }}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <EmptyState
                    icon="person-outline"
                    title="Your profile lives here"
                    body="Sign in to post videos, join debates and keep what you like."
                    actionLabel="Sign in"
                    onAction={() => router.push('/auth/login')}
                />
            </View>
        );
    }

    const loadingList = activeTab === 'posts' ? loadingPosts && posts.length === 0 : activeVideos.loading && activeVideos.videos.length === 0;

    const empty = loadingList ? (
        <View style={{ paddingVertical: 48 }}><ActivityIndicator color={c.textSecondary} /></View>
    ) : activeTab === 'videos' ? (
        <EmptyState icon="film-outline" title="No videos yet" body="Your first one takes a minute." actionLabel="Create" onAction={() => router.push('/create')} />
    ) : activeTab === 'posts' ? (
        <EmptyState icon="chatbubbles-outline" title="No debates yet" body="Put an argument out and see who picks a side." actionLabel="Propose a thesis" onAction={() => router.push('/publish')} />
    ) : (
        <EmptyState icon="bookmark-outline" title="Nothing saved yet" body="Tap the bookmark on a video to keep it here." />
    );

    return (
        <View style={{ flex: 1, backgroundColor: c.bg }}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <FlatList
                data={rows}
                keyExtractor={r => r.id}
                renderItem={({ item }) =>
                    item.kind === 'row'
                        ? <GridRow videos={item.videos} onOpen={openVideo} />
                        : <DebateCard item={item.post} isOwnPost onDelete={confirmDelete} onPress={() => router.push(`/debate/${item.post.id}` as any)} />
                }
                ListHeaderComponent={
                    <View>
                        <ProfileHeader
                            profile={profile}
                            fallbackName={user.email?.split('@')[0] || 'you'}
                            isOwn
                            onBack={router.canGoBack() ? goBack : undefined}
                            onSettings={() => router.push('/settings')}
                            onShare={shareProfile}
                            onEdit={() => router.push('/edit-profile')}
                            onStats={() => setShowStats(true)}
                        />
                        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
                        <View style={{ height: 8 }} />
                    </View>
                }
                ListEmptyComponent={empty}
                onEndReached={activeTab === 'posts' ? undefined : activeVideos.loadMore}
                onEndReachedThreshold={0.6}
                contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.textSecondary} />}
            />
            <CreatorSheet visible={showStats} onClose={() => setShowStats(false)} stats={stats} />
        </View>
    );
}
