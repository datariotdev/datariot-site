import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePalette } from '../../design-system/palette';

interface DotRuleProps {
    label: string;
    /** Something short on the right, like a count */
    right?: string;
    /** Centre the label and fade the dots away on both sides (day separators) */
    centered?: boolean;
}

const Dots = ({ count, reverse, color }: { count: number; reverse?: boolean; color: string }) => (
    <View style={styles.dots}>
        {Array.from({ length: count }, (_, i) => {
            const k = reverse ? count - 1 - i : i;
            return <View key={i} style={[styles.dot, { backgroundColor: color, opacity: Math.max(0.06, 0.85 - k * (0.8 / count)) }]} />;
        })}
    </View>
);

/** A Doto heading with a dotted rule that fades out, for sections and day breaks */
export function DotRule({ label, right, centered }: DotRuleProps) {
    const p = usePalette();

    if (centered) {
        return (
            <View style={styles.row}>
                <Dots count={12} reverse color={p.accent} />
                <Text style={[styles.label, { color: p.sub, marginHorizontal: 12 }]}>{label}</Text>
                <Dots count={12} color={p.accent} />
            </View>
        );
    }

    return (
        <View style={styles.row}>
            <Text style={[styles.label, { color: p.accent }]}>{label}</Text>
            <Dots count={22} color={p.accent} />
            {!!right && <Text style={[styles.right, { color: p.faint }]}>{right}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
    label: { fontFamily: 'Doto_900Black', fontSize: 15, letterSpacing: 1.3, includeFontPadding: false },
    right: { fontFamily: 'Doto_700Bold', fontSize: 15, letterSpacing: 1, includeFontPadding: false },
    dots: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 12, marginRight: 12 },
    dot: { width: 3, height: 3, borderRadius: 1.5 },
});
