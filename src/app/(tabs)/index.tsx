import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Pressable, StatusBar, useWindowDimensions, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CoubClassicFeed } from '@components/VideoFeed/CoubClassicFeed';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { useVideos, FeedType } from '@lib/supabase/hooks/useVideos';
import { useRouter, useIsFocused } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SideMenu } from '../../components/Navigation/SideMenu';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { CommentsModal } from '../../components/VideoFeed/CommentsModal';
import { BlurView } from 'expo-blur';
import { CategoryPills } from '../../components/Discovery/CategoryPills';
import { VIDEO_CATEGORIES } from '../../lib/constants/categories';
import { PulseFeed } from '../../components/VideoFeed/PulseFeed/PulseFeed';
import { MosaicFeed } from '../../components/VideoFeed/MosaicFeed/MosaicFeed';
import { FullScreenVideoModal } from '../../components/VideoFeed/FullScreenVideoModal';
import { DeepDiveModal } from '../../components/VideoFeed/DeepDiveModal';
import { WebFeedHeader, WebFeedViewSwitch } from '../../components/Web/WebFeedHeader';
import { WebRightPanel } from '../../components/Web/WebRightPanel';
import { CuratedFeed, CuratedFeedIntro, FeedOrderSwitch } from '../../components/VideoFeed/CuratedFeed';
import { useCuratedReels } from '../../lib/curated/useCuratedReels';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useNavVisibility } from '../../context/NavVisibilityContext';

type ViewMode = 'classic' | 'mosaic' | 'pulse';

const TABS = [
    { key: 'ai', label: 'Arena' },
    { key: 'trending', label: 'Feed' },
    { key: 'following', label: 'Circle' },
] as const satisfies ReadonlyArray<{ key: FeedType; label: string }>;

const MIN_THREE_COLUMN_WIDTH = 744;

const HomeScreen = () => {
    const router = useRouter();
    const isFocused = useIsFocused();
    const { user } = useAuth();
    const viewerId = user?.is_anonymous ? undefined : user?.id;
    const [feedOrder, setFeedOrder] = useState<'ranked' | 'recent'>('ranked');
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<FeedType>('trending');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>(Platform.OS === 'web' ? 'classic' : 'mosaic');
    const [compactLatest, setCompactLatest] = useState(true);
    const [latestGridFits, setLatestGridFits] = useState(false);
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const { isNavVisible } = useNavVisibility();
    const topBarAnimStyle = useAnimatedStyle(() => ({
        transform: [{
            translateY: withTiming(isNavVisible ? 0 : -140, {
                duration: 250,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            }),
        }],
        opacity: withTiming(isNavVisible ? 1 : 0, {
            duration: 220,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
    }), [isNavVisible]);

    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web' && width > 768; // Web Desktop Mode
    const isLatest = activeTab === 'trending';
    const latestGrid = compactLatest && latestGridFits;

    const {
        videos,
        loading,
        fetchError,
        refresh,
        loadMore,
        toggleLike,
        toggleSave,
        toggleFollow,
    } = useVideos({
        type: activeTab,
        sort: isLatest ? feedOrder : 'recent',
        category: (!isWeb || activeTab === 'trending') ? activeCategory || undefined : undefined,
    });

    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
    const [deepDiveVideo, setDeepDiveVideo] = useState<(typeof videos)[number] | null>(null);
    const [commentsVideoId, setCommentsVideoId] = useState<string | null>(null);
    const [openOptionsOnMount, setOpenOptionsOnMount] = useState(false);
    const curatedReels = useCuratedReels(activeTab === 'trending', activeCategory);

    const handleSelectVideo = (videoId: string) => {
        setOpenOptionsOnMount(false);
        setSelectedVideoId(videoId);
    };
    const handleComment = (videoId: string) => setCommentsVideoId(videoId);
    const handleSave = toggleSave;

    const handleMore = (videoId: string) => {
        setOpenOptionsOnMount(true);
        setSelectedVideoId(videoId);
    };

    if (!isWeb && activeTab !== 'trending' && loading && videos.length === 0) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
            </View>
        );
    }

    const isFeedActive =
        isFocused &&
        selectedVideoId === null &&
        deepDiveVideo === null &&
        commentsVideoId === null;

    const feedPaddingTop = isWeb ? 0 : (activeTab === 'trending' ? insets.top + 104 : insets.top + 58);

    const feed = isLatest ? (
        <CuratedFeed key={isWeb ? activeCategory || 'all' : 'mobile'} videos={videos} reels={curatedReels} fetchError={fetchError} loading={loading} grid={isWeb ? latestGrid : viewMode === 'mosaic'} desktop={isWeb} onRetry={refresh}
            isFocused={isFeedActive} paddingTop={feedPaddingTop} onEndReached={loadMore}
            onSelectNative={handleSelectVideo} onOpenOrvelis={setDeepDiveVideo} viewerId={viewerId}
            feedOrder={feedOrder} onFeedOrder={setFeedOrder} />
    ) : videos.length > 0 ? (
        viewMode === 'mosaic' ? (
            <MosaicFeed
                videos={videos}
                isFocused={isFeedActive}
                onEndReached={loadMore}
                onSelect={handleSelectVideo}
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
                viewerId={viewerId}
                analyticsSurface="feed"
                onSelect={handleSelectVideo}
                paddingTop={feedPaddingTop}
            />
        )
    ) : isWeb ? (
        <View style={styles.webEmpty}>
            {loading ? (
                <ActivityIndicator size="small" color={isDark ? '#D9E4FF' : '#46658B'} />
            ) : (
                <Text style={[styles.webEmptyText, { color: theme.colors.text.secondary }]}>
                    {fetchError ? 'Couldn’t load videos.' : activeTab === 'following' ? 'No videos from creators you follow yet.' : 'No videos in Arena yet.'}
                </Text>
            )}
            {!loading && fetchError && (
                <Pressable accessibilityRole="button" onPress={refresh} style={styles.webRetry}>
                    <Text style={[styles.webEmptyText, { color: isDark ? '#D9E4FF' : '#355C8B' }]}>Try again</Text>
                </Pressable>
            )}
        </View>
    ) : !loading ? (
        <View style={styles.emptyContainer}>
            <BlurView
                intensity={isDark ? 30 : 50}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.emptyCard, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            >
                {isDark && (
                    <LinearGradient
                        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                    />
                )}
                <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <Feather name="radio" size={30} color={theme.colors.primary.DEFAULT} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.bold }]}>
                    NO SIGNAL
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary, fontFamily: MONO }]}>
                    NOTHING IS BROADCASTING ON THIS CHANNEL. CLEAR YOUR FILTERS OR CHECK BACK LATER.
                </Text>
                <Pressable style={[styles.retryButton, { borderColor: theme.colors.primary.DEFAULT }]} onPress={loadMore}>
                    <Text style={[styles.retryText, { color: theme.colors.primary.DEFAULT, fontFamily: MONO }]}>
                        [ RESCAN ]
                    </Text>
                </Pressable>
            </BlurView>
        </View>
    ) : null;

    const modals = (
        <>
            <DeepDiveModal visible={deepDiveVideo !== null} video={deepDiveVideo} onClose={() => setDeepDiveVideo(null)} />
            <CommentsModal
                visible={!!commentsVideoId}
                videoId={commentsVideoId}
                onClose={() => setCommentsVideoId(null)}
            />

            <FullScreenVideoModal
                visible={selectedVideoId !== null}
                videos={videos}
                initialVideoId={selectedVideoId}
                onClose={() => setSelectedVideoId(null)}
                onLike={toggleLike}
                onSave={handleSave}
                openOptionsOnMount={openOptionsOnMount}
                analyticsSurface="feed"
                viewerId={viewerId}
                onEndReached={loadMore}
            />

        </>
    );

    if (isWeb) {
        const showCompanion = isLatest && width >= 1330;
        const selectedTopic = activeCategory || 'All';

        return (
            <View style={[styles.container, styles.webPage, { paddingHorizontal: width >= 1190 ? 36 : 24 }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <WebFeedHeader tabs={TABS} activeTab={activeTab} onTabPress={setActiveTab} isFocused={isFocused} />
                <View style={styles.webBody}>
                    <View style={styles.webFeedColumn}>
                        <View style={[styles.webHeadingRow, isLatest && styles.webIntroRow]}>
                            {isLatest ? <CuratedFeedIntro desktop /> : (
                                <Text accessibilityRole="header" aria-level={1}
                                    style={[styles.webTitle, { color: theme.colors.text.primary }]}>
                                    {activeTab === 'ai' ? 'Arena' : 'Circle'}
                                </Text>
                            )}
                            {(!isLatest || latestGridFits) && (
                                <WebFeedViewSwitch grid={isLatest ? latestGrid : viewMode === 'mosaic'}
                                    onChange={isLatest ? setCompactLatest : grid => setViewMode(grid ? 'mosaic' : 'classic')} />
                            )}
                        </View>
                        {isLatest && (
                            <View style={[styles.webFilters, { gap: 10 }]}>
                                <FeedOrderSwitch value={feedOrder} onChange={setFeedOrder} />
                                <CategoryPills
                                    desktop
                                    categories={['All', ...VIDEO_CATEGORIES]}
                                    activeCategory={selectedTopic}
                                    onCategoryPress={category => setActiveCategory(category === 'All' ? null : category)}
                                />
                            </View>
                        )}
                        <View style={styles.deckBody}
                            onLayout={({ nativeEvent }) => setLatestGridFits(nativeEvent.layout.width >= MIN_THREE_COLUMN_WIDTH)}>
                            {feed}
                        </View>
                    </View>
                    {showCompanion && (
                        <ScrollView style={styles.webCompanion} contentContainerStyle={styles.webCompanionContent}
                            showsVerticalScrollIndicator={false}>
                            <WebRightPanel activeCategory={activeCategory} onSelectCategory={setActiveCategory} />
                        </ScrollView>
                    )}
                </View>
                {modals}
            </View>
        );
    }

    /* ---------------- Mobile: original floating chrome ---------------- */
    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.colors.background.primary : '#F8F9FC' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {feed}

            <Animated.View
                style={[
                    styles.topNav,
                    { paddingTop: insets.top + 8 },
                    topBarAnimStyle,
                ]}
                pointerEvents={isNavVisible ? 'box-none' : 'none'}
            >
                <View style={styles.topNavContent} pointerEvents="box-none">
                    <View style={styles.leftActionsContainer} pointerEvents="box-none">
                        <Pressable
                            style={[
                                styles.roundButton,
                                {
                                    backgroundColor: isDark ? 'rgba(8, 9, 13, 0.65)' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                },
                            ]}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            onPress={() => setIsMenuOpen(true)}
                        >
                            <BlurView pointerEvents="none" intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                            <Feather name="menu" size={22} color={theme.colors.text.primary} />
                        </Pressable>
                    </View>

                    <View style={styles.pillContainer} pointerEvents="box-none">
                        <BlurView
                            intensity={70}
                            tint={isDark ? 'dark' : 'light'}
                            style={[
                                styles.pillBlur,
                                {
                                    backgroundColor: isDark ? 'rgba(8, 9, 13, 0.5)' : '#E5EDF9',
                                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
                                },
                            ]}
                        >
                            {TABS.map((tab) => (
                                <TabButton
                                    key={tab.key}
                                    theme={theme}
                                    label={tab.label.toUpperCase()}
                                    isActive={activeTab === tab.key}
                                    onPress={() => setActiveTab(tab.key as FeedType)}
                                    isDark={isDark}
                                />
                            ))}
                        </BlurView>
                    </View>

                    <View style={styles.rightActionsContainer} pointerEvents="box-none">
                        <Pressable
                            style={[
                                styles.roundButton,
                                {
                                    backgroundColor: isDark ? 'rgba(8, 9, 13, 0.65)' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                    marginRight: 8,
                                },
                            ]}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            onPress={() => setViewMode(viewMode === 'mosaic' ? 'classic' : 'mosaic')}
                        >
                            <BlurView pointerEvents="none" intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                            <Ionicons
                                name={viewMode === 'mosaic' ? 'grid-outline' : 'grid'}
                                size={22}
                                color={theme.colors.text.primary}
                            />
                        </Pressable>

                        <Pressable
                            style={[
                                styles.roundButton,
                                {
                                    backgroundColor: isDark ? 'rgba(8, 9, 13, 0.65)' : 'rgba(255, 255, 255, 0.9)',
                                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                },
                            ]}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            onPress={() => router.push('/(tabs)/profile')}
                        >
                            <BlurView pointerEvents="none" intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                            <Feather name="user" size={22} color={theme.colors.text.primary} />
                        </Pressable>
                    </View>

                    {activeTab === 'trending' && (
                        <View style={styles.categoryFiltersContainer}>
                            <CategoryPills
                                categories={['All', ...VIDEO_CATEGORIES]}
                                activeCategory={activeCategory || 'All'}
                                onCategoryPress={(cat) => setActiveCategory(cat === 'All' ? null : cat)}
                                showFilterLabel={false}
                            />
                        </View>
                    )}
                </View>
            </Animated.View>

            <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {modals}
        </View>
    );
};

const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

const styles = StyleSheet.create({
    webPage: { minWidth: 0, width: '100%' },
    webBody: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 34 },
    webFeedColumn: { flex: 1, minWidth: 0, minHeight: 0 },
    webHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 15, paddingTop: 27, paddingBottom: 17 },
    webIntroRow: { alignItems: 'flex-start', paddingTop: 17, paddingBottom: 12 },
    webTitle: { flexShrink: 1, fontFamily: 'Outfit_600SemiBold', fontSize: 46, lineHeight: 50, letterSpacing: -2.25 },
    webFilters: { paddingBottom: 19 },
    webCompanion: { width: 238, flexGrow: 0, flexShrink: 0 },
    webCompanionContent: { paddingTop: 34, paddingBottom: 24 },
    webEmpty: { alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 140 },
    webEmptyText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
    webRetry: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 16 },

    container: {
        flex: 1,
    },
    deckBody: {
        flex: 1,
    },
    topNav: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        elevation: 20,
    },
    topNavContent: {
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    roundButton: {
        width: 44,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
    },
    leftActionsContainer: {
        width: 44,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    rightActionsContainer: {
        minWidth: 100,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    pillContainer: {
        flex: 1,
        marginHorizontal: 8,
    },
    categoryFiltersContainer: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        height: 48,
    },
    pillBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 30,
        padding: 4,
        overflow: 'hidden',
        borderWidth: 1,
        alignSelf: 'stretch',
    },
    tabButton: {
        flex: 1,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderRadius: 18,
        overflow: 'hidden',
    },
    tabIndicatorBackground: {
        position: 'absolute',
        top: 2,
        bottom: 2,
        left: 2,
        right: 2,
        borderRadius: 16,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0,
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
        maxWidth: 360,
        padding: 32,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        overflow: 'hidden',
    },
    emptyIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 22,
    },
    emptyTitle: {
        fontSize: 18,
        letterSpacing: 2,
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 10.5,
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 18,
        letterSpacing: 1,
    },
    retryButton: {
        paddingHorizontal: 26,
        paddingVertical: 11,
        borderRadius: 8,
        borderWidth: 1,
    },
    retryText: {
        fontSize: 11,
        letterSpacing: 1.6,
        fontWeight: '700',
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
                isHovered && !isActive && {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                },
            ]}
        >
            {isActive && (
                <View style={[StyleSheet.absoluteFill, { padding: 2 }]}>
                    <LinearGradient
                        colors={isDark ? ['#D9E4FF', '#A5C6FF'] : ['#E8F1FF', '#BCD5FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.tabIndicatorBackground}
                    />
                </View>
            )}
            <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                    styles.tabText,
                    { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamilies.medium },
                    isActive && {
                        color: '#10151F',
                        fontFamily: theme.typography.fontFamilies.bold,
                        fontWeight: '800',
                    },
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
};

export default HomeScreen;
