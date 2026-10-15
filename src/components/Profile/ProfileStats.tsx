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

/** Followers, following and arguments: three numbers with their names under them, split by thin lines */
export function ProfileStats({ followers, following, arguments: args }: ProfileStatsProps) {
    const p = usePalette();
    const items = [
        { label: 'Followers', value: followers },
        { label: 'Following', value: following },
        { label: 'Arguments', value: args },
    ];

    return (
        <View style={styles.row}>
            {items.map((it, i) => (
                <React.Fragment key={it.label}>
                    {i > 0 && <View style={[styles.rule, { backgroundColor: p.border }]} />}
                    <View style={styles.cell}>
                        <Text style={[styles.num, { color: p.text, fontFamily: p.fonts.bold }]}>{compact(it.value || 0)}</Text>
                        <Text style={[styles.label, { color: p.sub, fontFamily: p.fonts.regular }]}>{it.label}</Text>
                    </View>
                </React.Fragment>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    cell: {
        minWidth: 96,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    num: {
        fontSize: 20,
        letterSpacing: -0.3,
        fontVariant: ['tabular-nums'],
    },
    label: {
        fontSize: 12.5,
        marginTop: 1,
    },
    rule: {
        width: StyleSheet.hairlineWidth * 2,
        height: 28,
    },
});
