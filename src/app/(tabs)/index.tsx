import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Pressable, StatusBar, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
// Premium style upgrade — gradient tabs, glass nav
import { CoubClassicFeed } from '@components/VideoFeed/CoubClassicFeed';
import { useVideos, FeedType } from '@lib/supabase/hooks/useVideos';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SideMenu } from '../../components/Navigation/SideMenu';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { CommentsModal } from '../../components/VideoFeed/CommentsModal';
import { BlurView } from 'expo-blur';
import { CategoryPills } from '../../components/Discovery/CategoryPills';
import { VIDEO_CATEGORIES } from '../../lib/constants/categories';
import { PulseFeed } from '../../components/VideoFeed/PulseFeed/PulseFeed';
import { MosaicFeed } from '../../components/VideoFeed/MosaicFeed/MosaicFeed';
import { FullScreenVideoModal } from '../../components/VideoFeed/FullScreenVideoModal';
import { DeepDiveModal } from '../../components/VideoFeed/DeepDiveModal';
import { MoreOptionsModal } from '../../components/VideoFeed/MoreOptionsModal';

type ViewMode = 'classic' | 'mosaic' | 'pulse';

const HomeScreen = () => {
    // Auth state managed by components that need it
    const router = useRouter();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<FeedType>('trending');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>(Platform.OS === 'web' ? 'classic' : 'mosaic');
    const { theme, mode, toggleTheme } = useTheme();
    const isDark = mode === 'dark';

    const { width, height } = useWindowDimensions();
    const isWeb = Platform.OS === 'web' && width > 768; // Web Desktop Mode

    // web container height handled elsewhere

    const {
        videos,
        loading,
        loadMore,
        toggleLike,
        toggleFollow
    } = useVideos({
        type: activeTab,
        category: activeCategory || undefined
    });

    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
    const [commentsVideoId, setCommentsVideoId] = useState<string | null>(null);
    const [deepDiveVideo, setDeepDiveVideo] = useState<any | null>(null);
    const [moreOptionsVideo, setMoreOptionsVideo] = useState<any | null>(null);

    const handleSelectVideo = (videoId: string) => {
        setSelectedVideoId(videoId);
    };

    const handleComment = (videoId: string) => {
        setCommentsVideoId(videoId);
    };

    const handleSave = (videoId: string) => {
        console.log('Save:', videoId);
    };

    const handleMore = (videoId: string) => {
        const vid = videos.find(v => v.id === videoId);
        if (vid) {
            setMoreOptionsVideo(vid);
        }
    };

    if (loading && videos.length === 0) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
                <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
            </View>
        );
    }

    const feedPaddingTop = isWeb
        ? (activeTab === 'trending' ? 120 : 70)
        : (activeTab === 'trending' ? insets.top + 120 : insets.top + 64);

    const isFeedActive = isFocused && selectedVideoId === null && commentsVideoId === null && deepDiveVideo === null && moreOptionsVideo === null;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Top Navigation Tabs */}
            <View style={[styles.topNav, { paddingTop: isWeb ? 20 : insets.top + 10 }]} pointerEvents="box-none">
                <View style={styles.topNavContent} pointerEvents="box-none">
                    {/* Left Actions Container */}
                    <View style={styles.leftActionsContainer}>
                        {!isWeb && (
                            <Pressable
                                style={[
                                    styles.profileButton,
                                    {
                                        backgroundColor: isDark ? 'rgba(8, 9, 13, 0.65)' : 'rgba(255, 255, 255, 0.9)',
                                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                        borderWidth: 1,
                                    }
                                ]}
                                onPress={() => setIsMenuOpen(true)}
                            >
                                <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                                <Feather name="menu" size={22} color={theme.colors.text.primary} />
                            </Pressable>
                        )}
                    </View>

                    {/* Center Tabs Container */}
                    <View style={styles.pillContainer}>
                        <BlurView intensity={70} tint={isDark ? 'dark' : 'light'} style={[
                            styles.pillBlur,
                            {
                                backgroundColor: isDark ? 'rgba(8, 9, 13, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
                                alignSelf: 'stretch',
                            }
                        ]}>
                            {isDark && (
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.03)' }]} />
                            )}

                            <TabButton
                                theme={theme}
                                label="ARENA (BETA)"
                                isActive={activeTab === 'ai'}
                                onPress={() => setActiveTab('ai')}
                                isDark={isDark}
                            />

                            <TabButton
                                theme={theme}
                                label="FEED"
                                isActive={activeTab === 'trending'}
                                onPress={() => setActiveTab('trending')}
                                isDark={isDark}
                            />

                            <TabButton
                                theme={theme}
                                label="MY CIRCLE"
                                isActive={activeTab === 'following'}
                                onPress={() => setActiveTab('following')}
                                isDark={isDark}
                            />
                        </BlurView>
                    </View>


                    {/* Right Actions Container */}
                    <View style={[styles.rightActionsContainer, { width: isWeb ? 96 : 148 }]}>
                        <Pressable
                            style={[
                                styles.pulseToggle,
                                {
                                    backgroundColor: viewMode === 'mosaic' ? theme.colors.primary.DEFAULT : (isDark ? 'rgba(8, 9, 13, 0.65)' : 'rgba(255, 255, 255, 0.9)'),
                                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                    borderWidth: 1,
                                },
                                viewMode === 'mosaic' && isDark && {
                                    shadowColor: '#D9E4FF',
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 10,
                                },
                            ]}
                            onPress={() => setViewMode(viewMode === 'mosaic' ? 'classic' : 'mosaic')}
                        >
                            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                            <Ionicons
                                name={viewMode === 'mosaic' ? "grid" : "apps"}
                                size={22}
                                color={viewMode === 'mosaic' ? "#000" : theme.colors.text.primary}
                            />
                        </Pressable>

                        <Pressable
                            style={[
                                styles.pulseToggle,
                                {
                                    backgroundColor: isDark ? 'rgba(8, 9, 13, 0.65)' : 'rgba(255, 255, 255, 0.9)',
                                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                    borderWidth: 1,
                                }
                            ]}
                            onPress={toggleTheme}
                        >
                            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                            <Feather name={isDark ? "sun" : "moon"} size={22} color={theme.colors.text.primary} />
                        </Pressable>

                        {!isWeb && (
                            <Pressable
                                style={[
                                    styles.profileButton,
                                    {
                                        backgroundColor: isDark ? 'rgba(8, 9, 13, 0.65)' : 'rgba(255, 255, 255, 0.9)',
                                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                        borderWidth: 1,
                                    }
                                ]}
                                onPress={() => router.push('/profile')}
                            >
                                <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                                <Feather name="user" size={22} color={theme.colors.text.primary} />
                            </Pressable>
                        )}
                    </View>

                    {/* Category Filters. The row bleeds 16px past the nav
                        padding on both sides; it used to take the window width,
                        which overflowed the feed column by ~650px on a wide
                        screen and put a horizontal scrollbar on the page. */}
                    {activeTab === 'trending' && (
                        <View style={[styles.categoryFiltersContainer, { left: -16, right: -16 }]}>
                            <CategoryPills
                                categories={['All', ...VIDEO_CATEGORIES]}
                                activeCategory={activeCategory || 'All'}
                                onCategoryPress={(cat) => setActiveCategory(cat === 'All' ? null : cat)}
                            />
                        </View>
                    )}
                </View>
            </View>

            {/* Video Feed */}
            {videos.length > 0 ? (
                viewMode === 'mosaic' ? (
                    <MosaicFeed
                        videos={videos}
                        isFocused={isFeedActive}
                        onEndReached={loadMore}
                        onSelect={(id) => {
                            // Find the video and open modal
                            // For now, it opens the existing FullScreenVideoModal pattern
                            // We can use a router push or a modal state
                            console.log('Selected video:', id);
                            // We need a way to open the modal from here. 
                            // CoubClassicFeed uses local state selectedVideoId.
                            // I'll add handleSelectVideo to HomeScreen.
                            handleSelectVideo(id);
                        }}
                        paddingTop={feedPaddingTop}
                    />
                ) : viewMode === 'pulse' ? (
                    <PulseFeed
                        videos={videos}
                        isFocused={isFeedActive}
                        onLike={toggleLike}
                        onComment={handleComment}
                        onSave={handleSave}
                        onMore={handleMore}
                        onFollow={toggleFollow}
                    />
                ) : (
                    <CoubClassicFeed
                        videos={videos}
                        isScreenFocused={isFeedActive}
                        onEndReached={loadMore}
                        onLike={toggleLike}
                        onComment={handleComment}
                        onSave={handleSave}
                        onMore={handleMore}
                        onFollow={toggleFollow}
                        onSelect={handleSelectVideo}
                        paddingTop={feedPaddingTop}
                    />
                )
            ) : !loading && (
                <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background.primary }]}>
                    <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={[styles.emptyCard, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        {isDark && (
                            <LinearGradient
                                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                                style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
                            />
                        )}
                        <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                            <Feather name="video-off" size={36} color={isDark ? '#fff' : '#000'} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.bold }]}>No Videos Found</Text>
                        <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamilies.regular }]}>
                            There doesn&apos;t seem to be anything here right now. Check back later or clear your filters.
                        </Text>
                        <Pressable style={[styles.retryButtonModern, { backgroundColor: theme.colors.primary.DEFAULT }]} onPress={loadMore}>
                            <Text style={[styles.retryTextModern, { fontFamily: theme.typography.fontFamilies.bold }]}>Refresh Feed</Text>
                        </Pressable>
                    </BlurView>
                </View>
            )
            }

            {/* Side Menu Overlay */}
            {
                !isWeb && (
                    <SideMenu
                        isOpen={isMenuOpen}
                        onClose={() => setIsMenuOpen(false)}
                    />
                )
            }

            {/* Comments Modal */}
            <CommentsModal
                visible={!!commentsVideoId}
                videoId={commentsVideoId}
                onClose={() => setCommentsVideoId(null)}
            />

            {/* Shared Full Screen Video Modal (for Mosaic/Pulse) */}
            <FullScreenVideoModal
                visible={selectedVideoId !== null}
                videos={videos}
                initialVideoId={selectedVideoId}
                onClose={() => setSelectedVideoId(null)}
                onLike={toggleLike}
                onComment={handleComment}
                onSave={handleSave}
                onMore={handleMore}
                onFollow={toggleFollow}
            />

            <MoreOptionsModal
                visible={moreOptionsVideo !== null}
                onClose={() => setMoreOptionsVideo(null)}
                onDeepDive={() => {
                    setDeepDiveVideo(moreOptionsVideo);
                }}
            />
            <DeepDiveModal
                visible={deepDiveVideo !== null}
                video={deepDiveVideo}
                onClose={() => setDeepDiveVideo(null)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topNav: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    topNavContent: {
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
        marginBottom: 10,
    },
    profileButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    leftActionsContainer: {
        width: 44,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    rightActionsContainer: {
        width: 148,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    pulseToggle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginRight: 8,
    },
    pillContainer: {
        flex: 1,
        marginHorizontal: 8,
    },
    categoryFiltersContainer: {
        position: 'absolute',
        top: 54,
        height: 58,
    },
    pillBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(8, 9, 13, 0.5)',
        borderRadius: 30,
        padding: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        alignSelf: 'stretch',
    },
    tabButton: {
        flex: 1,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderRadius: 18,
        overflow: 'hidden',
    },
    tabButtonActive: {
        // Active styles handled by children
    },
    tabIndicatorBackground: {
        position: 'absolute',
        top: 2,
        bottom: 2,
        left: 2,
        right: 2,
        borderRadius: 16,
    },
    tabButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    tabTextActive: {
        fontWeight: '800',
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyCard: {
        width: '100%',
        maxWidth: 340,
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        overflow: 'hidden',
    },
    emptyIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    retryButtonModern: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    retryTextModern: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

const TabButton = ({ theme, label, isActive, onPress, isDark }: any) => {
    const [isHovered, setIsHovered] = React.useState(false);
    return (
        <Pressable
            onPress={onPress}
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
            style={[
                styles.tabButton,
                isActive && styles.tabButtonActive,
                isHovered && !isActive && {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                }
            ]}
        >
            {isActive && (
                <View style={[StyleSheet.absoluteFill, { padding: 2 }]}>
                    <LinearGradient
                        colors={isDark ? ['#D9E4FF', '#A5C6FF'] : ['#6B7FCC', '#99B4FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.tabIndicatorBackground, isDark && {
                            shadowColor: '#D9E4FF',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 8,
                        }]}
                    />
                </View>
            )}
            <View style={styles.tabButtonInner}>
                <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                        styles.tabText,
                        { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamilies.medium },
                        isActive && [
                            styles.tabTextActive,
                            {
                                color: isDark ? '#000000' : '#FFFFFF',
                                fontFamily: theme.typography.fontFamilies.bold
                            }
                        ]
                    ]}
                >
                    {label}
                </Text>
            </View>
        </Pressable>
    );
};

export default HomeScreen;
