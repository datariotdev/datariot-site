import React, { memo, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { encodeVideoUrl } from '@lib/utils/url';
import { usePalette } from '../../design-system/palette';
import { HalftoneArt } from '../VideoFeed/MosaicFeed/HalftoneArt';

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

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const ICE = '#DAE6F7';
const INK = '#07080C';

const pad = (n: number) => n.toString().padStart(2, '0');

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
    frame: number;
    wide?: boolean;
    latest?: boolean;
    onPress: () => void;
}

const ClipTile = memo(({ item, frame, wide, latest, onPress }: ClipTileProps) => {
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
                        <HalftoneArt seed={item.id} isDark={p.isDark} />
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
                        <View style={styles.latestDot} />
                        <Text style={styles.latestText}>LATEST</Text>
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
                            <View style={[styles.chipDot, { backgroundColor: onDark ? ICE : INK }]} />
                            <Text style={[styles.chipText, { color: onDark ? ICE : INK }]} numberOfLines={1}>
                                {String(item.category).toUpperCase()}
                            </Text>
                        </View>
                    )
                )}

                <Text style={[styles.frame, { color: onDark ? 'rgba(218, 230, 247, 0.9)' : 'rgba(7, 8, 12, 0.55)' }]}>{pad(frame)}</Text>

                <View style={styles.bottom}>
                    {!!item.title && (
                        <Text style={[wide ? styles.titleWide : styles.title, { color: fg, fontFamily: p.fonts.semibold }]} numberOfLines={2}>
                            {item.title}
                        </Text>
                    )}
                    <View style={styles.footer}>
                        <View style={styles.views}>
                            <Ionicons name="play" size={10} color={onDark ? ICE : INK} />
                            <Text style={[styles.footNum, { color: fg }]}>{compact(item.views || 0)}</Text>
                        </View>
                        {!!item.duration && <Text style={[styles.footNum, { color: fgSoft }]}>{clock(item.duration)}</Text>}
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
});
ClipTile.displayName = 'ClipTile';

/** A month heading: the name, a dotted rule that fades out, and how many clips it holds */
const MonthRule = ({ label, count }: { label: string; count: number }) => {
    const p = usePalette();
    return (
        <View style={styles.rule}>
            <Text style={[styles.ruleLabel, { color: p.accent }]}>{label}</Text>
            <View style={styles.ruleDots}>
                {Array.from({ length: 22 }, (_, i) => (
                    <View key={i} style={[styles.ruleDot, { backgroundColor: p.accent, opacity: Math.max(0.06, 0.8 - i * 0.04) }]} />
                ))}
            </View>
            <Text style={[styles.ruleCount, { color: p.faint }]}>{pad(count)}</Text>
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
            const label = valid ? `${MONTHS[d!.getMonth()]} ${d!.getFullYear()}` : 'CLIPS';
            const last = out[out.length - 1];
            if (last && last.key === key) last.items.push(it);
            else out.push({ key, label, items: [it] });
        });
        return out;
    }, [items]);

    let frame = 0;
    return (
        <View style={styles.wrap}>
            {groups.map((g, gi) => {
                const lead = gi === 0 ? g.items[0] : null;
                const rest = gi === 0 ? g.items.slice(1) : g.items;
                return (
                    <View key={g.key}>
                        <MonthRule label={g.label} count={g.items.length} />
                        {lead && (
                            <ClipTile item={lead} frame={++frame} wide latest onPress={() => onPress(lead.id)} />
                        )}
                        {rest.length > 0 && (
                            <View style={[styles.grid, lead ? { marginTop: 12 } : null]}>
                                {rest.map(it => (
                                    <ClipTile key={it.id} item={it} frame={++frame} onPress={() => onPress(it.id)} />
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
        fontFamily: 'Doto_900Black',
        fontSize: 16,
        letterSpacing: 1.2,
        includeFontPadding: false,
    },
    ruleDots: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 12,
    },
    ruleDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
    ruleCount: {
        fontFamily: 'Doto_700Bold',
        fontSize: 15,
        letterSpacing: 1,
        includeFontPadding: false,
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
    latestDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: INK,
        marginRight: 6,
    },
    latestText: {
        fontFamily: 'Doto_900Black',
        fontSize: 12,
        letterSpacing: 1.2,
        color: INK,
        includeFontPadding: false,
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
    chipDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginRight: 6,
    },
    chipText: {
        flexShrink: 1,
        fontFamily: 'Doto_900Black',
        fontSize: 11,
        letterSpacing: 0.6,
        includeFontPadding: false,
    },
    frame: {
        position: 'absolute',
        top: 11,
        right: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.55)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
        fontFamily: 'Doto_900Black',
        fontSize: 14,
        letterSpacing: 1,
        includeFontPadding: false,
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
    footNum: {
        fontFamily: 'Doto_900Black',
        fontSize: 14,
        letterSpacing: 0.5,
        includeFontPadding: false,
    },
});
