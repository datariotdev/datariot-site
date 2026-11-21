import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePalette } from '../../design-system/palette';

interface SectionRuleProps {
    label: string;
    /** Something short on the right, like a count */
    right?: string;
    /** Centre the label between two lines (day breaks in a chat) */
    centered?: boolean;
}

/** A small label with a hairline running out from it, for section heads and day breaks */
export function SectionRule({ label, right, centered }: SectionRuleProps) {
    const p = usePalette();

    if (centered) {
        return (
            <View style={styles.row}>
                <View style={[styles.line, { backgroundColor: p.border }]} />
                <Text style={[styles.center, { color: p.sub, fontFamily: p.fonts.medium }]}>{label}</Text>
                <View style={[styles.line, { backgroundColor: p.border }]} />
            </View>
        );
    }

    return (
        <View style={styles.row}>
            {!!label && <Text style={[styles.label, { color: p.accent, fontFamily: p.fonts.semibold }]}>{label}</Text>}
            <View style={[styles.line, { backgroundColor: p.border, marginLeft: label ? 12 : 0, marginRight: right ? 12 : 0 }]} />
            {!!right && <Text style={[styles.right, { color: p.sub, fontFamily: p.fonts.medium }]}>{right}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
    line: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
    label: { fontSize: 13.5, letterSpacing: 0.2 },
    right: { fontSize: 13, fontVariant: ['tabular-nums'] },
    center: { fontSize: 12.5, marginHorizontal: 12 },
});
