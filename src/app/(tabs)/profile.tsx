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
import { SignalMap } from '../../components/Profile/SignalMap';
import { ProfileTabs } from '../../components/Profile/ProfileTabs';
import { ClipLog, ClipItem } from '../../components/Profile/ClipLog';
import { ThesisRow } from '../../components/Profile/ThesisRow';
import { EmptyDots } from '../../components/UI/EmptyDots';
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

const ProfileHeader = ({ profile, user, scrollY, headerImageUrl, activeTab, setActiveTab, activityDates, counts }: any) => {
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
                {/* Top Profile Section */}
                <View style={styles.profileTopSection}>
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

                    <View style={styles.infoColumn}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.displayName, { color: theme.colors.text.primary }]}>
                                {profile?.display_name || user.email?.split('@')[0] || 'User'}
                            </Text>
                            <Pressable
                                style={styles.iconicEditBtn}
                                onPress={() => router.push('/edit-profile')}
                            >
                                <Ionicons name="create-outline" size={18} color={isDark ? theme.colors.primary.DEFAULT : theme.colors.text.primary} />
                            </Pressable>
                        </View>
                        <Text style={[styles.username, { color: theme.colors.text.secondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                            &gt; @{profile?.username || user.email?.split('@')[0]}
                        </Text>

                        <ProfileStats
                            followers={profile?.followers_count || 0}
                            following={profile?.following_count || 0}
                            arguments={profile?.arguments_count || 0}
                        />
                    </View>
                </View>

                <View style={styles.bioSection}>
                    <Text style={[styles.bioText, { color: theme.colors.text.secondary }]}>
                        {profile?.bio || 'passionate creator • sharing knowledge • learning every day'}
                    </Text>
                </View>
            </View>

            <SignalMap dates={activityDates} />
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
    const [commentDates, setCommentDates] = useState<string[]>([]);
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


    // Everything the user has made, dated, for the activity map
    const activityDates = React.useMemo(
        () => [
            ...videos.map(v => v.createdAt),
            ...posts.map(po => po.createdAt),
            ...commentDates,
        ],
        [videos, posts, commentDates]
    );

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

            // When the user's arguments were made, for the activity map
            const { data: commentRows } = await supabase
                .from('comments')
                .select('created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(400);
            setCommentDates((commentRows || []).map((r: any) => r.created_at).filter(Boolean));

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
                    <EmptyDots
                        glyph="clip"
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
                    <EmptyDots
                        glyph="thesis"
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
                <EmptyDots
                    glyph="vault"
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
                            activityDates={activityDates}
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
    profileTopSection: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.xs,
        marginTop: -60, // Overlap the larger banner
        paddingTop: 0,
    },
    avatarContainer: {
        marginBottom: 8,
        position: 'relative',
    },
    avatar: {
        width: 84,
        height: 84,
        borderRadius: 42,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#D9E4FF',
        borderWidth: 2,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    infoColumn: {
        alignItems: 'center',
        width: '100%',
    },
    nameRow: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    displayName: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 2,
        textAlign: 'center',
        maxWidth: '70%',
    },
    iconicEditBtn: {
        position: 'absolute',
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    username: {
        fontSize: 14,
        marginBottom: 10,
        opacity: 0.7,
    },

    // Bio
    bioSection: {
        paddingHorizontal: theme.spacing.lg,
        marginTop: 4,
        alignItems: 'center',
    },
    bioText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 20,
        marginBottom: 14,
        textAlign: 'center',
    },

    // Compact Stats

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
