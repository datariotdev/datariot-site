import React, { memo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEventListener } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../Theme/ThemeProvider';
import { theme } from '@design-system/theme';
import { HalftoneArt } from './HalftoneArt';

const GRID_SPACING = 12;
// Item width is handled by flex and numColumns in parent

interface MosaicItemProps {
    video: any;
    index?: number;
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

const ICE = '#DAE6F7';
const INK = '#07080C';
const pad2 = (n: number) => n.toString().padStart(2, '0');

export const MosaicItem = memo(({ video, index = 0, isActive, isScreenFocused, onPress }: MosaicItemProps) => {
    const { mode } = useTheme();
    const isDark = mode === 'dark';
    const [failed, setFailed] = useState(false);
    // The placeholder picsum image is not this video's picture, so it is not used as a stand-in
    const realThumb = video.thumbnailUrl && !/picsum\.photos/.test(video.thumbnailUrl) ? video.thumbnailUrl : null;
    const hasMedia = (video.videoUrl && !failed) || !!realThumb;

    // Tiles with a picture are dark under their text in either theme; the dot-art ones follow the theme
    const onDark = isDark || hasMedia;
    const fg = onDark ? '#FFFFFF' : INK;
    const fgSoft = onDark ? 'rgba(218, 230, 247, 0.85)' : 'rgba(7, 8, 12, 0.62)';
    const hairline = onDark ? 'rgba(218, 230, 247, 0.30)' : 'rgba(7, 8, 12, 0.22)';

    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.container,
                { borderColor: isDark ? 'rgba(218, 230, 247, 0.12)' : 'rgba(7, 8, 12, 0.08)' },
            ]}
        >
            <View style={[styles.card, { backgroundColor: isDark ? '#0A0B10' : '#EEF3FC' }]}>
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
                    <HalftoneArt seed={String(video.id || video.title || index)} isDark={isDark} />
                )}

                {/* Fade so the text reads without a hard black slab */}
                {(hasMedia || isDark) && (
                    <LinearGradient
                        colors={['rgba(7,8,12,0)', 'rgba(7,8,12,0.35)', 'rgba(7,8,12,0.92)']}
                        locations={[0.3, 0.62, 1]}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                    />
                )}

                {video.category && (
                    <View
                        style={[
                            styles.categoryBadge,
                            {
                                borderColor: hairline,
                                backgroundColor: onDark ? 'rgba(7, 8, 12, 0.72)' : 'rgba(255, 255, 255, 0.72)',
                            },
                        ]}
                    >
                        <View style={[styles.categoryDot, { backgroundColor: onDark ? ICE : INK }]} />
                        <Text style={[styles.categoryText, { color: onDark ? ICE : INK }]} numberOfLines={1}>
                            {String(video.category).toUpperCase()}
                        </Text>
                    </View>
                )}

                {/* Contact-sheet frame number */}
                <Text style={[styles.frameNo, { color: onDark ? 'rgba(218, 230, 247, 0.9)' : 'rgba(7, 8, 12, 0.55)' }]}>
                    {pad2(index + 1)}
                </Text>

                <View style={styles.bottomOverlay}>
                    <Text style={[styles.title, { color: fg }]} numberOfLines={2}>
                        {video.title || ''}
                    </Text>

                    <View style={styles.footerRow}>
                        <Text style={[styles.authorName, { color: fgSoft }]} numberOfLines={1}>
                            {video.author ? `@${video.author}` : ''}
                        </Text>
                        <View style={styles.statsContainer}>
                            <Ionicons name="heart" size={11} color={onDark ? ICE : INK} />
                            <Text style={[styles.statsText, { color: fg }]}>{formatNumber(video.likes || 0)}</Text>
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
    categoryBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        maxWidth: '70%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        height: 22,
        borderRadius: 11,
        borderWidth: 1,
    },
    categoryDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginRight: 6,
    },
    categoryText: {
        flexShrink: 1,
        fontSize: 11,
        letterSpacing: 0.6,
        fontFamily: 'Doto_900Black',
        includeFontPadding: false,
    },
    frameNo: {
        position: 'absolute',
        top: 11,
        right: 12,
        fontSize: 14,
        letterSpacing: 1,
        fontFamily: 'Doto_900Black',
        includeFontPadding: false,
    },
    bottomOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    title: {
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
        fontSize: 14,
        letterSpacing: 0.5,
        fontFamily: 'Doto_900Black',
        includeFontPadding: false,
    },
});
