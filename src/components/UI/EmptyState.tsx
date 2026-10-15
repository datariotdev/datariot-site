import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePalette } from '../../design-system/palette';

interface EmptyStateProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    sub: string;
    cta?: string;
    onCta?: () => void;
}

/** A calm empty state: an icon in a soft circle, one line of title, one of help, and maybe a button */
export function EmptyState({ icon, title, sub, cta, onCta }: EmptyStateProps) {
    const p = usePalette();

    return (
        <View style={styles.wrap}>
            <View style={[styles.circle, { backgroundColor: p.card, borderColor: p.border }]}>
                <Ionicons name={icon} size={28} color={p.sub} />
            </View>
            <Text style={[styles.title, { color: p.text, fontFamily: p.fonts.semibold }]}>{title}</Text>
            <Text style={[styles.sub, { color: p.sub, fontFamily: p.fonts.regular }]}>{sub}</Text>
            {!!cta && !!onCta && (
                <Pressable onPress={onCta} style={({ pressed }) => [styles.cta, { backgroundColor: p.accent }, pressed && { opacity: 0.85 }]}>
                    <Text style={[styles.ctaText, { color: p.onAccent, fontFamily: p.fonts.semibold }]}>{cta}</Text>
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
    circle: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 19, marginTop: 18, textAlign: 'center' },
    sub: { fontSize: 14.5, lineHeight: 21, marginTop: 6, textAlign: 'center' },
    cta: { marginTop: 22, height: 44, paddingHorizontal: 24, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    ctaText: { fontSize: 15 },
});
