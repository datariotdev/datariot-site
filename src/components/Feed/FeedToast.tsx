import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ON_VIDEO, RADIUS } from '../../design-system/ui';
import { Txt } from '../core/Txt';

/** A short confirmation that fades in under the header and out again. Pass a new `id` to show it. */
export function FeedToast({ message, id, top }: { message: string; id: number; top: number }) {
    const opacity = useRef(new Animated.Value(0)).current;
    const y = useRef(new Animated.Value(-8)).current;

    useEffect(() => {
        if (!id) return;
        opacity.setValue(0);
        y.setValue(-8);
        Animated.sequence([
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
                Animated.timing(y, { toValue: 0, duration: 160, useNativeDriver: true }),
            ]),
            Animated.delay(1500),
            Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }),
        ]).start();
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!id) return null;
    return (
        <View pointerEvents="none" style={[styles.wrap, { top }]}>
            <Animated.View style={[styles.pill, { opacity, transform: [{ translateY: y }] }]}>
                <Txt variant="callout" tone="onVideo">{message}</Txt>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 60 },
    pill: {
        paddingHorizontal: 16,
        height: 38,
        borderRadius: RADIUS.pill,
        backgroundColor: ON_VIDEO.glassStrong,
        justifyContent: 'center',
    },
});
