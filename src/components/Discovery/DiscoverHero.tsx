import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../Theme/ThemeProvider';
import { FONT } from '@design-system/fonts';
import { pixelClip } from '@design-system/pixel';

interface Stat {
    label: string;
    value: number;
}

interface DiscoverHeroProps {
    query: string;
    onChangeQuery: (q: string) => void;
    stats: Stat[];
    narrow: boolean;
}

/**
 * Top of the Discover page: a kicker and a big title with live counters on the
 * right, then a large search field. On web `/` jumps to the field.
 */
export const DiscoverHero = ({ query, onChangeQuery, stats, narrow }: DiscoverHeroProps) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const accent = theme.colors.primary.DEFAULT;
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
            if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Ice dots in a checker, fading out to the lower left; the same dither as the topic tiles.
    const dither: any = Platform.OS === 'web'
        ? {
            backgroundImage: `repeating-conic-gradient(${accent} 0 25%, transparent 0 50%)`,
            backgroundSize: '4px 4px',
            maskImage: 'radial-gradient(ellipse at top right, #000, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at top right, #000, transparent 70%)',
        }
        : null;

    return (
        <View style={styles.wrap}>
            {dither && !narrow && <View style={[styles.dither, dither]} pointerEvents="none" />}

            <View style={[styles.titleRow, narrow && { flexDirection: 'column', alignItems: 'flex-start', gap: 18 }]}>
                <View style={{ flexShrink: 1 }}>
                    <Text style={[styles.kicker, { color: accent }]}>[ 01 // EXPLORE ]</Text>
                    <Text style={[styles.title, { color: theme.colors.text.primary, fontSize: narrow ? 36 : 56, lineHeight: narrow ? 40 : 60 }]}>
                        DISCOVER
                    </Text>
                    <Text style={[styles.sub, { color: theme.colors.text.secondary }]}>
                        Pick a room, read the best arguments, follow the minds behind them.
                    </Text>
                </View>

                <View style={styles.stats}>
                    {stats.map((s) => (
                        <View key={s.label} style={styles.stat}>
                            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                                {String(s.value).padStart(2, '0')}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>{s.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View
                style={[
                    styles.field,
                    pixelClip(6),
                    {
                        backgroundColor: isDark ? 'rgba(218, 230, 247, 0.05)' : 'rgba(255, 255, 255, 0.78)',
                        borderColor: focused ? accent : (isDark ? 'rgba(218, 230, 247, 0.22)' : 'rgba(7, 8, 12, 0.22)'),
                    },
                ]}
            >
                <Ionicons name="search-outline" size={20} color={focused ? accent : theme.colors.text.muted} />
                <TextInput
                    ref={inputRef}
                    value={query}
                    onChangeText={onChangeQuery}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="Search arguments, rooms, minds…"
                    placeholderTextColor={theme.colors.text.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    style={[
                        styles.input,
                        { color: theme.colors.text.primary },
                        // @ts-ignore — web-only: the border is the focus ring
                        { outlineStyle: 'none' },
                    ]}
                />
                {query.length > 0 ? (
                    <Pressable onPress={() => onChangeQuery('')} hitSlop={10} accessibilityLabel="Clear search">
                        <Text style={[styles.clear, { color: theme.colors.text.secondary }]}>[ CLEAR ]</Text>
                    </Pressable>
                ) : (
                    Platform.OS === 'web' && !narrow && (
                        <View style={[styles.keycap, { borderColor: isDark ? 'rgba(218, 230, 247, 0.3)' : 'rgba(7, 8, 12, 0.3)' }]}>
                            <Text style={[styles.keycapText, { color: theme.colors.text.muted }]}>/</Text>
                        </View>
                    )
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        paddingHorizontal: 16,
        paddingTop: 28,
        paddingBottom: 8,
    },
    dither: {
        position: 'absolute',
        top: 0,
        right: 16,
        width: 420,
        height: 150,
        opacity: 0.13,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 24,
        marginBottom: 22,
    },
    kicker: {
        fontFamily: FONT.techBold,
        fontSize: 11,
        letterSpacing: 2.4,
        marginBottom: 10,
    },
    title: {
        fontFamily: FONT.display,
        letterSpacing: 1.5,
    },
    sub: {
        fontFamily: FONT.sans,
        fontSize: 15,
        lineHeight: 22,
        marginTop: 10,
        maxWidth: 440,
    },
    stats: {
        flexDirection: 'row',
        gap: 26,
    },
    stat: {
        alignItems: 'flex-start',
    },
    statValue: {
        fontFamily: FONT.lcd,
        fontSize: 40,
        lineHeight: 44,
    },
    statLabel: {
        fontFamily: FONT.tech,
        fontSize: 9.5,
        letterSpacing: 2,
        marginTop: 2,
    },
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        height: 58,
        paddingHorizontal: 18,
        borderWidth: 1.5,
        // @ts-ignore — web-only
        transition: 'border-color 0.18s ease',
    },
    input: {
        flex: 1,
        height: '100%',
        fontFamily: FONT.sans,
        fontSize: 16,
    },
    clear: {
        fontFamily: FONT.techBold,
        fontSize: 10.5,
        letterSpacing: 1.6,
    },
    keycap: {
        width: 24,
        height: 24,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    keycapText: {
        fontFamily: FONT.techBold,
        fontSize: 12,
    },
});
