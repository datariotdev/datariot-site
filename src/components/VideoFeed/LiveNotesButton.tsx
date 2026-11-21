import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { OrvelisMark } from '../AI/OrvelisMark';

/** A quiet entry point: video analysis starts only after the viewer opens it. */
export function LiveNotesButton({ onPress, overlay = false, dark = false }: {
    onPress: () => void; overlay?: boolean; dark?: boolean;
}) {
    const progress = useSharedValue(0);
    const touch = useSharedValue(1);
    const reducedMotion = useReducedMotion();
    const color = overlay || dark ? '#CCDEFF' : '#5278AD';
    useEffect(() => () => { cancelAnimation(progress); cancelAnimation(touch); }, [progress, touch]);
    const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: touch.value }] }));
    const haloStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 0.16, 1], [0, 0.34, 0]),
        transform: [{ scale: interpolate(progress.value, [0, 1], [0.65, 1.5]) }],
    }));
    const activate = () => {
        if (!reducedMotion) {
            progress.set(0);
            progress.set(withTiming(1, { duration: 680 }));
            touch.set(withSequence(withTiming(0.88, { duration: 90 }), withTiming(1, { duration: 220 })));
        }
        onPress();
    };
    return <Pressable accessibilityRole="button" accessibilityLabel="Open Orvelis Live Notes"
        accessibilityHint="Analyze this video and ask about the current moment" onPress={activate}
        style={({ pressed }) => [styles.button, overlay && styles.overlay,
            { backgroundColor: pressed ? overlay || dark ? 'rgba(177,205,255,0.12)' : '#EDF3FC' : 'transparent' }]}>
        <View pointerEvents="none" style={styles.icon}>
            <Animated.View style={[styles.halo, { borderColor: color, backgroundColor: color }, haloStyle]} />
            <Animated.View style={iconStyle}><OrvelisMark color={color} coreColor={color} pressProgress={progress} /></Animated.View>
        </View>
        {overlay && <Text style={styles.label}>Orvelis</Text>}
    </Pressable>;
}

const styles = StyleSheet.create({
    button: { width: 44, minHeight: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    overlay: { minHeight: 54, flexBasis: '12%', width: undefined, minWidth: 40, gap: 2 },
    icon: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
    halo: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 1 },
    label: { color: '#CCDEFF', fontSize: 9 },
});
