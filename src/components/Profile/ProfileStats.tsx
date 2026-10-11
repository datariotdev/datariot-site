import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePalette } from '../../design-system/palette';

const compact = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString().padStart(2, '0');
};

interface ProfileStatsProps {
    followers: number;
    following: number;
    arguments: number;
}

/** Followers, following and arguments as three dot-matrix counters split by columns of dots */
export function ProfileStats({ followers, following, arguments: args }: ProfileStatsProps) {
    const p = usePalette();
    const items = [
        { label: 'FOLLOWERS', value: followers },
        { label: 'FOLLOWING', value: following },
        { label: 'ARGUMENTS', value: args },
    ];

    return (
        <View style={styles.row}>
            {items.map((it, i) => (
                <React.Fragment key={it.label}>
                    {i > 0 && (
                        <View style={styles.rule}>
                            {[0.14, 0.3, 0.5, 0.3, 0.14].map((o, k) => (
                                <View key={k} style={[styles.ruleDot, { backgroundColor: p.accent, opacity: o }]} />
                            ))}
                        </View>
                    )}
                    <View style={styles.cell}>
                        <Text style={[styles.num, { color: p.text }]}>{compact(it.value || 0)}</Text>
                        <Text style={[styles.label, { color: p.sub }]}>{it.label}</Text>
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
        marginTop: 14,
    },
    cell: {
        minWidth: 98,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    num: {
        fontFamily: 'Doto_900Black',
        fontSize: 26,
        lineHeight: 28,
        letterSpacing: 1,
        includeFontPadding: false,
    },
    label: {
        fontFamily: 'Doto_700Bold',
        fontSize: 10.5,
        letterSpacing: 1.5,
        marginTop: 3,
        includeFontPadding: false,
    },
    rule: {
        height: 34,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ruleDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
});
