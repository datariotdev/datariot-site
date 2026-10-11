import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface OrbitGlyphProps {
    color: string;
    size?: number;
}

/** Three dots circling a core: Orvelis's mark. Spins slowly, on its own. */
export function OrbitGlyph({ color, size = 28 }: OrbitGlyphProps) {
    const spin = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 3600, easing: Easing.linear, useNativeDriver: true }));
        loop.start();
        return () => loop.stop();
    }, [spin]);

    const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const dot = size * 0.2;
    const core = size * 0.36;
    const r = size / 2 - dot / 2;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
                {[0, 120, 240].map(deg => {
                    const a = (deg * Math.PI) / 180;
                    return (
                        <View
                            key={deg}
                            style={{
                                position: 'absolute',
                                width: dot,
                                height: dot,
                                borderRadius: dot / 2,
                                backgroundColor: color,
                                left: size / 2 + Math.sin(a) * r - dot / 2,
                                top: size / 2 - Math.cos(a) * r - dot / 2,
                            }}
                        />
                    );
                })}
            </Animated.View>
            <View style={{ width: core, height: core, borderRadius: core / 2, backgroundColor: color }} />
        </View>
    );
}
