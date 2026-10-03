import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../Theme/ThemeProvider';
import { FONT } from '@design-system/fonts';
import { ICE } from '@design-system/theme';
import { pixelClip } from '@design-system/pixel';

export interface Topic {
    id: string;
    label: string;
    description: string;
    icon: string;
    /** 0–100, how hot the room is. Placeholder data until the arena reports real activity. */
    pulse: number;
    /** What tapping the tile searches for. */
    keyword: string;
}

/** Ordered by pulse: the first one is the spotlight. */
export const TOPICS: Topic[] = [
    { id: 'ai', label: 'Artificial Intelligence', description: 'Minds, models and who answers to whom', icon: 'brain', pulse: 98, keyword: 'AI' },
    { id: 'crisis', label: 'Global Resource Crisis', description: 'Resource management and ethics', icon: 'earth', pulse: 96, keyword: 'resource' },
    { id: 'mars', label: 'Mars Colony in 2040', description: 'Interplanetary logistics and law', icon: 'rocket-launch-outline', pulse: 91, keyword: 'mars' },
    { id: 'bitcoin', label: 'Bitcoin vs Traditional Finance', description: 'The future of decentralized assets', icon: 'currency-btc', pulse: 88, keyword: 'bitcoin' },
    { id: 'jobs', label: 'Future of Jobs', description: 'Work after automation', icon: 'briefcase-outline', pulse: 85, keyword: 'jobs' },
];

/** The ice drawn in pixels, as on the logo's screen. */
const DITHER: any = Platform.OS === 'web'
    ? {
        backgroundImage: 'repeating-conic-gradient(#DAE6F7 0 25%, transparent 0 50%)',
        backgroundSize: '4px 4px',
        maskImage: 'radial-gradient(ellipse at bottom right, #000, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at bottom right, #000, transparent 70%)',
    }
    : { backgroundColor: 'rgba(218, 230, 247, 0.08)' };

const Meter = ({ value, on, off, compact }: { value: number; on: string; off: string; compact?: boolean }) => {
    const segments = compact ? 10 : 12;
    const lit = Math.round((value / 100) * segments);
    return (
        <View style={[styles.meter, compact && { gap: 2 }]}>
            {Array.from({ length: segments }).map((_, i) => (
                <View key={i} style={[styles.seg, compact && { width: 5 }, { backgroundColor: i < lit ? on : off }]} />
            ))}
        </View>
    );
};

type Size = 'hero' | 'mid' | 'small';

const Tile = ({ topic, rank, size, narrow, onPress, style }: {
    topic: Topic;
    rank: number;
    size: Size;
    narrow: boolean;
    onPress: () => void;
    style?: any;
}) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const [hovered, setHovered] = useState(false);
    const hero = size === 'hero';

    const accent = theme.colors.primary.DEFAULT;
    // The spotlight is always ink, like the arena cards; the rest follow the theme.
    const fg = hero ? '#EEF2FA' : theme.colors.text.primary;
    const sub = hero ? 'rgba(218, 230, 247, 0.62)' : theme.colors.text.secondary;
    const faint = hero ? 'rgba(218, 230, 247, 0.45)' : theme.colors.text.muted;
    const lit = hero ? ICE : accent;
    const unlit = hero ? 'rgba(218, 230, 247, 0.16)' : (isDark ? 'rgba(218, 230, 247, 0.14)' : 'rgba(7, 8, 12, 0.12)');
    const border = hovered
        ? (hero ? 'rgba(218, 230, 247, 0.6)' : accent)
        : (hero ? 'rgba(218, 230, 247, 0.2)' : (isDark ? 'rgba(218, 230, 247, 0.14)' : 'rgba(7, 8, 12, 0.14)'));

    const iconTile = (
        <View style={[styles.iconTile, pixelClip(4), { backgroundColor: hero ? 'rgba(218, 230, 247, 0.1)' : (isDark ? 'rgba(218, 230, 247, 0.08)' : 'rgba(7, 8, 12, 0.06)') }]}>
            <MaterialCommunityIcons name={topic.icon as any} size={hero ? 24 : 20} color={lit} />
        </View>
    );

    const titleSize = hero ? (narrow ? 26 : 36) : size === 'mid' ? 21 : narrow ? 15 : 17;
    const rankSize = hero ? (narrow ? 38 : 54) : size === 'mid' ? 28 : 22;

    return (
        <Pressable
            onPress={onPress}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            style={[
                styles.tile,
                pixelClip(hero ? 8 : 6),
                {
                    backgroundColor: hero ? '#0B0D14' : (isDark ? 'rgba(218, 230, 247, 0.04)' : 'rgba(255, 255, 255, 0.66)'),
                    borderColor: border,
                    padding: hero ? (narrow ? 18 : 24) : 16,
                    transform: [{ translateY: hovered ? -3 : 0 }],
                },
                style,
            ]}
            accessibilityLabel={topic.label}
        >
            {hero && (
                <>
                    <LinearGradient
                        colors={['#232A3B', '#0B0D14']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0.9, y: 1 }}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                    />
                    <View style={[styles.dither, DITHER]} pointerEvents="none" />
                </>
            )}

            {/* rank and pulse; the mid tile has no room for a row of its own, so its icon rides here */}
            <View style={styles.topRow}>
                <View style={styles.rankGroup}>
                    <Text style={[styles.rank, { color: lit, fontSize: rankSize, lineHeight: rankSize + 4 }]}>
                        {String(rank).padStart(2, '0')}
                    </Text>
                    {size === 'mid' && iconTile}
                </View>
                <View style={styles.pulseRead}>
                    <Text style={[styles.pulseLabel, { color: faint }]}>PULSE</Text>
                    <Text style={[styles.pulseValue, { color: fg }]}>{topic.pulse}</Text>
                </View>
            </View>

            <View style={{ flex: 1 }} />

            {hero && <View style={{ marginBottom: 12 }}>{iconTile}</View>}

            <Text style={[styles.title, { color: fg, fontSize: titleSize, lineHeight: titleSize + 5 }]} numberOfLines={hero || narrow ? 3 : 2}>
                {topic.label.toUpperCase()}
            </Text>

            {size !== 'small' && (
                <Text style={[styles.desc, { color: sub }]} numberOfLines={2}>{topic.description}</Text>
            )}

            <View style={styles.bottomRow}>
                <Meter value={topic.pulse} on={lit} off={unlit} compact={size === 'small'} />
                {/* two-up tiles on a phone are too narrow for the label */}
                {!(size === 'small' && narrow) && (
                    <Text style={[styles.go, { color: hovered ? fg : faint }]}>{hero ? 'ENTER ROOM' : 'OPEN'} →</Text>
                )}
            </View>

            {hero && <View style={[styles.tick, { top: 8, left: 8, borderTopWidth: 1.5, borderLeftWidth: 1.5 }]} pointerEvents="none" />}
            {hero && <View style={[styles.tick, { bottom: 8, right: 8, borderBottomWidth: 1.5, borderRightWidth: 1.5 }]} pointerEvents="none" />}
        </Pressable>
    );
};

interface TopicBentoProps {
    topics?: Topic[];
    /** Measured width of the column the bento sits in. */
    width: number;
    onPress: (topic: Topic) => void;
}

/**
 * The trending topics as a bento: one spotlight tile, the rest around it.
 * Wide, the spotlight sits beside two stacked tiles with two more beneath;
 * narrow, it runs full width over a two-up grid.
 */
export const TopicBento = ({ topics = TOPICS, width, onPress }: TopicBentoProps) => {
    const wide = width >= 760;
    const [hero, ...rest] = topics;
    if (!hero) return null;

    if (!wide) {
        const narrow = width < 520;
        return (
            <View style={styles.stack}>
                <Tile topic={hero} rank={1} size="hero" narrow={narrow} onPress={() => onPress(hero)} style={{ height: 250 }} />
                <View style={styles.grid}>
                    {rest.map((t, i) => (
                        <Tile key={t.id} topic={t} rank={i + 2} size="small" narrow={narrow} onPress={() => onPress(t)} style={styles.gridCell} />
                    ))}
                </View>
            </View>
        );
    }

    const [a, b, ...more] = rest;
    return (
        <View style={styles.stack}>
            <View style={[styles.row, { height: 340 }]}>
                <Tile topic={hero} rank={1} size="hero" narrow={false} onPress={() => onPress(hero)} style={{ flex: 1.6 }} />
                <View style={[styles.col, { flex: 1 }]}>
                    {a && <Tile topic={a} rank={2} size="mid" narrow={false} onPress={() => onPress(a)} style={{ flex: 1 }} />}
                    {b && <Tile topic={b} rank={3} size="mid" narrow={false} onPress={() => onPress(b)} style={{ flex: 1 }} />}
                </View>
            </View>
            {more.length > 0 && (
                <View style={[styles.row, { height: 128 }]}>
                    {more.map((t, i) => (
                        <Tile key={t.id} topic={t} rank={i + 4} size="small" narrow={false} onPress={() => onPress(t)} style={{ flex: 1 }} />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    stack: { gap: 14 },
    row: { flexDirection: 'row', gap: 14 },
    col: { gap: 14 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridCell: { flexGrow: 1, flexBasis: '45%', height: 150 },
    tile: {
        borderWidth: 1,
        overflow: 'hidden',
        // @ts-ignore — web-only
        cursor: 'pointer',
        // @ts-ignore — web-only
        transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease',
    },
    dither: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: '62%',
        height: '70%',
        opacity: 0.22,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
    },
    rankGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rank: {
        fontFamily: FONT.lcd,
    },
    pulseRead: {
        alignItems: 'flex-end',
    },
    pulseLabel: {
        fontFamily: FONT.tech,
        fontSize: 9,
        letterSpacing: 1.8,
    },
    pulseValue: {
        fontFamily: FONT.lcd,
        fontSize: 22,
        lineHeight: 26,
    },
    iconTile: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontFamily: FONT.display,
        letterSpacing: 0.6,
    },
    desc: {
        fontFamily: FONT.sans,
        fontSize: 13,
        lineHeight: 19,
        marginTop: 6,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
    },
    meter: {
        flexDirection: 'row',
        gap: 3,
    },
    seg: {
        width: 7,
        height: 12,
    },
    go: {
        fontFamily: FONT.tech,
        fontSize: 10,
        letterSpacing: 1.4,
    },
    tick: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderColor: 'rgba(218, 230, 247, 0.55)',
    },
});
