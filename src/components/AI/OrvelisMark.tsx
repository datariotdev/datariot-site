import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

type Props = {
    color: string;
    coreColor: string;
    pressProgress: SharedValue<number>;
};

export function OrvelisMark({ color, coreColor, pressProgress }: Props) {
    const frame = useAnimatedStyle(() => ({
        transform: [{
            rotate: `${interpolate(pressProgress.value, [0, 0.2, 0.56, 1], [45, 37, 49, 45])}deg`,
        }],
    }));
    const firstCorner = useAnimatedStyle(() => {
        const offset = interpolate(pressProgress.value, [0, 0.2, 0.56, 1], [0, 1.5, -0.6, 0]);
        return { transform: [{ translateX: offset }, { translateY: offset }] };
    });
    const secondCorner = useAnimatedStyle(() => {
        const offset = interpolate(pressProgress.value, [0, 0.2, 0.56, 1], [0, -1.5, 0.6, 0]);
        return { transform: [{ translateX: offset }, { translateY: offset }] };
    });
    const pulse = useAnimatedStyle(() => ({
        opacity: interpolate(pressProgress.value, [0, 0.2, 0.44, 1], [0, 0, 0.55, 0]),
        transform: [{ scale: interpolate(pressProgress.value, [0.2, 1], [0.65, 2.2], 'clamp') }],
    }));

    return (
        <Animated.View accessible={false} pointerEvents="none" style={[styles.frame, frame]}>
            <Animated.View style={[styles.corner, styles.firstCorner, { borderColor: color }, firstCorner]} />
            <Animated.View style={[styles.corner, styles.secondCorner, { borderColor: color }, secondCorner]} />
            <Animated.View style={[styles.pulse, { borderColor: coreColor }, pulse]} />
            <View style={[styles.core, { backgroundColor: coreColor }]} />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    frame: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    corner: {
        position: 'absolute',
        width: 11,
        height: 11,
    },
    firstCorner: {
        top: 4,
        left: 4,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderTopLeftRadius: 4.5,
    },
    secondCorner: {
        bottom: 4,
        right: 4,
        borderRightWidth: 2,
        borderBottomWidth: 2,
        borderBottomRightRadius: 4.5,
    },
    core: {
        width: 5,
        height: 5,
        borderRadius: 1.4,
    },
    pulse: {
        position: 'absolute',
        width: 7,
        height: 7,
        borderWidth: 1,
        borderRadius: 2.3,
    },
});
