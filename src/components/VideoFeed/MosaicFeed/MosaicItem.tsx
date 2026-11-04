import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@design-system/theme';
import type { Video } from '../../../lib/supabase/hooks/useVideos';
import { encodeVideoUrl } from '../../../lib/utils/url';

const GRID_SPACING = 12;
// Item width is handled by flex and numColumns in parent

interface MosaicItemProps {
    video: Video;
    isActive: boolean;
    isScreenFocused: boolean;
    onPress: () => void;
    widthPercent: '50%' | '33.3333%';
}

const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

const MosaicVideo = ({ videoUrl }: { videoUrl: string }) => {
    const player = useVideoPlayer(encodeVideoUrl(videoUrl), (player) => {
        player.loop = true;
        player.muted = true;
        player.play();
    });

    return (
        <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
            surfaceType="textureView"
        />
    );
};

export const MosaicItem = memo(({ video, isActive, isScreenFocused, onPress, widthPercent }: MosaicItemProps) => {
    const [failedPoster, setFailedPoster] = useState<string>();
    const poster = video.thumbnailUrl;
    const author = video.author.split(' | ')[0];

    return (
        <Pressable onPress={onPress} style={[styles.container, { width: widthPercent }]} accessibilityRole="button" accessibilityLabel={`Play ${video.title}`}>
            <View style={styles.card}>
                {poster && poster !== failedPoster ? (
                    <Image
                        source={{ uri: poster }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                        onError={() => setFailedPoster(poster)}
                    />
                ) : video.videoUrl && isActive && isScreenFocused ? (
                    <MosaicVideo videoUrl={video.videoUrl} />
                ) : null}

                {/* Dark Overlay for better text contrast */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.12)', 'transparent', 'rgba(0,0,0,0.9)']}
                    locations={[0, 0.42, 1]}
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
                        {video.title}
                    </Text>

                    <View style={styles.footerRow}>
                        <View style={styles.authorSection}>
                            {video.avatarUrl && <Image source={{ uri: video.avatarUrl }} style={styles.avatar} />}
                            <Text style={styles.authorName} numberOfLines={1}>{author}</Text>
                        </View>

                        <View style={styles.statsContainer}>
                            <Ionicons name="heart" size={10} color="#D9E4FF" />
                            <Text style={styles.statsText}>{formatNumber(video.likes)}</Text>
                        </View>
                    </View>
                </View>

            </View>
        </Pressable>
    );
});
MosaicItem.displayName = 'MosaicItem';

const styles = StyleSheet.create({
    container: {
        aspectRatio: 1,
        padding: GRID_SPACING / 2,
    },
    card: {
        flex: 1,
        backgroundColor: '#111',
        borderRadius: 21,
        borderWidth: 1,
        borderColor: '#303640',
        overflow: 'hidden',
        // High-end shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    topBadgeContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
    },
    categoryBadge: {
        backgroundColor: 'rgba(8, 9, 13, 0.65)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 20,
    },
    categoryText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
        fontFamily: theme.typography.fontFamilies.medium,
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
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 6,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        fontFamily: theme.typography.fontFamilies.bold,
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
        width: 18,
        height: 18,
        borderRadius: 9,
        marginRight: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    authorName: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
        flex: 1,
        fontFamily: theme.typography.fontFamilies.medium,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 2,
        fontFamily: theme.typography.fontFamilies.medium,
    },
});
