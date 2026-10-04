import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useUI } from '../../design-system/ui';

/** A block that breathes while content loads. */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
    const { c } = useUI();
    const o = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(o, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(o, { toValue: 0.5, duration: 800, useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [o]);

    return <Animated.View style={[{ backgroundColor: c.surface, borderRadius: 14, opacity: o }, style]} />;
}
