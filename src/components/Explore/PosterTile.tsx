import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video } from '../../lib/supabase/hooks/useVideos';
import { formatCount } from '../../lib/utils/format';
import { Txt } from '../core/Txt';
import { RADIUS } from '../../design-system/ui';

/** Quiet dark pairs for clips without a thumbnail: chosen by id, so a clip always gets the same one. */
const PLACEHOLDERS: [string, string][] = [
    ['#1E2738', '#0D1017'],
    ['#25213A', '#0E0D17'],
    ['#1C2B2D', '#0B1315'],
    ['#2C2333', '#120E16'],
    ['#2A2822', '#12100C'],
    ['#202C3A', '#0C1218'],
];

export const pickPlaceholder = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return PLACEHOLDERS[h % PLACEHOLDERS.length];
};

interface PosterTileProps {
    video: Video;
    onPress: () => void;
}

/** A clip in a grid: its picture, its title, who made it, how many have watched. Nothing plays until you open it. */
export function PosterTile({ video, onPress }: PosterTileProps) {
    const [from, to] = pickPlaceholder(video.id);

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${video.title}, by ${video.author}`}
            style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] }]}
        >
            <View style={styles.card}>
                {video.posterUrl ? (
                    <Image source={{ uri: video.posterUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                    <LinearGradient colors={[from, to]} style={StyleSheet.absoluteFill}>
                        <View style={styles.placeholderMark}>
                            <Ionicons name="play" size={22} color="rgba(255,255,255,0.22)" />
                        </View>
                    </LinearGradient>
                )}

                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.78)']}
                    locations={[0.35, 0.65, 1]}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                />

                {video.views > 0 ? (
                    <View style={styles.views}>
                        <Ionicons name="play" size={10} color="#FFFFFF" />
                        <Txt variant="micro" tone="onVideo">{formatCount(video.views)}</Txt>
                    </View>
                ) : null}

                <View style={styles.meta}>
                    <Txt variant="callout" tone="onVideo" numberOfLines={2} style={styles.title}>{video.title}</Txt>
                    <Txt variant="caption" tone="onVideoDim" numberOfLines={1}>@{video.author}</Txt>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, padding: 5 },
    card: { aspectRatio: 0.74, borderRadius: RADIUS.lg - 4, overflow: 'hidden', backgroundColor: '#101217' },
    placeholderMark: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    views: {
        position: 'absolute',
        top: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(0,0,0,0.38)',
    },
    meta: { position: 'absolute', left: 12, right: 12, bottom: 11, gap: 2 },
    title: { textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
});
