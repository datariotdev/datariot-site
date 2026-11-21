import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MobileProfileHeader } from '../../components/Profile/MobileProfileHeader';
import { ProfileClipCard } from '../../components/Profile/ProfileClipCard';
import { realThumb } from '../../components/VideoFeed/feedMedia';
import { usePalette } from '../../design-system/palette';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { useVideos, type Video } from '@lib/supabase/hooks/useVideos';
import { usePosts, type Post } from '@lib/supabase/hooks/usePosts';
import { supabase } from '@lib/supabase/client';

interface ProfileData {
    username: string;
    display_name: string;
    avatar_url: string | null;
    banner_url: string | null;
    bio: string | null;
    followers_count: number;
    following_count: number;
    videos_count: number;
}

function ClipPreview({ videoUrl }: { videoUrl: string }) {
    const player = useVideoPlayer(videoUrl, player => {
        player.muted = true;
        player.pause();
    });

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
        </View>
    );
}

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    if (!id) return <Redirect href="/" />;
    if (user?.id === id) return <Redirect href="/profile" />;
    return <PublicProfileScreen key={id} id={id} currentUserId={user?.id} />;
}

function PublicProfileScreen({ id, currentUserId }: { id: string; currentUserId?: string }) {
    const { width: windowWidth } = useWindowDimensions();
    const compact = windowWidth <= 768;
    const contentWidth = compact ? windowWidth : Math.min(windowWidth - 64, 1080);
    const columns = contentWidth >= 960 ? 4 : 3;
    const gap = compact ? 3 : 14;
    const gridPadding = compact ? 16 : 0;
    const itemWidth = Math.max(0, (contentWidth - gridPadding * 2 - gap * (columns - 1)) / columns);
    const p = usePalette();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [activeTab, setActiveTab] = useState<'posts' | 'videos'>('videos');
    const [isFollowing, setIsFollowing] = useState(false);
    const followPendingRef = useRef(false);
    const [followPending, setFollowPending] = useState(false);
    const { videos, loading: loadingVideos } = useVideos({ type: 'user', userId: id });
    const { posts, loading: loadingPosts } = usePosts(id);

    const fetchProfile = useCallback(async () => {
        if (!supabase) return;

        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (profileError) throw profileError;

            const { count } = await supabase
                .from('videos')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', id);

            const [followers, following] = await Promise.all([
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
            ]);
            if (profileData) {
                setProfile({
                    ...profileData,
                    followers_count: followers.count ?? profileData.followers_count,
                    following_count: following.count ?? profileData.following_count,
                    videos_count: count || 0
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    }, [id]);

    const checkIfFollowing = useCallback(async () => {
        if (!supabase || !currentUserId) return;

        const { data } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUserId)
            .eq('following_id', id)
            .single();

        if (data) {
            setIsFollowing(true);
        } else {
            setIsFollowing(false);
        }
    }, [currentUserId, id]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        checkIfFollowing();
    }, [checkIfFollowing]);

    const handleFollow = async () => {
        if (!currentUserId) {
            Alert.alert("Sign in", "Please sign in to follow users.");
            return;
        }

        if (!supabase || followPendingRef.current) return;
        followPendingRef.current = true;
        setFollowPending(true);
        const wasFollowing = isFollowing;
        setIsFollowing(!wasFollowing);
        try {
            const result = wasFollowing
                ? await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', id)
                : await supabase.from('follows').insert({ follower_id: currentUserId, following_id: id });
            if (result.error) throw result.error;
            setProfile(previous => previous ? {
                ...previous,
                followers_count: Math.max(0, (previous.followers_count || 0) + (wasFollowing ? -1 : 1)),
            } : previous);
        } catch {
            setIsFollowing(wasFollowing);
            Alert.alert('Couldn’t update follow', 'Please try again.');
        } finally {
            followPendingRef.current = false;
            setFollowPending(false);
        }
    };

    const handleMessage = () => {
        if (!currentUserId) {
            Alert.alert("Sign in", "Please sign in to message users.");
            return;
        }
        router.push({
            pathname: '/chat/[id]',
            params: {
                id,
                name: profile?.display_name || profile?.username || 'User',
                userId: id
            }
        });
    };

    const renderVideo = (item: Video) => {
        const thumbnailUrl = realThumb(item.thumbnailUrl) ?? undefined;
        return (
            <ProfileClipCard
                item={{ ...item, thumbnailUrl }}
                width={itemWidth}
                compact={compact}
                fallback={!thumbnailUrl && item.videoUrl ? <ClipPreview videoUrl={item.videoUrl} /> : undefined}
                onPress={() => router.push({
                    pathname: '/video-player',
                    params: { type: 'user', userId: id, initialVideoId: item.id },
                })}
            />
        );
    };

    const renderPost = (item: Post) => (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open thesis"
            onPress={() => router.push({ pathname: '/debate/[id]', params: { id: item.id } })}
            style={[styles.post, { borderColor: p.border, backgroundColor: p.card }]}
        >
            <Text style={{ color: p.text, fontFamily: p.fonts.regular, fontSize: 16, lineHeight: 23 }}>
                {item.content}
            </Text>
            <Text style={{ color: p.faint, marginTop: 10 }}>
                {item.timestamp} · {item.comments} arguments
            </Text>
        </Pressable>
    );

    const showVideos = activeTab === 'videos';
    const loading = showVideos ? loadingVideos : loadingPosts;
    return (
        <View style={[styles.container, { backgroundColor: p.bg }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <FlatList<Video | Post>
                key={showVideos ? columns : 'posts'}
                data={showVideos ? videos : posts}
                keyExtractor={item => item.id}
                renderItem={({ item }) => 'userId' in item ? renderPost(item) : renderVideo(item)}
                numColumns={showVideos ? columns : 1}
                style={{ width: contentWidth }}
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 40), gap }}
                columnWrapperStyle={showVideos ? { paddingHorizontal: gridPadding, gap } : undefined}
                ListHeaderComponent={
                    <View style={{ marginBottom: 18 - gap }}>
                        <MobileProfileHeader
                            profile={profile}
                            userId={id}
                            activeTab={activeTab}
                            onTab={setActiveTab}
                            onBack={() => router.canGoBack() ? router.back() : router.replace('/')}
                            onFollow={handleFollow}
                            onMessage={handleMessage}
                            isFollowing={isFollowing}
                            followPending={followPending}
                        />
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        {loading ? <ActivityIndicator color={p.accent} /> : (
                            <Text style={{ color: p.sub, fontFamily: p.fonts.regular }}>
                                {showVideos ? 'No clips yet.' : 'No theses yet.'}
                            </Text>
                        )}
                    </View>
                }
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={Platform.OS === 'android'}
                windowSize={5}
                initialNumToRender={12}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center' },
    post: { marginHorizontal: 20, padding: 16, borderRadius: 16, borderWidth: 1 },
    empty: { padding: 40, alignItems: 'center' },
});
