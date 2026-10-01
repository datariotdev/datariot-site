import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Dimensions, StatusBar, Platform, ImageBackground, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { useVideos } from '@lib/supabase/hooks/useVideos';
import { usePosts, Post } from '@lib/supabase/hooks/usePosts';
import { supabase } from '@lib/supabase/client';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { encodeVideoUrl } from '@lib/utils/url';
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, Extrapolation, SharedValue } from 'react-native-reanimated';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { DebateCard } from '@components/Debate/DebateCard';
import { Button } from '@components/UI/Button';
import { pixelClip } from '@design-system/pixel';
import { pageBg } from '@design-system/surface';
import { FONT } from '@design-system/fonts';

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

const { width: WINDOW_WIDTH } = Dimensions.get('window');
// On the web the page is a single centred column, like the profile tab.
const COLUMN_WIDTH = Platform.OS === 'web' ? Math.min(WINDOW_WIDTH, 720) : WINDOW_WIDTH;
const VIDEO_ITEM_WIDTH = (COLUMN_WIDTH - 2) / 3;
const HEADER_HEIGHT = 200;

const StickyHeader = ({ scrollY, user }: { scrollY: SharedValue<number>, user: any }) => {
    const router = useRouter();
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const hairline = isDark ? 'rgba(218, 230, 247, 0.14)' : 'rgba(7, 8, 12, 0.14)';

    const headerStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [160, 240], [0, 1], Extrapolation.CLAMP);
        return { opacity };
    });

    const chip = { backgroundColor: isDark ? 'rgba(8, 9, 13, 0.55)' : 'rgba(255, 255, 255, 0.7)' };

    return (
        <View style={styles.stickyHeaderContainer}>
            <Animated.View
                style={[
                    styles.stickyHeaderBackground,
                    headerStyle,
                    { backgroundColor: isDark ? 'rgba(8, 9, 13, 0.92)' : 'rgba(241, 245, 252, 0.92)', borderBottomColor: hairline },
                ]}
            />
            <SafeAreaView style={styles.stickyHeaderSafeArea}>
                <View style={styles.stickyHeaderContent}>
                    <Pressable style={[styles.iconButton, pixelClip(3), chip]} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={20} color={theme.colors.text.primary} />
                    </Pressable>
                    <Animated.Text style={[styles.stickyUsername, headerStyle, { color: theme.colors.text.primary }]}>
                        @{user?.username || user?.email?.split('@')[0]}
                    </Animated.Text>
                    <Pressable style={[styles.iconButton, pixelClip(3), chip]} onPress={() => { }}>
                        <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text.primary} />
                    </Pressable>
                </View>
            </SafeAreaView>
        </View>
    );
};

const ProfileHeader = ({ profile, user, scrollY, headerImageUrl, activeTab, setActiveTab, isFollowing, onFollow, onMessage }: any) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const hairline = isDark ? 'rgba(218, 230, 247, 0.16)' : 'rgba(7, 8, 12, 0.16)';
    const glass = isDark ? 'rgba(218, 230, 247, 0.04)' : 'rgba(255, 255, 255, 0.6)';
    const mono = { fontFamily: FONT.tech };

    const bannerStyle = useAnimatedStyle(() => {
        const scale = interpolate(scrollY.value, [-100, 0], [1.2, 1], Extrapolation.CLAMP);
        const translateY = interpolate(scrollY.value, [-100, 0], [-50, 0], Extrapolation.CLAMP);
        return {
            transform: [{ scale }, { translateY }],
        };
    });

    const initial = profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
    const stats: [string, number][] = [
        ['FOLLOWERS', profile?.followers_count || 0],
        ['FOLLOWING', profile?.following_count || 0],
        ['VIDEOS', profile?.videos_count || 0],
    ];

    return (
        <View>
            <View style={styles.headerContainer}>
                <Animated.View style={[StyleSheet.absoluteFill, bannerStyle, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
                    <ImageBackground source={{ uri: headerImageUrl }} style={StyleSheet.absoluteFill} />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)' }]} />
                </Animated.View>
            </View>

            <View style={styles.headerContent}>
                <View style={styles.profileTopSection}>
                    <View style={[styles.avatar, pixelClip(8), { borderColor: theme.colors.background.primary, backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        ) : (
                            <Text style={[styles.avatarText, { color: theme.colors.text.primary }]}>{initial}</Text>
                        )}
                    </View>

                    <Text style={[styles.displayName, { color: theme.colors.text.primary }]}>
                        {profile?.display_name || user?.email?.split('@')[0] || 'User'}
                    </Text>
                    <Text style={[styles.username, mono, { color: theme.colors.text.secondary }]}>
                        &gt; @{profile?.username || user?.email?.split('@')[0]}
                    </Text>

                    <View style={[styles.statsPill, pixelClip(4), { backgroundColor: glass, borderColor: hairline }]}>
                        {stats.map(([label, value], i) => (
                            <React.Fragment key={label}>
                                {i > 0 && <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(218, 230, 247, 0.22)' : 'rgba(7, 8, 12, 0.18)' }]} />}
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, mono, { color: theme.colors.text.primary }]}>{value}</Text>
                                    <Text style={[styles.statLabel, mono, { color: theme.colors.text.secondary }]}>{label}</Text>
                                </View>
                            </React.Fragment>
                        ))}
                    </View>

                    <View style={styles.actionButtonsRow}>
                        <Button
                            title={isFollowing ? 'Following' : 'Follow'}
                            variant={isFollowing ? 'secondary' : 'primary'}
                            onPress={onFollow}
                            style={{ flex: 1 }}
                        />
                        <Button title="Message" variant="secondary" onPress={onMessage} style={{ flex: 1 }} />
                    </View>
                </View>

                <View style={styles.bioSection}>
                    <Text style={[styles.bioText, { color: theme.colors.text.secondary }]}>
                        {profile?.bio || 'passionate creator • sharing knowledge • learning every day'}
                    </Text>
                </View>
            </View>

            <View style={[styles.tabsContainer, pixelClip(5), { borderColor: hairline }]}>
                {(['videos', 'posts'] as const).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <Pressable
                            key={tab}
                            style={[
                                styles.tabItem,
                                isActive && [pixelClip(4), {
                                    backgroundColor: isDark ? 'rgba(218, 230, 247, 0.08)' : 'rgba(7, 8, 12, 0.06)',
                                    borderColor: theme.colors.primary.DEFAULT,
                                    borderWidth: 1,
                                }],
                            ]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Ionicons
                                name={tab === 'posts' ? 'infinite-outline' : 'grid-outline'}
                                size={20}
                                color={isActive ? theme.colors.primary.DEFAULT : theme.colors.text.secondary}
                            />
                            {isActive && (
                                <Text style={[styles.tabLabel, mono, { color: theme.colors.primary.DEFAULT }]}>
                                    [ {tab === 'videos' ? 'ESSENCE' : 'THESES'} ]
                                </Text>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

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

const VideoGridItem = ({ item, index, onPress }: { item: any, index: number, onPress: () => void }) => {
    const { mode } = useTheme();
    const isDark = mode === 'dark';

    return (
        <Pressable
            style={[styles.videoGridItem, { backgroundColor: isDark ? '#000000' : '#E4EBF6' }]}
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
                <Text style={styles.viewsText}>{item.likes || 0}</Text>
            </View>
        </Pressable>
    );
};

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user: currentUser } = useAuth(); // Current logged-in user
    const router = useRouter();
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [activeTab, setActiveTab] = useState<'posts' | 'videos'>('videos');
    const [isFollowing, setIsFollowing] = useState(false);

    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const {
        videos,
        loading: loadingVideos,
    } = useVideos({ type: 'user', userId: id });

    const {
        posts,
        loading: loadingPosts,
    } = usePosts(id);

    const renderPostItem = ({ item }: { item: Post }) => (
        <DebateCard item={item} onPress={() => router.push(`/debate/${item.id}`)} />
    );

    const getProfileCoverImage = React.useCallback((userId: string) => {
        let sum = 0;
        for (let i = 0; i < userId.length; i++) {
            sum += userId.charCodeAt(i);
        }
        const seed = sum % 1000;
        return `https://image.pollinations.ai/prompt/futuristic%20neon%20neurorobot%20cyberpunk%20abstract%20background%20${seed}?nologo=true&width=800&height=600&model=flux`;
    }, []);

    const headerImageUrl = React.useMemo(() => {
        if (profile?.banner_url) return profile.banner_url;
        return getProfileCoverImage(id || 'default');
    }, [id, profile?.banner_url, getProfileCoverImage]);

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

            const { count } = await supabase
                .from('videos')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', id);

            if (profileData) {
                setProfile({
                    ...profileData,
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

        // Optimistic update
        setIsFollowing(!isFollowing);

        try {
            if (isFollowing) {
                await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', currentUser.id)
                    .eq('following_id', id);
            } else {
                await supabase
                    .from('follows')
                    .insert({ follower_id: currentUser.id, following_id: id });
            }
        } catch {
            console.error("Follow error");
            setIsFollowing(isFollowing); // Revert
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

    const navigateToVideo = (videoId: string, initialScrollIndex: number) => {
        router.push({
            pathname: '/video-player',
            params: {
                type: 'user',
                userId: id,
                initialVideoId: videoId
            }
        });
    };

    const renderVideoItem = ({ item, index }: { item: any, index: number }) => (
        <VideoGridItem item={item} index={index} onPress={() => navigateToVideo(item.id, index)} />
    );

    const emptyText = (text: string) => (
        <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.colors.text.muted }]}>[ {text} ]</Text>
        </View>
    );

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
                return emptyText('NO VIDEOS YET');
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
                return emptyText('NO THESES YET');
            }
            return null;
        }
        return null;
    };

    return (
        <View style={[styles.container, { backgroundColor: pageBg(theme.colors.background.primary) }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <View style={styles.column}>
                {/* Sticky Header Overlay */}
                <StickyHeader scrollY={scrollY} user={profile} />

                <Animated.FlatList
                    key={activeTab}
                    data={(activeTab === 'videos' ? videos : activeTab === 'posts' ? posts : []) as any}
                    renderItem={(props: any) => activeTab === 'videos' ? renderVideoItem(props) : renderPostItem(props)}
                    keyExtractor={(item) => item.id}
                    numColumns={activeTab === 'videos' ? 3 : 1}
                    contentContainerStyle={styles.flatListContent}
                    ListHeaderComponent={() => (
                        <ProfileHeader
                            profile={profile}
                            user={currentUser}
                            scrollY={scrollY}
                            headerImageUrl={headerImageUrl}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            isFollowing={isFollowing}
                            onFollow={handleFollow}
                            onMessage={handleMessage}
                        />
                    )}
                    ListFooterComponent={renderContent}
                    showsVerticalScrollIndicator={false}
                    columnWrapperStyle={activeTab === 'videos' ? styles.videoColumnWrapper : undefined}
                    removeClippedSubviews={Platform.OS === 'android'}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    initialNumToRender={12}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    style={{ backgroundColor: 'transparent' }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    column: {
        flex: 1,
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center',
    },
    // Sticky Header
    stickyHeaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        borderBottomWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
    },
    stickyHeaderSafeArea: {
        backgroundColor: 'transparent',
    },
    stickyHeaderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        height: 54,
    },
    stickyHeaderBackground: {
        ...StyleSheet.absoluteFillObject,
        borderBottomWidth: 1,
    },
    stickyUsername: {
        fontFamily: FONT.display,
        fontSize: 20,
        letterSpacing: 0.6,
        opacity: 0, // Default hidden
    },
    iconButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Main Content
    flatListContent: {
        paddingTop: 0,
        paddingBottom: 80,
    },
    headerContainer: {
        height: HEADER_HEIGHT,
        overflow: 'hidden',
    },
    headerContent: {
        paddingBottom: 12,
        zIndex: 2,
    },

    // Profile Top Section
    profileTopSection: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: -52, // The avatar overlaps the banner
    },
    avatar: {
        width: 84,
        height: 84,
        ...pixelClip(8),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    avatarText: {
        fontFamily: FONT.display,
        fontSize: 34,
    },
    displayName: {
        fontFamily: FONT.display,
        fontSize: 28,
        letterSpacing: 1,
        textAlign: 'center',
        marginBottom: 2,
    },
    username: {
        fontSize: 13,
        marginBottom: 12,
        opacity: 0.8,
    },

    // Stats
    statsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        marginBottom: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    statValue: {
        fontSize: 15,
        fontWeight: '700',
        marginRight: 6,
    },
    statLabel: {
        fontSize: 9.5,
        letterSpacing: 1.2,
        opacity: 0.8,
    },
    statDivider: {
        width: 1,
        height: 14,
        marginHorizontal: 14,
    },

    // Actions
    actionButtonsRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },

    // Bio
    bioSection: {
        paddingHorizontal: 24,
        marginTop: 14,
        alignItems: 'center',
    },
    bioText: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },

    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 4,
        borderWidth: 1,
        height: 56,
    },
    tabItem: {
        flex: 1,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 2,
    },
    tabLabel: {
        fontSize: 11,
        letterSpacing: 1.2,
    },

    // Grid
    videoColumnWrapper: {
        gap: 1,
    },
    videoGridItem: {
        width: VIDEO_ITEM_WIDTH,
        height: VIDEO_ITEM_WIDTH * 1.3,
        marginBottom: 1,
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
        fontFamily: FONT.tech,
        fontSize: 11,
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
        fontFamily: FONT.tech,
        fontSize: 11,
        letterSpacing: 1.6,
    },
});
