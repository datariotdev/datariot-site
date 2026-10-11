import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { usePalette } from '../../design-system/palette';

// Little pictures for the empty states, drawn on a dot grid like the rest of the app's LED look
const GLYPHS = {
    clip: ['#......', '###....', '#####..', '#######', '#####..', '###....', '#......'],
    thesis: ['.#######.', '#########', '#########', '#########', '.#######.', '..###....', '..#......'],
    vault: ['#######', '#######', '#######', '#######', '#######', '###.###', '##...##', '#.....#'],
} as const;

const DOT = 8;
const GAP = 4;

interface EmptyDotsProps {
    glyph: keyof typeof GLYPHS;
    title: string;
    sub: string;
    cta?: string;
    onCta?: () => void;
}

export function EmptyDots({ glyph, title, sub, cta, onCta }: EmptyDotsProps) {
    const p = usePalette();
    const rows = GLYPHS[glyph];

    return (
        <View style={styles.wrap}>
            <View>
                {rows.map((row, r) => (
                    <View key={r} style={styles.row}>
                        {row.split('').map((c, i) => (
                            <View key={i} style={styles.cell}>
                                <View
                                    style={
                                        c === '#'
                                            ? { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: p.accent, opacity: 0.95 - r * 0.07 }
                                            : { width: 2, height: 2, borderRadius: 1, backgroundColor: p.accent, opacity: 0.16 }
                                    }
                                />
                            </View>
                        ))}
                    </View>
                ))}
            </View>
            <Text style={[styles.title, { color: p.text, fontFamily: p.fonts.semibold }]}>{title}</Text>
            <Text style={[styles.sub, { color: p.sub, fontFamily: p.fonts.regular }]}>{sub}</Text>
            {!!cta && !!onCta && (
                <Pressable onPress={onCta} style={[styles.cta, { backgroundColor: p.accent }]}>
                    <Text style={[styles.ctaText, { color: p.onAccent }]}>{cta.toUpperCase()}</Text>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        width: '100%',
        maxWidth: 640,
        alignSelf: 'center',
        alignItems: 'center',
        paddingTop: 44,
        paddingBottom: 30,
        paddingHorizontal: 32,
    },
    row: {
        flexDirection: 'row',
    },
    cell: {
        width: DOT + GAP,
        height: DOT + GAP,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 19,
        marginTop: 26,
        textAlign: 'center',
    },
    sub: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: 6,
        textAlign: 'center',
    },
    cta: {
        marginTop: 22,
        height: 44,
        paddingHorizontal: 24,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaText: {
        fontFamily: 'Doto_900Black',
        fontSize: 14,
        letterSpacing: 1.4,
        includeFontPadding: false,
    },
});
