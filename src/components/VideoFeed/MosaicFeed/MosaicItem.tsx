import React, { memo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEventListener } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../Theme/ThemeProvider';
import { theme } from '@design-system/theme';

const GRID_SPACING = 12;
// Item width is handled by flex and numColumns in parent

interface MosaicItemProps {
    video: any;
    isActive: boolean;
    isScreenFocused: boolean;
    onPress: () => void;
}

const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

import { encodeVideoUrl } from '../../../lib/utils/url';

interface MosaicVideoProps {
    videoUrl: string;
    isActive: boolean;
    isScreenFocused: boolean;
    onFailed?: () => void;
}

const MosaicVideo = ({ videoUrl, isActive, isScreenFocused, onFailed }: MosaicVideoProps) => {
    const player = useVideoPlayer(encodeVideoUrl(videoUrl), (player) => {
        player.loop = true;
        player.muted = true;
    });

    useEventListener(player, 'statusChange', ({ status }) => {
        if (status === 'error') onFailed?.();
    });

    useEffect(() => {
        if (isActive && isScreenFocused) {
            const playVideo = async () => {
                try {
                    await player.play();
                } catch (e: any) {
                    if (e.name !== 'AbortError') {
                        console.error("MosaicItem: Playback failed", e);
                    }
                }
            };
            playVideo();
        } else {
            player.pause();
        }
    }, [isActive, isScreenFocused, player]);

    return (
        <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
        />
    );
};

const ICE = '#D9E4FF';

export const MosaicItem = memo(({ video, isActive, isScreenFocused, onPress }: MosaicItemProps) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const [failed, setFailed] = useState(false);
    // The placeholder picsum image is not this video's picture, so it is not used as a stand-in
    const realThumb = video.thumbnailUrl && !/picsum\.photos/.test(video.thumbnailUrl) ? video.thumbnailUrl : null;

    return (
        <Pressable onPress={onPress} style={[styles.container, { borderColor: isDark ? 'rgba(217, 228, 255, 0.10)' : 'rgba(8, 9, 13, 0.08)' }]}>
            <View style={styles.card}>
                {/* Brand backdrop: shows while a clip loads and when it cannot play */}
                <LinearGradient
                    colors={isDark ? ['#1A1C24', '#0D0E13'] : ['#F2F6FD', '#C4D5F0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                {video.videoUrl && !failed ? (
                    <MosaicVideo
                        videoUrl={video.videoUrl}
                        isActive={isActive}
                        isScreenFocused={isScreenFocused}
                        onFailed={() => setFailed(true)}
                    />
                ) : realThumb ? (
                    <Image source={{ uri: realThumb }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                    <View style={[StyleSheet.absoluteFill, styles.centered]}>
                        <View style={styles.playGlyph}>
                            <Ionicons name="play" size={20} color={ICE} style={{ marginLeft: 2 }} />
                        </View>
                    </View>
                )}

                {/* Soft navy fade so the text reads without a hard black slab */}
                <LinearGradient
                    colors={['rgba(8,9,13,0)', 'rgba(8,9,13,0.3)', 'rgba(8,9,13,0.9)']}
                    locations={[0.35, 0.6, 1]}
                    style={StyleSheet.absoluteFill}
                />

                {video.category && (
                    <View style={styles.topBadgeContainer}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{String(video.category)}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.bottomOverlay}>
                    <Text style={styles.title} numberOfLines={2}>
                        {video.title || ''}
                    </Text>

                    <View style={styles.footerRow}>
                        <Text style={styles.authorName} numberOfLines={1}>
                            {video.author ? `@${video.author}` : ''}
                        </Text>
                        <View style={styles.statsContainer}>
                            <Ionicons name="heart" size={11} color={ICE} />
                            <Text style={styles.statsText}>{formatNumber(video.likes)}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </Pressable>
    );
});
MosaicItem.displayName = 'MosaicItem';

const FONT_BOLD = theme.typography.fontFamilies.semibold;
const FONT_MED = theme.typography.fontFamilies.medium;

const styles = StyleSheet.create({
    container: {
        flex: 1, // Use flex instead of fixed width
        aspectRatio: 1, // Keep it square
        marginHorizontal: GRID_SPACING / 2,
        marginBottom: GRID_SPACING,
        borderRadius: 22,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    card: {
        flex: 1,
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    playGlyph: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(217, 228, 255, 0.14)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topBadgeContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
    },
    categoryBadge: {
        backgroundColor: 'rgba(217, 228, 255, 0.18)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        zIndex: 20,
    },
    categoryText: {
        color: ICE,
        fontSize: 10.5,
        letterSpacing: 0.3,
        fontFamily: FONT_MED,
    },
    bottomOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    title: {
        color: '#FFF',
        fontSize: 13.5,
        lineHeight: 17,
        marginBottom: 6,
        fontFamily: FONT_BOLD,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    authorName: {
        color: 'rgba(217, 228, 255, 0.85)',
        fontSize: 11,
        flex: 1,
        fontFamily: FONT_MED,
        marginRight: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    statsText: {
        color: '#FFF',
        fontSize: 11,
        fontFamily: FONT_MED,
    },
});
