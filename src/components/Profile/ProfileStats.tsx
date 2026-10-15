import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePalette } from '../../design-system/palette';

const compact = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
};

interface ProfileStatsProps {
    followers: number;
    following: number;
    arguments: number;
}

/** Followers, following and arguments in one quiet line under the bio */
export function ProfileStats({ followers, following, arguments: args }: ProfileStatsProps) {
    const p = usePalette();
    const items = [
        { label: 'Followers', value: followers },
        { label: 'Following', value: following },
        { label: 'Arguments', value: args },
    ];

    return (
        <View style={styles.row}>
            {items.map(it => (
                <Text key={it.label} style={[styles.item, { color: p.sub, fontFamily: p.fonts.regular }]}>
                    <Text style={[styles.num, { color: p.text, fontFamily: p.fonts.semibold }]}>{compact(it.value || 0)}</Text>
                    {` ${it.label}`}
                </Text>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: 18,
        rowGap: 4,
        marginTop: 12,
    },
    item: {
        fontSize: 14,
    },
    num: {
        fontSize: 14.5,
        fontVariant: ['tabular-nums'],
    },
});
