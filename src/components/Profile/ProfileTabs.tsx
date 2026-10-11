import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { usePalette } from '../../design-system/palette';

export type ProfileTab = 'videos' | 'posts' | 'saved';

const TABS: Array<{ key: ProfileTab; label: string }> = [
    { key: 'videos', label: 'ESSENCE' },
    { key: 'posts', label: 'THESES' },
    { key: 'saved', label: 'VAULT' },
];

const pad = (n: number) => n.toString().padStart(2, '0');

interface ProfileTabsProps {
    active: ProfileTab;
    onChange: (tab: ProfileTab) => void;
    counts: Record<ProfileTab, number>;
}

/** Three counters that double as tabs; a strip of lit dots slides under the chosen one */
export function ProfileTabs({ active, onChange, counts }: ProfileTabsProps) {
    const p = usePalette();
    const [width, setWidth] = useState(0);
    const x = useRef(new Animated.Value(0)).current;
    const index = TABS.findIndex(t => t.key === active);

    useEffect(() => {
        if (width <= 0) return;
        Animated.spring(x, { toValue: index * (width / TABS.length), useNativeDriver: true, speed: 18, bounciness: 7 }).start();
    }, [index, width, x]);

    return (
        <View style={styles.wrap} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
            <View style={styles.row}>
                {TABS.map(t => {
                    const on = t.key === active;
                    return (
                        <Pressable
                            key={t.key}
                            style={styles.tab}
                            onPress={() => onChange(t.key)}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: on }}
                        >
                            <Text style={[styles.num, { color: on ? p.accent : p.faint }]}>{pad(counts[t.key] || 0)}</Text>
                            <Text style={[styles.label, { color: on ? p.text : p.sub }]}>{t.label}</Text>
                        </Pressable>
                    );
                })}
            </View>
            <View style={[styles.rule, { backgroundColor: p.border }]} />
            {width > 0 && (
                <Animated.View
                    pointerEvents="none"
                    style={[styles.indicator, { width: width / TABS.length, transform: [{ translateX: x }] }]}
                >
                    {Array.from({ length: 9 }, (_, i) => (
                        <View key={i} style={[styles.dot, { backgroundColor: p.accent, opacity: 1 - Math.abs(i - 4) * 0.17 }]} />
                    ))}
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        width: '100%',
        maxWidth: 640,
        alignSelf: 'center',
        marginTop: 22,
        marginHorizontal: 16,
    },
    row: {
        flexDirection: 'row',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingBottom: 14,
    },
    num: {
        fontFamily: 'Doto_900Black',
        fontSize: 30,
        lineHeight: 32,
        letterSpacing: 1,
        includeFontPadding: false,
    },
    label: {
        fontFamily: 'Doto_700Bold',
        fontSize: 11,
        letterSpacing: 1.8,
        marginTop: 4,
        includeFontPadding: false,
    },
    rule: {
        height: StyleSheet.hairlineWidth,
    },
    indicator: {
        position: 'absolute',
        left: 0,
        bottom: -2,
        height: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
});
