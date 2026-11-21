import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePalette } from '../../design-system/palette';

interface ProfileClipCardProps {
    item: { title?: string; thumbnailUrl?: string; views?: number; duration?: number };
    width: number;
    compact: boolean;
    onPress: () => void;
    fallback?: React.ReactNode;
}

function formatCount(count: number) {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
}

export function ProfileClipCard({ item, width, compact, onPress, fallback }: ProfileClipCardProps) {
    const p = usePalette();
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Play ${item.title || 'clip'}`}
            onPress={onPress}
            style={({ pressed }) => [
                styles.gridCard,
                compact && styles.compact,
                { width, backgroundColor: p.cardHigh, borderColor: p.border },
                pressed && styles.pressed,
            ]}
        >
            {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : fallback ?? (
                <View style={[styles.placeholderCard, { backgroundColor: p.soft }]}>
                    <Feather name="play" size={20} color={p.faint} />
                </View>
            )}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={styles.cardGradient} pointerEvents="none" />
            {!!item.duration && (
                <View style={styles.durationPill}>
                    <Text style={styles.durationText}>
                        {Math.floor(item.duration / 60)}:{String(Math.floor(item.duration % 60)).padStart(2, '0')}
                    </Text>
                </View>
            )}
            <View style={styles.cardViews}>
                <Feather name="play" size={10} color="#FFFFFF" style={{ opacity: 0.9 }} />
                <Text style={styles.cardViewsText}>{formatCount(item.views || 0)}</Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    compact: { borderRadius: 0, borderWidth: 0 },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    gridCard: {
        aspectRatio: 1 / 1.32,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        position: 'relative',
    },
    placeholderCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 85,
    },
    cardViews: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    durationPill: { position: 'absolute', right: 10, top: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
    durationText: { color: '#FFFFFF', fontSize: 10, fontFamily: 'Outfit_500Medium' },
    cardViewsText: {
        color: '#FFFFFF',
        fontSize: 10.5,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
});
