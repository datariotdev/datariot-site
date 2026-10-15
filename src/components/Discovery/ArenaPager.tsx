import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Animated, Easing, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../UI/Avatar';
import { usePalette } from '../../design-system/palette';
import { FeedVideo, Viewfinder, realThumb, formatNumber } from '../VideoFeed/feedMedia';

const ICE = '#DAE6F7';
const GLASS = 'rgba(7, 8, 12, 0.62)';
const GLASS_LINE = 'rgba(218, 230, 247, 0.24)';
const METER_DOTS = 22;
const GAP = 12;
const SIDE = 16;

interface ArenaVideo {
    id: string;
    title: string;
    author: string;
    avatarUrl?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    views: number;
    likes: number;
    /** Real tally from the debate's replies, when the room has voted. */
    logicStats?: { forScore: number; againstScore: number; forPercentage: number };
}

interface ArenaPagerProps {
    featuredVideos: ArenaVideo[];
    onVideoPress: (videoId: string) => void;
}

/** Debates running right now: swipe through big cards, the one in front plays */
export function ArenaPager({ featuredVideos, onVideoPress }: ArenaPagerProps) {
    const { width } = useWindowDimensions();
    const p = usePalette();
    const cardW = width - SIDE * 2;
    const cardH = Math.min(Math.round(cardW * 1.12), 460);
    const interval = cardW + GAP;
    const [index, setIndex] = useState(0);
    const blink = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(blink, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(blink, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [blink]);

    const renderItem = ({ item, index: i }: { item: ArenaVideo; index: number }) => {
        const current = i === index;
        const tally = item.logicStats;
        const voted = !!tally && tally.forScore + tally.againstScore > 0;
        const pro = voted ? Math.round(tally!.forPercentage) : 0;
        const lit = voted ? Math.round((tally!.forPercentage / 100) * METER_DOTS) : 0;

        return (
            <Pressable
                onPress={() => onVideoPress(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. Open the debate`}
                style={[styles.card, { width: cardW, height: cardH }]}
            >
                <FeedVideo
                    url={item.videoUrl}
                    seed={item.id}
                    thumb={realThumb(item.thumbnailUrl)}
                    active={current}
                    paused={false}
                    muted
                    onTime={() => {}}
                />
                <LinearGradient colors={['rgba(7, 8, 12, 0.55)', 'rgba(7, 8, 12, 0)']} style={styles.topShade} pointerEvents="none" />
                <LinearGradient
                    colors={['rgba(7, 8, 12, 0)', 'rgba(7, 8, 12, 0.6)', 'rgba(7, 8, 12, 0.95)']}
                    locations={[0, 0.5, 1]}
                    style={styles.bottomShade}
                    pointerEvents="none"
                />
                <Viewfinder on={current} />

                <View style={styles.top} pointerEvents="none">
                    <View style={styles.live}>
                        <Animated.View style={[styles.liveDot, { opacity: blink.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }]} />
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                    <View style={styles.watch}>
                        <Text style={styles.watchNum}>{formatNumber(item.views)}</Text>
                        <Text style={styles.watchCap}>WATCHING</Text>
                    </View>
                </View>

                <View style={styles.info} pointerEvents="none">
                    <View style={styles.authorRow}>
                        <Avatar uri={item.avatarUrl} name={item.author || '?'} size={30} />
                        <Text style={styles.author} numberOfLines={1}>
                            {item.author}
                        </Text>
                    </View>
                    <Text style={styles.title} numberOfLines={2}>
                        {item.title}
                    </Text>

                    <View style={styles.meter}>
                        {Array.from({ length: METER_DOTS }, (_, k) => (
                            <View key={k} style={[styles.mDot, { opacity: voted ? (k < lit ? 1 : 0.22) : 0.2 }]} />
                        ))}
                    </View>
                    <View style={styles.caps}>
                        <Text style={styles.cap}>{voted ? `FOR ${pro}%` : 'NO VERDICT YET'}</Text>
                        <Text style={[styles.cap, { opacity: 0.65 }]}>
                            {voted ? `${100 - pro}% AGAINST` : 'THE FLOOR IS OPEN'}
                        </Text>
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <View>
            <FlatList
                data={featuredVideos}
                horizontal
                keyExtractor={(item, i) => `${item.id}-${i}`}
                renderItem={renderItem}
                showsHorizontalScrollIndicator={false}
                snapToInterval={interval}
                snapToAlignment="start"
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: SIDE, gap: GAP }}
                onMomentumScrollEnd={e => {
                    const i = Math.round(e.nativeEvent.contentOffset.x / interval);
                    setIndex(Math.max(0, Math.min(featuredVideos.length - 1, i)));
                }}
                initialNumToRender={2}
                windowSize={3}
            />
            {featuredVideos.length > 1 && (
                <View style={styles.rail}>
                    {featuredVideos.map((_, i) => (
                        <View
                            key={i}
                            style={[styles.tick, { backgroundColor: p.isDark ? 'rgba(218, 230, 247, 0.28)' : 'rgba(7, 8, 12, 0.22)' }, i === index && [styles.tickOn, { backgroundColor: p.accent }]]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: '#06070A',
        borderWidth: 1,
        borderColor: 'rgba(218, 230, 247, 0.12)',
    },
    topShade: { position: 'absolute', left: 0, right: 0, top: 0, height: 96 },
    bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%' },
    top: {
        position: 'absolute',
        top: 14,
        left: 14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    live: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 30,
        paddingHorizontal: 12,
        borderRadius: 15,
        backgroundColor: GLASS,
        borderWidth: 1,
        borderColor: GLASS_LINE,
    },
    liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#F0616D', marginRight: 8 },
    liveText: { fontFamily: 'Doto_900Black', fontSize: 13, letterSpacing: 1.4, color: ICE, includeFontPadding: false },
    watch: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    watchNum: { fontFamily: 'Doto_900Black', fontSize: 20, letterSpacing: 1, color: '#FFFFFF', includeFontPadding: false },
    watchCap: { fontFamily: 'Doto_700Bold', fontSize: 11, letterSpacing: 1.5, color: 'rgba(218, 230, 247, 0.7)', includeFontPadding: false },
    info: { position: 'absolute', left: 18, right: 18, bottom: 18 },
    authorRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
    author: { flexShrink: 1, fontFamily: 'Outfit_600SemiBold', fontSize: 14.5, color: 'rgba(255, 255, 255, 0.92)' },
    title: { fontFamily: 'Outfit_700Bold', fontSize: 27, lineHeight: 32, letterSpacing: -0.6, color: '#FFFFFF' },
    meter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
    mDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ICE },
    caps: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
    cap: { fontFamily: 'Doto_700Bold', fontSize: 12, letterSpacing: 1.3, color: '#FFFFFF', includeFontPadding: false },
    rail: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 14 },
    tick: { width: 6, height: 4, borderRadius: 2 },
    tickOn: { width: 22 },
});
