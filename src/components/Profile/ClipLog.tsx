import React, { memo, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { encodeVideoUrl } from '@lib/utils/url';
import { usePalette } from '../../design-system/palette';
import { PosterArt } from '../UI/PosterArt';

export interface ClipItem {
    id: string;
    title?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    category?: string | null;
    views?: number;
    duration?: number;
    createdAt?: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ICE = '#DAE6F7';
const INK = '#07080C';

const compact = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return `${n}`;
};

const clock = (secs: number) => {
    const t = Math.round(secs);
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = (t % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s}` : `${m}:${s}`;
};

// The placeholder picture service is not this clip's own picture
const realThumb = (u?: string) => (u && !/picsum\.photos/.test(u) ? u : null);

const PausedFrame = ({ url }: { url: string }) => {
    const player = useVideoPlayer(encodeVideoUrl(url), pl => {
        pl.muted = true;
        pl.loop = false;
        pl.pause();
    });
    return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
};

interface ClipTileProps {
    item: ClipItem;
    wide?: boolean;
    latest?: boolean;
    onPress: () => void;
}

const ClipTile = memo(({ item, wide, latest, onPress }: ClipTileProps) => {
    const p = usePalette();
    const scale = useRef(new Animated.Value(1)).current;
    const thumb = realThumb(item.thumbnailUrl);
    const hasMedia = !!thumb || !!item.videoUrl;
    // A tile with a picture is dark under its text in either theme; the dot-art ones follow the theme
    const onDark = p.isDark || hasMedia;
    const fg = onDark ? '#FFFFFF' : INK;
    const fgSoft = onDark ? 'rgba(218, 230, 247, 0.85)' : 'rgba(7, 8, 12, 0.62)';

    const press = (to: number) => Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 4 }).start();

    return (
        <Animated.View style={[wide ? styles.wideBox : styles.tileBox, { transform: [{ scale }] }]}>
            <Pressable
                onPress={onPress}
                onPressIn={() => press(0.97)}
                onPressOut={() => press(1)}
                style={[
                    styles.tile,
                    { aspectRatio: wide ? 16 / 9 : 0.82, borderColor: p.isDark ? 'rgba(218, 230, 247, 0.12)' : 'rgba(7, 8, 12, 0.08)' },
                ]}
            >
                <View style={[StyleSheet.absoluteFill, { backgroundColor: p.isDark ? '#0A0B10' : '#EEF3FC' }]}>
                    {thumb ? (
                        <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    ) : item.videoUrl ? (
                        <PausedFrame url={item.videoUrl} />
                    ) : (
                        <PosterArt seed={item.id} isDark={p.isDark} />
                    )}
                </View>

                {(hasMedia || p.isDark) && (
                    <LinearGradient
                        colors={['rgba(7,8,12,0)', 'rgba(7,8,12,0.35)', 'rgba(7,8,12,0.92)']}
                        locations={[wide ? 0.25 : 0.3, 0.62, 1]}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                    />
                )}

                {latest ? (
                    <View style={styles.latest}>
                        <Text style={styles.latestText}>Latest</Text>
                    </View>
                ) : (
                    !!item.category && (
                        <View
                            style={[
                                styles.chip,
                                {
                                    borderColor: onDark ? 'rgba(218, 230, 247, 0.3)' : 'rgba(7, 8, 12, 0.22)',
                                    backgroundColor: onDark ? 'rgba(7, 8, 12, 0.72)' : 'rgba(255, 255, 255, 0.72)',
                                },
                            ]}
                        >
                            <Text style={[styles.chipText, { color: onDark ? ICE : INK }]} numberOfLines={1}>
                                {String(item.category).charAt(0).toUpperCase() + String(item.category).slice(1)}
                            </Text>
                        </View>
                    )
                )}


                <View style={styles.bottom}>
                    {!!item.title && (
                        <Text style={[wide ? styles.titleWide : styles.title, { color: fg, fontFamily: p.fonts.semibold }]} numberOfLines={2}>
                            {item.title}
                        </Text>
                    )}
                    <View style={styles.footer}>
                        <View style={styles.views}>
                            <Ionicons name="play" size={10} color={onDark ? ICE : INK} />
                            <Text style={[styles.viewsText, { color: fg }]}>{compact(item.views || 0)}</Text>
                        </View>
                        {!!item.duration && <Text style={[styles.duration, { color: fgSoft }]}>{clock(item.duration)}</Text>}
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
});
ClipTile.displayName = 'ClipTile';

/** A month heading: the name, a hairline, and how many clips it holds */
const MonthRule = ({ label, count }: { label: string; count: number }) => {
    const p = usePalette();
    return (
        <View style={styles.rule}>
            <Text style={[styles.ruleLabel, { color: p.text, fontFamily: p.fonts.semibold }]}>{label}</Text>
            <View style={[styles.ruleLine, { backgroundColor: p.border }]} />
            <Text style={[styles.ruleCount, { color: p.sub, fontFamily: p.fonts.medium }]}>{count === 1 ? '1 clip' : `${count} clips`}</Text>
        </View>
    );
};

interface ClipLogProps {
    items: ClipItem[];
    onPress: (id: string) => void;
}

/** Clips grouped by month, newest first; the newest one gets the wide frame */
export function ClipLog({ items, onPress }: ClipLogProps) {
    const groups = useMemo(() => {
        const out: { key: string; label: string; items: ClipItem[] }[] = [];
        items.forEach(it => {
            const d = it.createdAt ? new Date(it.createdAt) : null;
            const valid = d && !isNaN(d.getTime());
            const key = valid ? `${d!.getFullYear()}-${d!.getMonth()}` : 'undated';
            const label = valid ? `${MONTHS[d!.getMonth()]} ${d!.getFullYear()}` : 'Clips';
            const last = out[out.length - 1];
            if (last && last.key === key) last.items.push(it);
            else out.push({ key, label, items: [it] });
        });
        return out;
    }, [items]);

    return (
        <View style={styles.wrap}>
            {groups.map((g, gi) => {
                const lead = gi === 0 ? g.items[0] : null;
                const rest = gi === 0 ? g.items.slice(1) : g.items;
                return (
                    <View key={g.key}>
                        <MonthRule label={g.label} count={g.items.length} />
                        {lead && (
                            <ClipTile item={lead} wide latest onPress={() => onPress(lead.id)} />
                        )}
                        {rest.length > 0 && (
                            <View style={[styles.grid, lead ? { marginTop: 12 } : null]}>
                                {rest.map(it => (
                                    <ClipTile key={it.id} item={it} onPress={() => onPress(it.id)} />
                                ))}
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        width: '100%',
        maxWidth: 640,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingTop: 6,
    },
    rule: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 12,
    },
    ruleLabel: {
        fontSize: 16,
        letterSpacing: -0.2,
    },
    ruleLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth * 2,
        marginHorizontal: 12,
    },
    ruleCount: {
        fontSize: 13,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
    },
    wideBox: {
        width: '100%',
    },
    tileBox: {
        width: '48.4%',
    },
    tile: {
        width: '100%',
        borderRadius: 22,
        borderWidth: 1,
        overflow: 'hidden',
    },
    latest: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        height: 24,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: ICE,
    },
    latestText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 12.5,
        color: INK,
    },
    chip: {
        position: 'absolute',
        top: 10,
        left: 10,
        maxWidth: '68%',
        flexDirection: 'row',
        alignItems: 'center',
        height: 22,
        paddingHorizontal: 8,
        borderRadius: 11,
        borderWidth: 1,
    },
    chipText: {
        flexShrink: 1,
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 12,
    },
    bottom: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: 12,
    },
    title: {
        fontSize: 13.5,
        lineHeight: 17,
        marginBottom: 6,
    },
    titleWide: {
        fontSize: 18,
        lineHeight: 23,
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    views: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    viewsText: {
        fontFamily: 'Outfit_600SemiBold',
        fontSize: 13,
        fontVariant: ['tabular-nums'],
    },
    duration: {
        fontFamily: 'Doto_900Black',
        fontSize: 14,
        letterSpacing: 0.5,
        includeFontPadding: false,
    },
});
