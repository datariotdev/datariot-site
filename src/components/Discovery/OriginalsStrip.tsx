import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePalette } from '../../design-system/palette';
import { HalftoneArt } from '../VideoFeed/MosaicFeed/HalftoneArt';
import { PausedFrame, realThumb, formatNumber, formatClock } from '../VideoFeed/feedMedia';
import { Video } from '../../lib/supabase/hooks/useVideos';

const ICE = '#DAE6F7';
const W = 168;
const H = 236;

interface OriginalsStripProps {
    videos: Video[];
    onSelect: (id: string) => void;
}

const pad = (n: number) => n.toString().padStart(2, '0');

/** Curated picks as a row of tall posters, numbered like frames on a film strip */
export function OriginalsStrip({ videos, onSelect }: OriginalsStripProps) {
    const p = usePalette();

    return (
        <FlatList
            data={videos}
            horizontal
            keyExtractor={(v, i) => `${v.id}-${i}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            snapToInterval={W + 12}
            decelerationRate="fast"
            renderItem={({ item, index }) => {
                const thumb = realThumb(item.thumbnailUrl);
                return (
                    <Pressable
                        onPress={() => onSelect(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel={item.title}
                        style={({ pressed }) => [
                            styles.card,
                            { borderColor: p.isDark ? 'rgba(218, 230, 247, 0.12)' : 'rgba(7, 8, 12, 0.08)' },
                            pressed && { opacity: 0.88 },
                        ]}
                    >
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0B10' }]}>
                            {thumb ? (
                                <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                            ) : item.videoUrl ? (
                                <PausedFrame url={item.videoUrl} />
                            ) : (
                                <HalftoneArt seed={item.id} isDark />
                            )}
                        </View>
                        <LinearGradient
                            colors={['rgba(7, 8, 12, 0.4)', 'rgba(7, 8, 12, 0)']}
                            style={styles.topShade}
                            pointerEvents="none"
                        />
                        <LinearGradient
                            colors={['rgba(7, 8, 12, 0)', 'rgba(7, 8, 12, 0.6)', 'rgba(7, 8, 12, 0.95)']}
                            locations={[0, 0.5, 1]}
                            style={styles.bottomShade}
                            pointerEvents="none"
                        />

                        <Text style={styles.rank}>{pad(index + 1)}</Text>
                        {!!item.duration && (
                            <View style={styles.dur}>
                                <Text style={styles.durText}>{formatClock(item.duration * 1000)}</Text>
                            </View>
                        )}

                        <View style={styles.info} pointerEvents="none">
                            <Text style={[styles.title, { fontFamily: p.fonts.semibold }]} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <View style={styles.foot}>
                                <Text style={[styles.author, { fontFamily: p.fonts.medium }]} numberOfLines={1}>
                                    {item.author}
                                </Text>
                                <View style={styles.views}>
                                    <Ionicons name="play" size={9} color={ICE} />
                                    <Text style={styles.viewsNum}>{formatNumber(item.views)}</Text>
                                </View>
                            </View>
                        </View>
                    </Pressable>
                );
            }}
        />
    );
}

const styles = StyleSheet.create({
    card: {
        width: W,
        height: H,
        borderRadius: 26,
        borderWidth: 1,
        overflow: 'hidden',
        backgroundColor: '#0A0B10',
    },
    topShade: { position: 'absolute', left: 0, right: 0, top: 0, height: 70 },
    bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
    rank: {
        position: 'absolute',
        top: 12,
        left: 14,
        fontFamily: 'Doto_900Black',
        fontSize: 20,
        letterSpacing: 1,
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.55)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
        includeFontPadding: false,
    },
    dur: {
        position: 'absolute',
        top: 12,
        right: 12,
        height: 22,
        paddingHorizontal: 8,
        borderRadius: 11,
        backgroundColor: 'rgba(7, 8, 12, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(218, 230, 247, 0.24)',
        justifyContent: 'center',
    },
    durText: { fontFamily: 'Doto_900Black', fontSize: 12, letterSpacing: 0.6, color: ICE, includeFontPadding: false },
    info: { position: 'absolute', left: 14, right: 14, bottom: 14 },
    title: { fontSize: 16, lineHeight: 20, letterSpacing: -0.2, color: '#FFFFFF' },
    foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8 },
    author: { flex: 1, fontSize: 12, color: 'rgba(218, 230, 247, 0.78)' },
    views: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewsNum: { fontFamily: 'Doto_900Black', fontSize: 13, letterSpacing: 0.5, color: '#FFFFFF', includeFontPadding: false },
});
