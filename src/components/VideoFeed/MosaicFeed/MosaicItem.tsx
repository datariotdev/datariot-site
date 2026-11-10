import React, { memo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';


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
}

const MosaicVideo = ({ videoUrl, isActive, isScreenFocused }: MosaicVideoProps) => {
    const player = useVideoPlayer(encodeVideoUrl(videoUrl), (player) => {
        player.loop = true;
        player.muted = true;
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

export const MosaicItem = memo(({ video, isActive, isScreenFocused, onPress }: MosaicItemProps) => {
    return (
        <Pressable onPress={onPress} style={styles.container}>
            <View style={styles.card}>
                {/* Video Layer */}
                {video.thumbnailUrl ? (
                    <Image source={{ uri: video.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : video.videoUrl ? (
                    <MosaicVideo
                        videoUrl={video.videoUrl}
                        isActive={isActive}
                        isScreenFocused={isScreenFocused}
                    />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111' }]} />
                )}

                {/* Dark Overlay for better text contrast */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.06)', 'transparent', 'rgba(0,0,0,0.86)']}
                    style={StyleSheet.absoluteFill}
                />

                {/* Top Overlay: Trending/AI Badge */}
                {video.category && (
                    <View style={styles.topBadgeContainer}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>
                                {video.category.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Bottom Overlay: Title & Stats */}
                <View style={styles.bottomOverlay}>
                    <Text style={styles.title} numberOfLines={2}>
                        {video.title || ''}
                    </Text>

                    <View style={styles.footerRow}>
                        <View style={styles.authorSection}>
                            <View style={styles.avatar}><Ionicons name="play" size={10} color="#8DB9D8" /></View>
                            <Text style={styles.authorName} numberOfLines={1}>
                                {video.author || 'Datariot'}
                            </Text>
                        </View>

                        <View style={styles.statsContainer}>
                            <Ionicons name="heart-outline" size={14} color="#D9E4FF" />
                            <Text style={styles.statsText}>{formatNumber(video.likes ?? 0)}</Text>
                        </View>
                    </View>
                </View>

                {/* Active Indicator Border */}
                {isActive && (
                    <View style={[styles.activeBorder, { borderColor: theme.colors.primary.DEFAULT }]} />
                )}
            </View>
        </Pressable>
    );
});
MosaicItem.displayName = 'MosaicItem';

const styles = StyleSheet.create({
    container: {
        flex: 1, // Use flex instead of fixed width
        aspectRatio: 1, // Keep it square
        marginHorizontal: 0,
        marginBottom: GRID_SPACING,
        borderRadius: 18,
        overflow: 'hidden',
        // High-end shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 1,
    },
    card: {
        flex: 1,
        backgroundColor: '#111',
    },
    topBadgeContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
    },
    categoryBadge: {
        backgroundColor: 'rgba(8, 9, 13, 0.65)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.32)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
        zIndex: 20,
    },
    categoryText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
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
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 6,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        letterSpacing: 0.2,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    authorSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#F0F7FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    authorName: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '700',
        flex: 1,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        letterSpacing: 0.5,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 2,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    activeBorder: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 2,
        borderRadius: 24,
    }
});
