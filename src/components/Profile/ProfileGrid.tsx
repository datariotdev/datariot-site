import React from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video } from '../../lib/supabase/hooks/useVideos';
import { formatCount } from '../../lib/utils/format';
import { MAX_CONTENT_WIDTH } from '../../lib/constants/layout';
import { pickPlaceholder } from '../Explore/PosterTile';
import { Txt } from '../core/Txt';

const GAP = 2;
const COLUMNS = 3;

/** m:ss from seconds, or nothing when the clip's length is not known. */
const length = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
};

function Tile({ video, size, onPress }: { video: Video; size: number; onPress: () => void }) {
    const [from, to] = pickPlaceholder(video.id);
    const len = length(video.duration);

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={video.title}
            style={({ pressed }) => [{ width: size, height: size * 1.32 }, pressed && { opacity: 0.8 }]}
        >
            {video.posterUrl ? (
                <Image source={{ uri: video.posterUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
                <LinearGradient colors={[from, to]} style={[StyleSheet.absoluteFill, styles.center]}>
                    <Ionicons name="play" size={18} color="rgba(255,255,255,0.22)" />
                </LinearGradient>
            )}
            <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']} style={styles.scrim} pointerEvents="none" />
            <View style={styles.meta} pointerEvents="none">
                {video.views > 0 ? (
                    <View style={styles.views}>
                        <Ionicons name="play" size={9} color="#FFFFFF" />
                        <Txt variant="micro" tone="onVideo">{formatCount(video.views)}</Txt>
                    </View>
                ) : <View />}
                {len ? <Txt variant="micro" tone="onVideo">{len}</Txt> : null}
            </View>
        </Pressable>
    );
}

/** Three across, hairline gaps, nothing but pictures. Rows are built by the caller so one list can scroll header and grid together. */
export function GridRow({ videos, onOpen }: { videos: Video[]; onOpen: (video: Video) => void }) {
    const { width } = useWindowDimensions();
    const size = (Math.min(width, MAX_CONTENT_WIDTH) - GAP * (COLUMNS - 1)) / COLUMNS;

    return (
        <View style={styles.row}>
            {videos.map(v => <Tile key={v.id} video={v} size={size} onPress={() => onOpen(v)} />)}
            {Array.from({ length: COLUMNS - videos.length }).map((_, i) => <View key={`pad-${i}`} style={{ width: size }} />)}
        </View>
    );
}

/** [a,b,c,d,e] -> [[a,b,c],[d,e]] */
export function chunk<T>(items: T[], n = COLUMNS): T[][] {
    const rows: T[][] = [];
    for (let i = 0; i < items.length; i += n) rows.push(items.slice(i, i + n));
    return rows;
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: GAP, marginBottom: GAP },
    center: { alignItems: 'center', justifyContent: 'center' },
    scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 44 },
    meta: { position: 'absolute', left: 7, right: 7, bottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    views: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
