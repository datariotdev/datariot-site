import React, { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Video } from '../../lib/supabase/hooks/useVideos';

interface Props {
    videos: Video[];
    paddingTop: number;
    onSelect: (id: string) => void;
    onEndReached: () => void;
}

export function SquareHeroFeed({ videos, paddingTop, onSelect, onEndReached }: Props) {
    const { width } = useWindowDimensions();
    const [activeIndex, setActiveIndex] = useState(0);
    const hero = videos.slice(0, 5);
    const tileWidth = (width - 36) / 2;
    return (
        <FlatList
            style={styles.root}
            data={videos}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columns}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.4}
            contentContainerStyle={{ paddingTop, paddingBottom: 120 }}
            ListHeaderComponent={
                <View>
                    {hero.length > 0 && (
                        <View style={{ width, height: width }}>
                            <FlatList
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                data={hero}
                                keyExtractor={item => item.id}
                                onMomentumScrollEnd={event => setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
                                renderItem={({ item }) => (
                                    <Pressable onPress={() => onSelect(item.id)} style={{ width, height: width, backgroundColor: '#111827' }}>
                                        {item.thumbnailUrl ? <Image source={{ uri: item.thumbnailUrl }} resizeMode="cover" style={StyleSheet.absoluteFill} /> : null}
                                        <LinearGradient colors={['rgba(0,0,0,0.12)', 'transparent', 'rgba(0,0,0,0.82)']} style={StyleSheet.absoluteFill} />
                                        <View style={styles.heroBadge}><Text style={styles.badgeText}>✧ SYSTEM_TRENDING</Text></View>
                                        <View style={styles.heroBottom}>
                                            <Text style={styles.heroAuthor}>@{item.author || 'Datariot'}</Text>
                                            <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>
                                            <Text style={styles.heroStats}>LIKES {item.likes ?? 0}</Text>
                                        </View>
                                        <View style={styles.play}><Ionicons name="play" size={30} color="white" /></View>
                                    </Pressable>
                                )}
                            />
                            <View pointerEvents="none" style={styles.dots}>{hero.map((item, index) => <View key={item.id} style={[styles.dot, index === activeIndex && styles.activeDot]} />)}</View>
                        </View>
                    )}
                    <View style={styles.section}>
                        <Text style={styles.eyebrow}>THE FEED</Text>
                        <Text style={styles.heading}>Latest videos</Text>
                        <Text style={styles.subtitle}>New ideas, one video at a time.</Text>
                    </View>
                </View>
            }
            renderItem={({ item }) => (
                <Pressable onPress={() => onSelect(item.id)} style={[styles.tile, { width: tileWidth, height: tileWidth }]}>
                    {item.thumbnailUrl ? <Image source={{ uri: item.thumbnailUrl }} resizeMode="cover" style={StyleSheet.absoluteFill} /> : null}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.tileCategory}><Text style={styles.badgeText}>{item.category || 'Video'}</Text></View>
                    <View style={styles.tileBottom}>
                        <Text numberOfLines={2} style={styles.tileTitle}>{item.title}</Text>
                        <View style={styles.tileFooter}>
                            <Text numberOfLines={1} style={styles.tileAuthor}>{item.author || 'Datariot'}</Text>
                            <Text style={styles.tileLikes}>♥ {item.likes ?? 0}</Text>
                        </View>
                    </View>
                </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No videos available yet.</Text>}
        />
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFFFFF' },
    columns: { justifyContent: 'space-between', paddingHorizontal: 12 },
    heroBadge: { position: 'absolute', top: 20, left: 20, padding: 10, backgroundColor: 'rgba(12,22,39,0.5)', borderRadius: 22 },
    badgeText: { color: 'white', fontWeight: '700', fontSize: 12 },
    heroBottom: { position: 'absolute', bottom: 42, left: 22, right: 95 },
    heroAuthor: { color: '#D9E4FF', fontSize: 16, fontWeight: '700' },
    heroTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginTop: 7 },
    heroStats: { color: '#E5E7EB', fontSize: 12, marginTop: 10 },
    play: { position: 'absolute', right: 20, bottom: 55, width: 58, height: 58, borderRadius: 29, backgroundColor: '#D9E4FF', justifyContent: 'center', alignItems: 'center' },
    dots: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
    activeDot: { backgroundColor: '#D9E4FF' },
    section: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 18 },
    eyebrow: { color: '#8D93A0', letterSpacing: 2, fontSize: 11, fontWeight: '700' },
    heading: { color: '#111827', fontSize: 28, fontWeight: '800', marginTop: 9 },
    subtitle: { color: '#737B89', fontSize: 14, marginTop: 7 },
    tile: { borderRadius: 18, overflow: 'hidden', backgroundColor: '#141924', marginBottom: 12 },
    tileCategory: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 14, padding: 7 },
    tileBottom: { position: 'absolute', bottom: 12, left: 12, right: 12 },
    tileTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    tileFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    tileAuthor: { color: '#D9E4FF', fontSize: 12, flex: 1 },
    tileLikes: { color: '#FFFFFF', fontSize: 12 },
    empty: { textAlign: 'center', color: '#737B89', padding: 30 },
});
