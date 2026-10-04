import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, RefreshControl, Share, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { useVideos, Video } from '@lib/supabase/hooks/useVideos';
import { usePosts, Post } from '@lib/supabase/hooks/usePosts';
import { supabase } from '@lib/supabase/client';
import { promptSignIn } from '../../lib/utils/promptSignIn';
import { useUI } from '../../design-system/ui';
import { DebateCard } from '@components/Debate/DebateCard';
import { Tabs } from '../../components/core/Tabs';
import { EmptyState } from '../../components/core/EmptyState';
import { ProfileHeader, ProfileInfo } from '../../components/Profile/ProfileHeader';
import { GridRow, chunk } from '../../components/Profile/ProfileGrid';

type TabKey = 'videos' | 'posts';
const TABS: { key: TabKey; label: string }[] = [
    { key: 'videos', label: 'Videos' },
    { key: 'posts', label: 'Debates' },
];

type Row = { kind: 'row'; id: string; videos: Video[] } | { kind: 'post'; id: string; post: Post };

/** Someone else's page. The same header as yours; Follow and Message instead of Edit. */
export default function UserProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user: me } = useAuth();
    const router = useRouter();
    const { c, isDark } = useUI();

    const [profile, setProfile] = useState<ProfileInfo | null>(null);
    const [missing, setMissing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('videos');
    const [isFollowing, setIsFollowing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const theirs = useVideos({ type: 'user', userId: id });
    const { posts, loading: loadingPosts, refresh: refreshPosts } = usePosts(id);

    // Your own id lands on your own page
    useEffect(() => {
        if (me && id && me.id === id) router.replace('/profile');
    }, [me, id]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchProfile = useCallback(async () => {
        if (!supabase || !id) return;
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
            if (error) throw error;
            const { count } = await supabase.from('videos').select('*', { count: 'exact', head: true }).eq('user_id', id);
            setProfile({ ...data, videos_count: count || 0 });
            setMissing(false);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setMissing(true);
        }
    }, [id]);

    const checkFollowing = useCallback(async () => {
        if (!supabase || !me || !id) return;
        const { data } = await supabase.from('follows').select('follower_id').eq('follower_id', me.id).eq('following_id', id).maybeSingle();
        setIsFollowing(!!data);
    }, [me, id]);

    useEffect(() => {
        fetchProfile();
        checkFollowing();
    }, [fetchProfile, checkFollowing]);

    const handleFollow = async () => {
        if (!me) { promptSignIn('follow people'); return; }
        if (!supabase || !id || me.id === id) return;

        const was = isFollowing;
        const apply = (following: boolean) => {
            setIsFollowing(following);
            setProfile(p => (p ? { ...p, followers_count: Math.max(0, (p.followers_count || 0) + (following ? 1 : -1)) } : p));
        };
        apply(!was);

        try {
            const { error } = was
                ? await supabase.from('follows').delete().eq('follower_id', me.id).eq('following_id', id)
                : await supabase.from('follows').insert({ follower_id: me.id, following_id: id });
            if (error) throw error;
        } catch (e) {
            console.error('Follow error:', e);
            apply(was);
        }
    };

    const handleMessage = () => {
        if (!me) { promptSignIn('message people'); return; }
        router.push({
            pathname: `/chat/[id]` as any,
            params: { id, name: profile?.display_name || profile?.username || 'User', userId: id },
        });
    };

    const shareProfile = () => {
        const name = profile?.display_name || profile?.username || 'this creator';
        Share.share({ message: `${name} on Datariot · https://datariot.xyz/user/${id}` }).catch(() => { });
    };

    const openVideo = (video: Video) =>
        router.push({ pathname: '/video-player', params: { type: 'user', userId: id, initialVideoId: video.id } });

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([fetchProfile(), checkFollowing(), refreshPosts?.()]);
            theirs.refresh();
        } finally {
            setTimeout(() => setRefreshing(false), 500);
        }
    };

    const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

    const rows: Row[] = useMemo(() => {
        if (activeTab === 'posts') return posts.map(p => ({ kind: 'post' as const, id: p.id, post: p }));
        return chunk(theirs.videos).map((vs, i) => ({ kind: 'row' as const, id: `row-${i}-${vs[0].id}`, videos: vs }));
    }, [activeTab, posts, theirs.videos]);

    if (missing && !profile) {
        return (
            <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center' }}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <EmptyState icon="person-outline" title="This profile isn't available" body="It may have been removed, or the link is out of date." actionLabel="Go back" onAction={goBack} />
            </View>
        );
    }

    const loadingList = activeTab === 'posts' ? loadingPosts && posts.length === 0 : theirs.loading && theirs.videos.length === 0;
    const empty = loadingList ? (
        <View style={{ paddingVertical: 48 }}><ActivityIndicator color={c.textSecondary} /></View>
    ) : activeTab === 'videos' ? (
        <EmptyState icon="film-outline" title="No videos yet" />
    ) : (
        <EmptyState icon="chatbubbles-outline" title="No debates yet" />
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
                        : <DebateCard item={item.post} onPress={() => router.push(`/debate/${item.post.id}` as any)} />
                }
                ListHeaderComponent={
                    <View>
                        <ProfileHeader
                            profile={profile}
                            isOwn={false}
                            isFollowing={isFollowing}
                            onBack={goBack}
                            onShare={shareProfile}
                            onFollow={handleFollow}
                            onMessage={handleMessage}
                        />
                        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
                        <View style={{ height: 8 }} />
                    </View>
                }
                ListEmptyComponent={empty}
                onEndReached={activeTab === 'posts' ? undefined : theirs.loadMore}
                onEndReachedThreshold={0.6}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.textSecondary} />}
            />
        </View>
    );
}
