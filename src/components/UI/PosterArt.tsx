import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

/**
 * What a clip shows when it has no picture of its own: a soft two-tone gradient picked from its id,
 * so a row of them reads as a set rather than as blank boxes.
 */

const DARK: [string, string][] = [
    ['#2A3656', '#0B0F1A'],
    ['#30285A', '#0D0B18'],
    ['#173E46', '#08151A'],
    ['#3D2646', '#120B15'],
    ['#2F3B52', '#0E121A'],
    ['#1F3E60', '#0A1220'],
];

const LIGHT: [string, string][] = [
    ['#FFFFFF', '#C7D7F2'],
    ['#FAF8FF', '#D5CEF3'],
    ['#F4FBFB', '#C2E1E4'],
    ['#FCF6FB', '#E7CFE4'],
    ['#F8FAFD', '#CED7E5'],
    ['#F4F8FF', '#BCD1EF'],
];

const pick = (seed: string) => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return h % DARK.length;
};

interface PosterArtProps {
    seed: string;
    isDark: boolean;
    /** A faint play mark in the middle; off where something else sits there */
    glyph?: boolean;
}

export const PosterArt = memo(({ seed, isDark, glyph = true }: PosterArtProps) => {
    const i = pick(seed || 'x');
    const colors = isDark ? DARK[i] : LIGHT[i];
    const ink = isDark ? '255, 255, 255' : '7, 8, 12';

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <LinearGradient colors={colors} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFill} />
            <LinearGradient
                colors={[`rgba(${ink}, ${isDark ? 0.1 : 0.04})`, `rgba(${ink}, 0)`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.6, y: 0.6 }}
                style={StyleSheet.absoluteFill}
            />
            {glyph ? (
                <View style={styles.center}>
                    <View style={[styles.ring, { borderColor: `rgba(${ink}, ${isDark ? 0.22 : 0.16})` }]}>
                        <Ionicons name="play" size={20} color={`rgba(${ink}, ${isDark ? 0.55 : 0.35})`} style={{ marginLeft: 2 }} />
                    </View>
                </View>
            ) : null}
        </View>
    );
});
PosterArt.displayName = 'PosterArt';

const styles = StyleSheet.create({
    center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    ring: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
