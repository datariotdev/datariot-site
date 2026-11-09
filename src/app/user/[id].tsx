import { MobileProfileHeader } from '../../components/Profile/MobileProfileHeader';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, StatusBar, Platform, ImageBackground, Alert, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { useVideos, type Video } from '@lib/supabase/hooks/useVideos';
import { usePosts, Post } from '@lib/supabase/hooks/usePosts';
import { supabase } from '@lib/supabase/client';
import { theme } from '@design-system/theme';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { encodeVideoUrl } from '@lib/utils/url';

interface ProfileData {
    username: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    followers_count: number;
    following_count: number;
    videos_count: number;
}

const PROFILE_MAX_WIDTH = 600;
const GRID_COLUMNS = 3;
const GRID_GAP = 2;

const InternalVideoGridItem = ({ videoUrl }: { videoUrl: string }) => {
    const player = useVideoPlayer(encodeVideoUrl(videoUrl), player => {
        player.muted = true;
        player.loop = false;
        player.pause();
    });

    return (
        <VideoView
            player={player}
            style={styles.videoThumbnail}
            contentFit="cover"
            nativeControls={false}
        />
    );
};

const VideoGridItem = ({ item, size, onPress }: { item: Video; size: number; onPress: () => void }) => {
    return (
        <Pressable
            style={[styles.videoGridItem, { width: size, height: size }]}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={onPress}
        >
            {item.videoUrl ? (
                <InternalVideoGridItem videoUrl={item.videoUrl} />
            ) : (
                <View style={[styles.videoThumbnail, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="videocam-off" size={24} color="rgba(255,255,255,0.1)" />
                </View>
            )}
            <View style={styles.viewsOverlay}>
                <Ionicons name="play-outline" size={12} color="white" />
                <Text style={styles.viewsText}>{item.views || 0}</Text>
            </View>
        </Pressable>
    );
};

export default function UserProfileScreen() {
    const { width: windowWidth } = useWindowDimensions();
    const profileWidth = Platform.OS === 'web' ? Math.min(windowWidth, PROFILE_MAX_WIDTH) : windowWidth;
    const tileSize = Math.floor((profileWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);
    const { theme: activeTheme, mode } = useTheme();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user: currentUser } = useAuth(); // Current logged-in user
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [activeTab, setActiveTab] = useState<'posts' | 'videos'>('videos');
    const [isFollowing, setIsFollowing] = useState(false);
    const followPendingRef = React.useRef(false);
    const [followPending, setFollowPending] = useState(false);

    const {
        videos,
        loading: loadingVideos,
    } = useVideos({ type: 'user', userId: id });

    const {
        posts,
        loading: loadingPosts,
    } = usePosts(id);

    const renderPostItem = ({ item }: { item: Post }) => (
        <View style={styles.postItem}>
            <View style={styles.postHeader}>
                <View style={styles.authorRow}>
                    <View style={styles.postAvatar}>
                        {item.authorAvatar ? (
                            <ImageBackground source={{ uri: item.authorAvatar }} style={{ flex: 1, borderRadius: 20 }} />
                        ) : (
                            <Text style={styles.postAvatarText}>
                                {item.authorName[0].toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <View style={styles.authorInfo}>
                        <Text style={styles.postAuthor}>{item.authorName}</Text>
                        <Text style={styles.postDate}>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.postBody}>
                <Text style={styles.postContent}>{item.content}</Text>
            </View>

            <View style={styles.postFooter}>
                <Pressable style={styles.actionButtonInteraction}>
                    <Text style={{ color: '#D9E4FF', fontSize: 18 }}>✦</Text>
                    <Text style={styles.actionText}>{item.likes || 0}</Text>
                </Pressable>

                <Pressable style={styles.actionButtonInteraction}>
                    <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text.secondary} />
                    <Text style={styles.actionText}>{item.comments || 0}</Text>
                </Pressable>
            </View>
        </View>
    );

    const fetchProfile = React.useCallback(async () => {
        if (!supabase || !id) {
            return;
        }

        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (profileError) throw profileError;

            // console.log('Fetched Profile Data:', JSON.stringify(profileData, null, 2));

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
        } finally {
            // Loading state handled
        }
    }, [id]);

    const checkIfFollowing = React.useCallback(async () => {
        if (!supabase || !currentUser || !id) return;

        const { data } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', id)
            .single();

        if (data) {
            setIsFollowing(true);
        } else {
            setIsFollowing(false);
        }
    }, [currentUser, id]);

    useEffect(() => {
        if (id) {
            fetchProfile();
            checkIfFollowing();
        }
    }, [id, fetchProfile, checkIfFollowing]);

    const handleFollow = async () => {
        if (!currentUser) {
            // Prompt login
            Alert.alert("Sign in", "Please sign in to follow users.");
            return;
        }

        if (currentUser.id === id) return;

        if (!supabase || followPendingRef.current) return;
        followPendingRef.current = true;
        setFollowPending(true);
        const wasFollowing = isFollowing;
        setIsFollowing(!wasFollowing);
        try {
            const result = wasFollowing
                ? await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', id)
                : await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: id });
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
        if (!currentUser) {
            Alert.alert("Sign in", "Please sign in to message users.");
            return;
        }
        router.push({
            pathname: `/chat/[id]` as any,
            params: {
                id: id,
                name: profile?.display_name || profile?.username || 'User',
                userId: id
            }
        });
    };


    const navigateToVideo = (videoId: string) => {
        router.push({
            pathname: '/video-player',
            params: {
                type: 'user',
                userId: id,
                initialVideoId: videoId
            }
        });
    };

    const renderContent = () => {
        if (activeTab === 'videos') {
            if (loadingVideos && videos.length === 0) {
                return (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={theme.colors.primary.DEFAULT} />
                    </View>
                );
            }
            if (!videos || videos.length === 0) {
                return (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyStateText, { color: activeTheme.colors.text.secondary }]}>No videos yet.</Text>
                    </View>
                );
            }
            return null; // FlatList handles data rendering
        }

        if (activeTab === 'posts') {
            if (loadingPosts && posts.length === 0) {
                return (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={theme.colors.primary.DEFAULT} />
                    </View>
                );
            }
            if (posts.length === 0) {
                return (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyStateText, { color: activeTheme.colors.text.secondary }]}>No posts yet.</Text>
                    </View>
                );
            }
            return null;
        }
        return null;
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background.primary }]}>
            <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

            <View style={[styles.profileColumn, { width: profileWidth }]}>
                <FlatList<Video | Post>
                    key={activeTab}
                    data={activeTab === 'videos' ? videos : posts}
                    renderItem={({ item }) => 'authorId' in item
                        ? <VideoGridItem item={item} size={tileSize} onPress={() => navigateToVideo(item.id)} />
                        : renderPostItem({ item })}
                    keyExtractor={(item) => item.id}
                    numColumns={activeTab === 'videos' ? GRID_COLUMNS : 1}
                    contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
                    ListHeaderComponent={(
                        <MobileProfileHeader
                            profile={profile}
                            userId={id}
                            activeTab={activeTab}
                            onTab={setActiveTab}
                            own={currentUser?.id === id}
                            showSaved={false}
                            onEdit={() => router.push('/edit-profile')}
                            onBack={() => router.canGoBack() ? router.back() : router.replace('/')}
                            onFollow={handleFollow}
                            onMessage={handleMessage}
                            isFollowing={isFollowing}
                            followPending={followPending}
                        />
                    )}
                    ListEmptyComponent={renderContent}
                    showsVerticalScrollIndicator={false}
                    columnWrapperStyle={activeTab === 'videos' ? styles.videoColumnWrapper : undefined}
                    removeClippedSubviews={Platform.OS === 'android'}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    initialNumToRender={12}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    profileColumn: {
        flex: 1,
        alignSelf: 'center',
    },
    videoColumnWrapper: {
        gap: GRID_GAP,
    },
    videoGridItem: {
        backgroundColor: 'rgba(128,128,128,0.12)',
        marginBottom: GRID_GAP,
        overflow: 'hidden',
    },
    videoThumbnail: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    viewsOverlay: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewsText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    // Empty & Loading
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        color: theme.colors.text.secondary,
        fontSize: 16,
        marginBottom: 16,
    },

    // Post Item
    postItem: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginBottom: 20,
        borderRadius: 24,
        marginHorizontal: 16,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        paddingBottom: 8,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    postAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    postAvatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    postBody: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    postFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', // Left aligned
        gap: 24, // Consistent spacing
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 8,
    },
    postAuthor: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 2,
    },
    postDate: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        fontWeight: '500',
    },
    authorInfo: {
        marginLeft: 12,
        justifyContent: 'center'
    },
    postContent: {
        color: 'rgba(255,255,255,0.95)',
        fontSize: 15,
        lineHeight: 22,
    },
    actionButtonInteraction: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center'
    },
    actionText: {
        color: theme.colors.text.secondary,
        fontSize: 14,
        fontWeight: '600',
    },
});
