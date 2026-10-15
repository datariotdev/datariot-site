import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, StatusBar, Platform, ImageBackground, Alert, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { useVideos } from '@lib/supabase/hooks/useVideos';
import { usePosts, Post } from '@lib/supabase/hooks/usePosts';
import { supabase } from '@lib/supabase/client';
import { theme } from '@design-system/theme';
import { Ionicons } from '@expo/vector-icons';
import { encodeVideoUrl } from '@lib/utils/url';
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, Extrapolation, SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { ProfileTabs } from '../../components/Profile/ProfileTabs';
import { ClipLog, ClipItem } from '../../components/Profile/ClipLog';
import { ThesisRow } from '../../components/Profile/ThesisRow';
import { EmptyState } from '../../components/UI/EmptyState';
import { ProfileStats } from '../../components/Profile/ProfileStats';
import { AmbientGlow } from '../../components/UI/AmbientGlow';

interface ProfileData {
    username: string;
    display_name: string;
    avatar_url: string | null;
    banner_url: string | null;
    bio: string | null;
    followers_count: number;
    following_count: number;
    videos_count: number;
    arguments_count: number;
}

const HEADER_HEIGHT = 220;

const StickyHeader = ({ scrollY, user, handleSignOut, router }: { scrollY: SharedValue<number>, user: any, handleSignOut: () => void, router: any }) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const headerStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [200, 300], [0, 1], Extrapolation.CLAMP);
        return { opacity };
    });

    return (
        <View style={styles.stickyHeaderContainer}>
            <Animated.View style={[styles.stickyHeaderBackground, headerStyle, { backgroundColor: theme.colors.background.primary }]}>
                <LinearGradient
                    colors={isDark ? ['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.0)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.0)']}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
            <SafeAreaView style={styles.stickyHeaderSafeArea}>
                <View style={styles.stickyHeaderContent}>
                    <Animated.Text style={[styles.stickyUsername, headerStyle, { color: theme.colors.text.primary }]}>
                        @{user?.email?.split('@')[0]}
                    </Animated.Text>
                    <View style={styles.stickyHeaderActions}>
                        <Pressable style={styles.iconButton} onPress={() => router.push('/settings')}>
                            <Ionicons name="reorder-two-outline" size={24} color={theme.colors.text.primary} />
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const ProfileHeader = ({ profile, user, scrollY, headerImageUrl, activeTab, setActiveTab, counts }: any) => {
    const router = useRouter();

    const bannerStyle = useAnimatedStyle(() => {
        // When pulling down (scrollY < 0)
        if (scrollY.value < 0) {
            return {
                transform: [
                    { translateY: scrollY.value / 2 },
                    { scale: 1 - (scrollY.value / HEADER_HEIGHT) }
                ],
            };
        }

        // Normal scroll up parallax
        const translateY = interpolate(scrollY.value, [0, 200], [0, 40], Extrapolation.CLAMP);
        const scale = interpolate(scrollY.value, [0, 200], [1, 1.1], Extrapolation.CLAMP);
        return {
            transform: [{ translateY }, { scale }],
        };
    });

    const bannerOverlayStyle = useAnimatedStyle(() => ({
        opacity: scrollY.value < 0
            ? interpolate(scrollY.value, [-120, 0], [0.35, 0], Extrapolation.CLAMP)
            : 0,
    }));

    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    return (
        <View>
            <View style={styles.headerContainer}>
                <Animated.View style={[StyleSheet.absoluteFill, bannerStyle, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
                    <ImageBackground
                        source={{ uri: headerImageUrl }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)' }]} />
                    {/* Pull-down brightness flash overlay */}
                    <Animated.View style={[StyleSheet.absoluteFill, bannerOverlayStyle, { backgroundColor: 'rgba(255,255,255,0.18)' }]} />
                </Animated.View>
            </View>

            {/* Content Below Banner */}
            <View style={styles.headerContent}>
                <View style={styles.avatarRow}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { overflow: 'hidden', borderColor: theme.colors.background.primary, backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={StyleSheet.absoluteFill} />
                            ) : (
                                <Text style={[styles.avatarText, { color: theme.colors.text.primary }]}>
                                    {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0].toUpperCase() || 'U'}
                                </Text>
                            )}
                        </View>
                        {/* Status Dot */}
                        <View style={[styles.onlineDot, { borderColor: theme.colors.background.primary }]} />
                    </View>

                    <Pressable
                        onPress={() => router.push('/edit-profile')}
                        style={({ pressed }) => [
                            styles.editBtn,
                            { borderColor: isDark ? 'rgba(218, 230, 247, 0.22)' : 'rgba(7, 8, 12, 0.16)' },
                            pressed && { opacity: 0.7 },
                        ]}
                    >
                        <Ionicons name="create-outline" size={15} color={theme.colors.text.primary} />
                        <Text style={[styles.editText, { color: theme.colors.text.primary }]}>Edit profile</Text>
                    </Pressable>
                </View>

                <View style={styles.infoColumn}>
                    <Text style={[styles.displayName, { color: theme.colors.text.primary }]} numberOfLines={1}>
                        {profile?.display_name || user.email?.split('@')[0] || 'User'}
                    </Text>

                    {/* The handle as a small tag: the @ in its own little disc */}
                    <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(218, 230, 247, 0.08)' : 'rgba(7, 8, 12, 0.05)' }]}>
                        <View style={[styles.handleAt, { backgroundColor: isDark ? '#DAE6F7' : '#07080C' }]}>
                            <Text style={[styles.handleAtText, { color: isDark ? '#07080C' : '#DAE6F7' }]}>@</Text>
                        </View>
                        <Text style={[styles.handleText, { color: theme.colors.text.primary }]} numberOfLines={1}>
                            {profile?.username || user.email?.split('@')[0]}
                        </Text>
                    </View>

                    <Text style={[styles.bioText, { color: theme.colors.text.secondary }]}>
                        {profile?.bio || 'passionate creator • sharing knowledge • learning every day'}
                    </Text>

                    <ProfileStats
                        followers={profile?.followers_count || 0}
                        following={profile?.following_count || 0}
                        arguments={profile?.arguments_count || 0}
                    />
                </View>
            </View>

            <ProfileTabs active={activeTab} onChange={setActiveTab} counts={counts} />
        </View>
    );
};

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'saved'>('videos');
    const [savedItems, setSavedItems] = useState<ClipItem[]>([]);
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const {
        videos,
        loading: loadingVideos,
        loadMore: loadMoreVideos,
    } = useVideos({ type: 'user', userId: user?.id });

    const {
        posts,
        loading: loadingPosts,
        refresh: refreshPosts,
        deletePost
    } = usePosts(user?.id);

    // ...

    const handleDeletePost = (postId: string) => {
        Alert.alert(
            "Delete Post",
            "Are you sure you want to delete this post?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deletePost(postId);
                        } catch (e) {
                            Alert.alert("Error", "Could not delete post.");
                        }
                    }
                }
            ]
        );
    };

    // ...

    const renderPostItem = ({ item, index }: { item: Post; index: number }) => (
        <ThesisRow
            item={item}
            index={index}
            onDelete={item.userId === user?.id ? () => handleDeletePost(item.id) : undefined}
            onPress={() => router.push(`/debate/${item.id}`)}
        />
    );

    const getProfileCoverImage = React.useCallback((userId: string) => {
        let sum = 0;
        for (let i = 0; i < userId.length; i++) {
            sum += userId.charCodeAt(i);
        }
        const seed = sum % 1000;
        // Use a much faster and reliable placeholder service for the banner
        return `https://picsum.photos/seed/${seed}/800/600`;
    }, []);

    const headerImageUrl = React.useMemo(() => {
        if (profile?.banner_url) return profile.banner_url;
        return getProfileCoverImage(user?.id || 'default');
    }, [user?.id, profile?.banner_url, getProfileCoverImage]);


    const counts = {
        videos: profile?.videos_count ?? videos.length,
        posts: posts.length,
        saved: savedItems.length,
    };

    useFocusEffect(
        React.useCallback(() => {
            if (user) {
                fetchProfile();
                fetchSaved();
            }
        }, [user])
    );

    // Clips the user bookmarked, newest first
    const fetchSaved = async () => {
        if (!supabase || !user) return;
        try {
            const { data: rows } = await supabase
                .from('save_actions')
                .select('video_id, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(60);
            const ids = (rows || []).map((r: any) => r.video_id).filter(Boolean);
            if (ids.length === 0) {
                setSavedItems([]);
                return;
            }
            const { data: vids } = await supabase.from('videos').select('*').in('id', ids);
            const byId = new Map((vids || []).map((v: any) => [v.id, v]));
            setSavedItems(
                ids
                    .map((id: string) => byId.get(id))
                    .filter(Boolean)
                    .map((v: any) => ({
                        id: v.id,
                        title: v.title,
                        videoUrl: encodeVideoUrl(v.url || v.s3_url) || undefined,
                        thumbnailUrl: v.thumbnail_url || undefined,
                        category: v.category,
                        views: v.views_count || v.views || 0,
                        duration: Number(v.duration) > 0 ? Number(v.duration) : undefined,
                        createdAt: v.created_at,
                    }))
            );
        } catch (e) {
            console.error('Error fetching saved clips:', e);
        }
    };

    const fetchProfile = async () => {
        if (!supabase || !user) {
            setLoadingProfile(false);
            return;
        }

        try {
            setLoadingProfile(true);
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            // Fetch counts
            const { count: videoCount } = await supabase
                .from('videos')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            const { count: argumentCount } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            if (profileData) {
                setProfile({
                    ...profileData,
                    videos_count: videoCount || 0,
                    arguments_count: argumentCount || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace('/auth/login');
    };

    if (!user) {
        return (
            <SafeAreaView>
                <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
                    <View style={styles.authPrompt}>
                        <Ionicons name="person-circle-outline" size={80} color={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'} style={{ marginBottom: 16 }} />
                        <Text style={[styles.authTitle, { color: theme.colors.text.primary }]}>Welcome to Orvelis</Text>
                        <Text style={[styles.authSubtitle, { color: theme.colors.text.secondary }]}>
                            Sign in to create and save content
                        </Text>
                        <Pressable
                            onPress={() => router.push('/auth/login')}
                            style={styles.authSignInWrapper}
                        >
                            <LinearGradient
                                colors={['#D9E4FF', '#D9E4FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.authSignInGradient}
                            >
                                <Text style={styles.authSignInText}>Sign In</Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    const openVideo = (videoId: string) => {
        router.push({
            pathname: '/video-player',
            params: { type: 'user', userId: user?.id, initialVideoId: videoId }
        });
    };

    const clipItems: ClipItem[] = videos.map(v => ({
        id: v.id,
        title: v.title,
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        category: v.category,
        views: v.views,
        duration: v.duration,
        createdAt: v.createdAt,
    }));

    const renderContent = () => {
        if (activeTab === 'videos') {
            if (loadingVideos && videos.length === 0) {
                return (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={theme.colors.primary.DEFAULT} />
                    </View>
                );
            }
            if (videos.length === 0) {
                return (
                    <EmptyState
                        icon="videocam-outline"
                        title="No clips yet"
                        sub="Share your first video and it lands here."
                        cta="Create"
                        onCta={() => router.push('/create')}
                    />
                );
            }
            return <ClipLog items={clipItems} onPress={openVideo} />;
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
                    <EmptyState
                        icon="chatbubbles-outline"
                        title="No theses yet"
                        sub="Put a claim out there and let people argue it."
                        cta="Propose a thesis"
                        onCta={() => router.push('/create')}
                    />
                );
            }
            // The theses themselves are the FlatList rows below the header
            return <View style={{ height: 18 }} />;
        }

        if (savedItems.length === 0) {
            return (
                <EmptyState
                    icon="bookmark-outline"
                    title="The vault is empty"
                    sub="Clips you bookmark will rest here."
                />
            );
        }
        return <ClipLog items={savedItems} onPress={openVideo} />;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <AmbientGlow color={isDark ? "rgba(217, 228, 255, 0.08)" : "rgba(217, 228, 255, 0.04)"} size={400} opacity={0.6} duration={25000} delay={0} />
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Sticky Header Overlay */}
            <StickyHeader scrollY={scrollY} user={user} handleSignOut={handleSignOut} router={router} />

            <Animated.FlatList
                key={activeTab}
                data={(activeTab === 'posts' ? posts : []) as any}
                renderItem={(props: any) => renderPostItem(props)}
                keyExtractor={(item) => item.id}
                numColumns={1}
                contentContainerStyle={styles.flatListContent}
                ListHeaderComponent={() => (
                    <>
                        <ProfileHeader
                            profile={profile}
                            user={user}
                            scrollY={scrollY}
                            headerImageUrl={headerImageUrl}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            counts={counts}
                        />
                        {renderContent()}
                    </>
                )}
                onEndReached={() => {
                    if (activeTab === 'videos') loadMoreVideos();
                }}
                onEndReachedThreshold={0.6}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={Platform.OS === 'android'}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={12}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                bounces={true}
                alwaysBounceVertical={true}
                overScrollMode="always"
                style={{ backgroundColor: 'transparent' }}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Sticky Header
    stickyHeaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        borderBottomWidth: 0, // Explicitly 0
        elevation: 0, // No shadow
        shadowOpacity: 0,
    },
    stickyHeaderSafeArea: {
        backgroundColor: 'transparent',
    },
    stickyHeaderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 10,
        height: 50,
    },
    stickyHeaderActions: {
        flexDirection: 'row',
        gap: 16,
    },
    stickyHeaderBackground: {
        ...StyleSheet.absoluteFillObject,
        borderBottomWidth: 1,
    },
    stickyUsername: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        opacity: 0, // Default hidden
    },
    iconButton: {
        padding: 4,
    },

    // Main Content
    flatListContent: {
        paddingTop: 0, // Content starts at top for seamless header
        paddingBottom: 130, // clear of the floating tab bar
    },
    headerContainer: {
        height: HEADER_HEIGHT,
        zIndex: 1,
    },
    headerContent: {
        paddingBottom: theme.spacing.md,
        zIndex: 2,
        backgroundColor: 'transparent',
    },

    // Profile Top Section
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: -46, // Overlap the banner
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 92,
        height: 92,
        borderRadius: 46,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#D9E4FF',
        borderWidth: 3,
    },
    avatarText: {
        fontSize: 34,
        fontFamily: 'Outfit_700Bold',
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 6,
    },
    editText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 13.5,
    },
    infoColumn: {
        paddingHorizontal: 20,
        marginTop: 12,
        alignItems: 'flex-start',
    },
    displayName: {
        fontFamily: 'Outfit_800ExtraBold',
        fontSize: 27,
        letterSpacing: -0.7,
        maxWidth: '100%',
    },
    handle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        height: 28,
        paddingLeft: 4,
        paddingRight: 12,
        borderRadius: 14,
        marginTop: 6,
        maxWidth: '100%',
    },
    handleAt: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    handleAtText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 12,
        marginTop: -1,
    },
    handleText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 14,
        flexShrink: 1,
    },
    bioText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 15,
        lineHeight: 21,
        marginTop: 12,
    },

    // Empty & Loading
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    authPrompt: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    authTitle: {
        fontSize: theme.typography.sizes['3xl'],
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    authSubtitle: {
        fontSize: theme.typography.sizes.base,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    authSignInWrapper: {
        width: '100%',
        maxWidth: 300,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 18,
        elevation: 12,
    },
    authSignInGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
        backgroundColor: '#D9E4FF',
    },
    authSignInText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

});
