import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, useWindowDimensions, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@components/UI/BlurView';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@design-system/theme';
import { encodeVideoUrl } from '@lib/utils/url';
import { Video, ResizeMode } from 'expo-av';
import { fadeRight, pixelClip } from '@design-system/pixel';
import { TECH_FONT } from '@design-system/fonts';

interface FeaturedVideo {
    id: string;
    title: string;
    author: string;
    avatarUrl: string;
    videoUrl: string;
    thumbnailUrl?: string; // Added thumbnail support
    views: number;
    likes: number;
    /** Real tally from the debate's replies, when the room has voted. */
    logicStats?: { forScore: number; againstScore: number; forPercentage: number };
}

const MONO = TECH_FONT;

/** The AGAINST side of the tally: the same ice, drawn in pixels — as the logo's screen does. */
const DITHER: any = Platform.OS === 'web'
    ? { backgroundColor: 'transparent', backgroundImage: 'repeating-conic-gradient(#DAE6F7 0 25%, transparent 0 50%)', backgroundSize: '4px 4px' }
    : { backgroundColor: '#5F6B82' };

/** Stable per-debate wash so a card without artwork still has an identity.
 *  Graphite steps between the logo's black and a lifted slate — never a hue. */
const WASHES: [string, string][] = [
    ['#1C2130', '#0C0E15'],
    ['#181C27', '#090B11'],
    ['#222838', '#0E1118'],
    ['#151823', '#07090E'],
];
const washFor = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return WASHES[h % WASHES.length];
};

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
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const renderFeaturedItem = (item: FeaturedVideo, index: number) => {
        const isCurrent = index === currentIndex;
        const isHovered = hoveredId === item.id;

        const cardPadding = isWeb ? 14 : 24;
        const titleSize = isWeb ? 15 : 24;
        const titleLineHeight = isWeb ? 19 : 30;

        const [washTop, washBottom] = washFor(item.id);
        const tally = item.logicStats;
        const pro = tally ? Math.round(tally.forPercentage) : null;

        return (
            <Pressable
                onPress={() => onVideoPress(item.id)}
                onHoverIn={() => setHoveredId(item.id)}
                onHoverOut={() => setHoveredId(null)}
                style={[
                    styles.heroContainer,
                    {
                        width: cardWidth,
                        height: cardHeight,
                        marginRight: isWeb ? 16 : 0,
                        borderColor: isHovered ? 'rgba(218, 230, 247, 0.6)' : 'rgba(218, 230, 247, 0.14)',
                        transform: [{ translateY: isHovered && isWeb ? -4 : 0 }],
                    }
                ]}
            >
                <View style={styles.videoContainer}>
                    {/* Identity wash. Most debates have no artwork yet, and a
                        bare <Image> left the card a black rectangle. */}
                    <LinearGradient
                        colors={[washTop, washBottom, '#05070C']}
                        locations={[0, 0.55, 1]}
                        start={{ x: 0.1, y: 0 }}
                        end={{ x: 0.9, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <LinearGradient
                        colors={['rgba(218, 230, 247, 0.12)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0.7, y: 0.7 }}
                        style={StyleSheet.absoluteFill}
                    />

                    {item.thumbnailUrl ? (
                        <Image
                            source={{ uri: item.thumbnailUrl }}
                            style={styles.video}
                            resizeMode="cover"
                            // @ts-ignore
                            crossOrigin="anonymous"
                        />
                    ) : null}

                    {item.videoUrl ? (
                        <FeaturedVideoPlayer videoUrl={item.videoUrl} isCurrent={isCurrent} />
                    ) : null}

                    <View style={styles.overlay}>
                        <LinearGradient
                            colors={['rgba(3,5,10,0.55)', 'transparent', 'rgba(3,5,10,0.86)', '#03050A']}
                            locations={[0, 0.34, 0.74, 1]}
                            style={StyleSheet.absoluteFill}
                        />

                        {/* instrument bar */}
                        <View style={styles.topBar}>
                            <View style={[styles.liveTag, pixelClip(2)]}>
                                <View style={[styles.liveDot, { backgroundColor: '#F43F5E' }]} />
                                <Text style={styles.liveText}>LIVE_DEBATE</Text>
                            </View>
                            {!(isWeb && isHovered) && (
                                <Text style={styles.watching}>{formatNumber(item.views)} WATCHING</Text>
                            )}
                        </View>

                        <View style={[styles.infoCard, { padding: cardPadding }]}>
                            <View style={styles.infoContent}>
                                <Text style={[styles.authorName, { fontSize: isWeb ? 11 : 14 }]}>
                                    {item.author ? `> @${item.author.toUpperCase()}` : ''}
                                </Text>
                                <Text style={[styles.title, { fontSize: titleSize, lineHeight: titleLineHeight }]} numberOfLines={2}>
                                    {item.title ? item.title.toUpperCase() : ''}
                                </Text>

                                {/* The tally is what makes this a debate and not
                                    a video. Shown only when the room has voted. */}
                                {pro !== null ? (
                                    <View style={styles.tally}>
                                        <View style={styles.tallyLabels}>
                                            <Text style={[styles.tallySide, { color: '#DAE6F7' }]}>PRO {pro}%</Text>
                                            <Text style={[styles.tallySide, { color: '#9AA7BD' }]}>{100 - pro}% CON</Text>
                                        </View>
                                        <View style={styles.tallyTrack}>
                                            <View style={[styles.tallyFill, { width: `${pro}%`, backgroundColor: '#DAE6F7' }]} />
                                            <View style={[styles.tallyFill, { width: `${100 - pro}%` }, DITHER]} />
                                        </View>
                                        <Text style={styles.tallyMeta}>{formatNumber(item.likes)} VOTES CAST</Text>
                                    </View>
                                ) : (
                                    <View style={styles.tally}>
                                        <View style={styles.tallyTrackEmpty} />
                                        <Text style={styles.tallyMeta}>NO VERDICT YET — FLOOR IS OPEN</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* corner ticks, the instrument language used across the deck */}
                        <View style={[styles.tick, styles.tickTL]} />
                        <View style={[styles.tick, styles.tickBR]} />

                        {isWeb && isHovered && (
                            <View style={[styles.enterChip, pixelClip(2)]}>
                                <Text style={styles.enterText}>[ ENTER ]</Text>
                            </View>
                        )}
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
            style={[styles.container, { paddingHorizontal: 0 }, isWeb && fadeRight(48)]}
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
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
        // @ts-ignore — web only
        transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s ease',
    },
    videoContainer: {
        flex: 1,
        backgroundColor: '#05070C',
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
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 11,
    },
    liveTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(5, 8, 15, 0.72)',
        borderWidth: 1,
        borderColor: 'rgba(244, 63, 94, 0.45)',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    liveText: {
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 1.6,
        color: '#FDA4AF',
        fontFamily: MONO,
    },
    watching: {
        fontSize: 8,
        fontWeight: '600',
        letterSpacing: 1.4,
        color: 'rgba(238, 242, 250, 0.72)',
        fontFamily: MONO,
    },
    tally: {
        marginTop: 8,
        gap: 5,
    },
    tallyLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    tallySide: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1.2,
        fontFamily: MONO,
    },
    tallyTrack: {
        flexDirection: 'row',
        height: 5,
        backgroundColor: 'rgba(238, 242, 250, 0.14)',
        overflow: 'hidden',
    },
    tallyTrackEmpty: {
        height: 5,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(238, 242, 250, 0.24)',
    },
    tallyFill: {
        height: '100%',
    },
    tallyMeta: {
        fontSize: 8,
        letterSpacing: 1.3,
        color: 'rgba(238, 242, 250, 0.55)',
        fontFamily: MONO,
    },
    tick: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderColor: 'rgba(238, 242, 250, 0.5)',
    },
    tickTL: {
        top: 6,
        left: 6,
        borderLeftWidth: 1,
        borderTopWidth: 1,
    },
    tickBR: {
        bottom: 6,
        right: 6,
        borderRightWidth: 1,
        borderBottomWidth: 1,
    },
    enterChip: {
        position: 'absolute',
        top: 11,
        right: 12,
        paddingHorizontal: 9,
        paddingVertical: 4,
        backgroundColor: 'rgba(218, 230, 247, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(218, 230, 247, 0.6)',
    },
    enterText: {
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 1.6,
        color: '#DAE6F7',
        fontFamily: MONO,
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
        color: '#DAE6F7',
        letterSpacing: 0.5,
        fontFamily: TECH_FONT,
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
        fontFamily: TECH_FONT,
    },
    statText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '700',
        fontFamily: TECH_FONT,
    },
    trendingBadge: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(8, 9, 13, 0.65)',
        borderWidth: 1,
        borderColor: '#DAE6F7',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4,
        zIndex: 20,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#DAE6F7',
        letterSpacing: 1,
        fontFamily: TECH_FONT,
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
        borderColor: '#DAE6F7',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(218, 230, 247, 0.1)',
        shadowColor: '#DAE6F7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
    },
    vsText: {
        color: '#DAE6F7',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 1,
    },
});
