import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { cancelAnimation, Easing, interpolate, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { OrvelisMark } from '../UI/OrvelisMark';

/** Video context stays behind a small, living glyph until the viewer asks for it. */
export function LiveAnalysisButton({ active, onOpen, dark = false, disabled = false }: {
    active: boolean; onOpen: () => void; dark?: boolean; disabled?: boolean;
}) {
    const motion = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        motion.set(0);
        if (active && !disabled) {
            motion.set(withRepeat(withTiming(1, {
                duration: 5600, easing: Easing.inOut(Easing.cubic), reduceMotion: ReduceMotion.System,
            }), -1, false, undefined, ReduceMotion.System));
        }
        return () => cancelAnimation(motion);
    }, [active, disabled, motion]);

    const halo = useAnimatedStyle(() => ({
        opacity: interpolate(motion.get(), [0, 0.5, 1], [0.15, 0.4, 0.15]),
        transform: [{ rotate: '-18deg' }, { scale: interpolate(motion.get(), [0, 0.5, 1], [0.88, 1.08, 0.88]) }],
    }));
    const touch = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
    const color = dark ? '#D9E4FF' : '#5278AD';

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Orvelis video notes"
            accessibilityHint="Explore the ideas, context and details of this video"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onOpen}
            onPressIn={() => scale.set(withSpring(0.86, { damping: 18, stiffness: 320, reduceMotion: ReduceMotion.System }))}
            onPressOut={() => scale.set(withSpring(1, { damping: 13, stiffness: 260, reduceMotion: ReduceMotion.System }))}
            style={[styles.button, disabled && styles.disabled]}
        >
            <Animated.View pointerEvents="none" style={[styles.glyph, touch]}>
                <Animated.View style={[styles.halo, { borderColor: color, backgroundColor: dark ? '#405A86' : '#D9E4FF' }, halo]} />
                <OrvelisMark size={25} color={color} pressProgress={motion} />
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
    glyph: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    halo: { ...StyleSheet.absoluteFill, borderWidth: 1, borderRadius: 14 },
    disabled: { opacity: 0.4 },
});
