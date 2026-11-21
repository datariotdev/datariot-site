import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';

type Props = {
    size?: number;
    color?: string;
    coreColor?: string;
    style?: StyleProp<ViewStyle>;
    pressProgress?: SharedValue<number>;
};

/** An asymmetric, broken glyph; every surface uses the same native geometry. */
export function OrvelisMark({ size = 24, color = '#D9E4FF', coreColor = color, style, pressProgress }: Props) {
    const resting = useSharedValue(1);
    const progress = pressProgress ?? resting;
    const spine = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(progress.value, [0, .22, .48, .7, 1], [0, -size * .08, size * .03, -size * .015, 0]) },
            { rotate: `${interpolate(progress.value, [0, .22, .48, .7, 1], [-19, -48, -10, -23, -19])}deg` },
            { scaleY: interpolate(progress.value, [0, .22, .48, 1], [1, .78, 1.12, 1]) },
        ],
    }));
    const hook = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(progress.value, [0, .22, .48, 1], [0, size * .12, -size * .04, 0]) },
            { translateY: interpolate(progress.value, [0, .22, .48, 1], [0, size * .07, -size * .04, 0]) },
            { rotate: `${interpolate(progress.value, [0, .22, .48, .7, 1], [31, 80, 15, 38, 31])}deg` },
        ],
    }));
    const core = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(progress.value, [0, .22, .48, .7, 1], [0, size * .14, -size * .07, size * .025, 0]) },
            { translateY: interpolate(progress.value, [0, .22, .48, 1], [0, -size * .08, size * .05, 0]) },
            { rotate: `${interpolate(progress.value, [0, .22, .48, 1], [-28, 55, -60, -28])}deg` },
            { scaleX: interpolate(progress.value, [0, .22, .48, 1], [1, 1.7, .7, 1]) },
        ],
    }));
    const fragment = useAnimatedStyle(() => ({
        transform: [
            { translateY: interpolate(progress.value, [0, .22, .48, .7, 1], [0, -size * .09, size * .05, -size * .02, 0]) },
            { rotate: `${interpolate(progress.value, [0, .22, .48, 1], [-38, 35, -55, -38])}deg` },
        ],
    }));
    return (
        <View accessible={false} pointerEvents="none" style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }, style]}>
            <Animated.View style={[{
                position: 'absolute', width: size * .58, height: size * .79,
                left: size * .12, top: size * .08, borderWidth: size * .085,
                borderColor: color, borderRightColor: 'transparent',
                borderTopLeftRadius: size * .34, borderBottomLeftRadius: size * .16,
                borderTopRightRadius: size * .12, borderBottomRightRadius: size * .3,
            }, spine]} />
            <Animated.View style={[{
                position: 'absolute', width: size * .42, height: size * .56,
                left: size * .42, top: size * .36, borderWidth: size * .085,
                borderColor: color, borderLeftColor: 'transparent', borderTopColor: 'transparent',
                borderBottomRightRadius: size * .21, borderTopRightRadius: size * .13,
                borderBottomLeftRadius: size * .11,
            }, hook]} />
            <Animated.View style={[{
                position: 'absolute', width: size * .17, height: size * .23,
                left: size * .45, top: size * .34, borderRadius: size * .07, backgroundColor: coreColor,
            }, core]} />
            <Animated.View style={[{
                position: 'absolute', width: size * .09, height: size * .21,
                left: size * .77, top: size * .08, borderRadius: size * .035, backgroundColor: color,
            }, fragment]} />
        </View>
    );
}
