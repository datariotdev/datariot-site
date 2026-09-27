import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, useWindowDimensions, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@design-system/theme';
import { encodeVideoUrl } from '@lib/utils/url';
import { Video, ResizeMode } from 'expo-av';
import { EdgeFade } from './EdgeFade';

interface FeaturedVideo {
    id: string;
    title: string;
    author: string;
    avatarUrl: string;
    videoUrl: string;
    thumbnailUrl?: string; // Added thumbnail support
    views: number;
    likes: number;
}

interface FeaturedHeroProps {
    featuredVideos: FeaturedVideo[];
    onVideoPress: (videoId: string) => void;
}

const FeaturedVideoPlayer = ({ videoUrl, isCurrent }: { videoUrl: string, isCurrent: boolean }) => {
    const videoRef = React.useRef<Video>(null);

    return (
        <Video
            ref={videoRef}
            source={{ uri: encodeVideoUrl(videoUrl) || '' }}
            style={[styles.video, StyleSheet.absoluteFill, { opacity: isCurrent ? 1 : 0 }]}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isCurrent}
            isLooping
            isMuted={true}
        />
    );
};

export const FeaturedHero = ({ featuredVideos, onVideoPress }: FeaturedHeroProps) => {
    const { width: screenWidth } = useWindowDimensions();
    const isWeb = Platform.OS === 'web' && screenWidth > 768;

    // Measure the real column instead of guessing from the viewport — the deck
    // width now depends on whether the instrument dock is mounted.
    const [measuredWidth, setMeasuredWidth] = useState(0);
    const containerWidth = isWeb ? (measuredWidth || screenWidth - 460) : screenWidth;
    const cardWidth = isWeb ? Math.max(200, (containerWidth - 32) / 3) : containerWidth;
    const cardHeight = isWeb ? cardWidth * 0.78 : cardWidth;
    const scrollInterval = isWeb ? cardWidth + 16 : cardWidth;

    const [currentIndex, setCurrentIndex] = useState(0);

    const renderFeaturedItem = (item: FeaturedVideo, index: number) => {
        const isCurrent = index === currentIndex;

        // Scale down fonts and padding for smaller web cards
        const cardPadding = isWeb ? 12 : 24;
        const titleSize = isWeb ? 14 : 24;
        const titleLineHeight = isWeb ? 18 : 30;
        const authorSize = isWeb ? 11 : 14;
        const badgeTopLeft = isWeb ? 10 : 20;
        const badgePadX = isWeb ? 8 : 10;
        const badgePadY = isWeb ? 4 : 6;
        const badgeFontSize = isWeb ? 8 : 9;
        const vsSize = isWeb ? 36 : 60;

        return (
            <Pressable
                onPress={() => onVideoPress(item.id)}
                style={[
                    styles.heroContainer,
                    {
                        width: cardWidth,
                        height: cardHeight,
                        marginRight: isWeb ? 16 : 0,
                    }
                ]}
            >
                <View style={styles.videoContainer}>
                    <Image
                        source={{ uri: item.thumbnailUrl || item.avatarUrl }} // Fallback to avatar if no thumbnail
                        style={styles.video}
                        resizeMode="cover"
                        // @ts-ignore
                        crossOrigin="anonymous"
                    />

                    {item.videoUrl ? (
                        <FeaturedVideoPlayer videoUrl={item.videoUrl} isCurrent={isCurrent} />
                    ) : null}

                    {/* Simple Overlay */}
                    <View style={styles.overlay}>
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
                            locations={[0, 0.6, 1]}
                            style={StyleSheet.absoluteFill}
                        />

                        {/* Info Card */}
                        <View style={[styles.infoCard, { padding: cardPadding }]}>
                            <View style={styles.infoContent}>
                                <Text style={[styles.authorName, { fontSize: authorSize }]}>
                                    {item.author ? `> @${item.author.toUpperCase()}` : ''}
                                </Text>
                                <Text style={[styles.title, { fontSize: titleSize, lineHeight: titleLineHeight }]} numberOfLines={2}>
                                    {item.title ? item.title.toUpperCase() : ''}
                                </Text>

                                <View style={[styles.statsRow, isWeb && { gap: 6 }]}>
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statLabel, isWeb && { fontSize: 8 }]}>SPECTATORS</Text>
                                        <Text style={[styles.statText, isWeb && { fontSize: 10 }]}>{formatNumber(item.views)}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statLabel, isWeb && { fontSize: 8 }]}>VOTES</Text>
                                        <Text style={[styles.statText, isWeb && { fontSize: 10 }]}>{formatNumber(item.likes)}</Text>
                                    </View>
                                </View>
                            </View>

                            {item.title.toLowerCase().includes('vs') && (
                                <View style={[
                                    styles.vsContainer,
                                    isWeb && {
                                        width: vsSize,
                                        height: vsSize,
                                        borderRadius: vsSize / 2,
                                        marginLeft: -vsSize / 2,
                                        top: '40%',
                                    }
                                ]}>
                                    <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
                                    <Text style={[styles.vsText, isWeb && { fontSize: 12 }]}>VS</Text>
                                </View>
                            )}

                        </View>

                        {/* Popular Badge */}
                        <View style={[
                            styles.trendingBadge,
                            isWeb && {
                                top: badgeTopLeft,
                                left: badgeTopLeft,
                                paddingHorizontal: badgePadX,
                                paddingVertical: badgePadY,
                            }
                        ]}>
                            <Text style={[styles.badgeText, isWeb && { fontSize: badgeFontSize }]}>[ LIVE_DEBATE ]</Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        );
    };

    const handleScrollEnd = React.useCallback((e: any) => {
        const xOffset = e.nativeEvent.contentOffset.x;
        const index = Math.round(xOffset / scrollInterval);
        if (index !== currentIndex) {
            setCurrentIndex(index);
        }
    }, [scrollInterval, currentIndex]);

    return (
        <View
            style={[styles.container, { paddingHorizontal: 0 }]}
            onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w && Math.abs(w - measuredWidth) > 1) setMeasuredWidth(w);
            }}
        >
            <ScrollView
                horizontal
                pagingEnabled={!isWeb}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                onMomentumScrollEnd={handleScrollEnd}
                scrollEventThrottle={16}
                snapToInterval={scrollInterval}
                snapToAlignment="start"
                decelerationRate="fast"
            >
                {featuredVideos.map((item, index) => (
                    <React.Fragment key={`${item.id}-${index}`}>
                        {renderFeaturedItem(item, index)}
                    </React.Fragment>
                ))}
            </ScrollView>

            {isWeb && <EdgeFade />}

            {/* Pagination Dots - Square */}
            {!isWeb && featuredVideos.length > 1 && (
                <View style={styles.pagination}>
                    {featuredVideos.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                index === currentIndex && styles.activeDot,
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.xl,
        position: 'relative',
    },
    heroContainer: {
        height: 400, // Slightly shorter
    },
    videoContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
        opacity: 0.8, // Slightly dim video for better text contrast
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    infoCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: theme.spacing.xl,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    infoContent: {
        flex: 1,
        gap: 8,
        marginRight: 16,
    },

    authorName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#38BDF8',
        letterSpacing: 0.5,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
        lineHeight: 30,
        letterSpacing: -0.5,
        textTransform: 'uppercase',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
        letterSpacing: 0.5,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    statText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    trendingBadge: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(8, 9, 13, 0.65)',
        borderWidth: 1,
        borderColor: '#38BDF8',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4,
        zIndex: 20,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#38BDF8',
        letterSpacing: 1,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: -16,
        marginBottom: theme.spacing.md,
    },
    dot: {
        width: 6,
        height: 6,
        backgroundColor: '#333',
    },
    activeDot: {
        backgroundColor: theme.colors.primary.light,
    },
    vsContainer: {
        position: 'absolute',
        top: '40%',
        left: '50%',
        marginLeft: -30,
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#D9E4FF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(217, 228, 255, 0.1)',
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
    },
    vsText: {
        color: '#D9E4FF',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 1,
    },
});
