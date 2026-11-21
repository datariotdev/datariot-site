/** @jsxImportSource react */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PlayerTopBarProps {
    index: number;
    total: number;
    isMuted?: boolean;
    onToggleMute?: () => void;
    onClose: () => void;
    onAsk: () => void;
}

export function PlayerTopBar({
    index,
    total,
    isMuted = true,
    onToggleMute,
    onClose,
    onAsk
}: PlayerTopBarProps) {
    const count = Math.max(1, total);
    const current = Math.max(0, Math.min(index, count - 1));
    const shown = Math.min(count, 9);
    const start = Math.max(0, Math.min(current - 4, count - shown));

    return (
        <View style={styles.container} pointerEvents="box-none">
            {count > 1 && (
                <View accessibilityLabel={`Video ${current + 1} of ${count}`} style={styles.rail} pointerEvents="none">
                    {Array.from({ length: shown }, (_, offset) => {
                        const position = start + offset;
                        return (
                            <View
                                key={position}
                                style={[
                                    styles.segment,
                                    position < current && styles.seen,
                                    position === current && styles.current,
                                ]}
                            />
                        );
                    })}
                </View>
            )}

            <View style={styles.row} pointerEvents="box-none">
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Back to feed"
                    onPress={onClose}
                    hitSlop={8}
                    style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
                >
                    <Ionicons name="chevron-down" size={22} color="#FFFFFF" />
                </Pressable>

                {count > 1 ? (
                    <View style={styles.counterBadge} pointerEvents="none">
                        <Text style={styles.counterText}>
                            {current + 1} / {count}
                        </Text>
                    </View>
                ) : <View style={{ flex: 1 }} pointerEvents="none" />}

                <View style={styles.rightGroup} pointerEvents="box-none">
                    {onToggleMute && (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={isMuted ? 'Unmute video' : 'Mute video'}
                            onPress={onToggleMute}
                            hitSlop={6}
                            style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
                        >
                            <Ionicons
                                name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
                                size={18}
                                color="#FFFFFF"
                            />
                        </Pressable>
                    )}

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Ask Orvelis AI about this video"
                        onPress={onAsk}
                        hitSlop={6}
                        style={({ pressed }) => [styles.aiPill, pressed && styles.pressed]}
                    >
                        <Ionicons name="sparkles" size={13} color="#D9E4FF" />
                        <Text style={styles.aiText}>AI</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 4,
    },
    rail: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 8,
        marginHorizontal: 2,
    },
    segment: {
        flex: 1,
        height: 2,
        borderRadius: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    seen: {
        backgroundColor: 'rgba(255, 255, 255, 0.55)',
    },
    current: {
        backgroundColor: '#FFFFFF',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 40,
    },
    circleButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(0, 0, 0, 0.42)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    counterText: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 11.5,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: 0.5,
        fontVariant: ['tabular-nums'],
    },
    rightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    aiPill: {
        height: 38,
        paddingHorizontal: 12,
        borderRadius: 19,
        backgroundColor: 'rgba(10, 16, 28, 0.55)',
        borderWidth: 1,
        borderColor: 'rgba(179, 204, 255, 0.28)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    aiText: {
        color: '#D9E4FF',
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: 0.3,
    },
    pressed: {
        opacity: 0.65,
        transform: [{ scale: 0.96 }],
    },
});
