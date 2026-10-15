import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { usePalette } from '../../design-system/palette';

export type ProfileTab = 'videos' | 'posts' | 'saved';

const TABS: { key: ProfileTab; label: string }[] = [
    { key: 'videos', label: 'Essence' },
    { key: 'posts', label: 'Theses' },
    { key: 'saved', label: 'Vault' },
];

interface ProfileTabsProps {
    active: ProfileTab;
    onChange: (tab: ProfileTab) => void;
    counts: Record<ProfileTab, number>;
}

/** Three tabs with their counts; a short bar slides under the chosen one */
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
                            <Text style={[styles.label, { color: on ? p.text : p.sub, fontFamily: on ? p.fonts.semibold : p.fonts.medium }]}>
                                {t.label}
                            </Text>
                            <View style={[styles.count, { backgroundColor: on ? p.accent : p.soft }]}>
                                <Text style={[styles.countText, { color: on ? p.onAccent : p.sub, fontFamily: p.fonts.semibold }]}>
                                    {counts[t.key] || 0}
                                </Text>
                            </View>
                        </Pressable>
                    );
                })}
            </View>
            <View style={[styles.rule, { backgroundColor: p.border }]} />
            {width > 0 && (
                <Animated.View
                    pointerEvents="none"
                    style={[styles.indicatorBox, { width: width / TABS.length, transform: [{ translateX: x }] }]}
                >
                    <View style={[styles.indicator, { backgroundColor: p.accent }]} />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingBottom: 14,
    },
    label: {
        fontSize: 16,
    },
    count: {
        minWidth: 24,
        height: 22,
        paddingHorizontal: 7,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: {
        fontSize: 12,
        fontVariant: ['tabular-nums'],
    },
    rule: {
        height: StyleSheet.hairlineWidth * 2,
    },
    indicatorBox: {
        position: 'absolute',
        left: 0,
        bottom: -1,
        alignItems: 'center',
    },
    indicator: {
        width: 36,
        height: 3,
        borderRadius: 2,
    },
});
