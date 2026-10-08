import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';

const ICE = '#DAE6F7';
const INK = '#07080C';

// A 5x5 dot-matrix cross, drawn dot by dot like the Doto digits
const X_DOTS: Array<[number, number]> = [
    [0, 0], [1, 1], [2, 2], [3, 3], [4, 4],
    [4, 0], [3, 1], [1, 3], [0, 4],
];
const DOT = 3;
const GAP = 2;

const pad = (n: number) => n.toString().padStart(2, '0');

interface PlayerTopBarProps {
    index: number;
    total: number;
    onClose: () => void;
    onAsk: () => void;
}

export function PlayerTopBar({ index, total, onClose, onAsk }: PlayerTopBarProps) {
    const { width } = useWindowDimensions();
    const compact = width < 360;

    const spin = useRef(new Animated.Value(0)).current;
    const ping = useRef(new Animated.Value(0)).current;
    const blink = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loops = [
            Animated.loop(Animated.timing(spin, { toValue: 1, duration: 3600, easing: Easing.linear, useNativeDriver: true })),
            Animated.loop(Animated.timing(ping, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true })),
            Animated.loop(Animated.sequence([
                Animated.timing(blink, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(blink, { toValue: 0, duration: 900, useNativeDriver: true }),
            ])),
        ];
        loops.forEach(l => l.start());
        return () => loops.forEach(l => l.stop());
    }, [spin, ping, blink]);

    const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const pingScale = ping.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
    const pingOpacity = ping.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
    const liveOpacity = blink.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

    // A window of up to 9 ticks around the playing video
    const WINDOW = 9;
    const shown = Math.min(total, WINDOW);
    const start = Math.max(0, Math.min(index - Math.floor(WINDOW / 2), total - shown));
    const ticks = Array.from({ length: shown }, (_, i) => start + i);

    return (
        <View style={styles.row} pointerEvents="box-none">
            {/* Close: a cross made of dots */}
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close" style={styles.closeHit}>
                <BlurView intensity={30} tint="dark" style={styles.closeGlass}>
                    <View style={styles.xBox}>
                        {X_DOTS.map(([cx, cy]) => (
                            <View
                                key={`${cx}${cy}`}
                                style={[styles.xDot, { left: cx * (DOT + GAP), top: cy * (DOT + GAP) }]}
                            />
                        ))}
                    </View>
                </BlurView>
            </Pressable>

            {/* Where you are in the feed */}
            <View style={styles.center} pointerEvents="none">
                <BlurView intensity={30} tint="dark" style={styles.counter}>
                    <Animated.View style={[styles.liveDot, { opacity: liveOpacity }]} />
                    <Text style={styles.counterText}>{pad(index + 1)}</Text>
                    <Text style={styles.counterSlash}>/</Text>
                    <Text style={styles.counterTotal}>{pad(Math.max(total, 1))}</Text>
                </BlurView>
                {total > 1 && (
                    <View style={styles.rail}>
                        {ticks.map(i => (
                            <View key={i} style={[styles.tick, i === index && styles.tickActive]} />
                        ))}
                    </View>
                )}
            </View>

            {/* Orvelis */}
            <View style={styles.askWrap}>
                <Animated.View
                    pointerEvents="none"
                    style={[styles.halo, { opacity: pingOpacity, transform: [{ scale: pingScale }] }]}
                />
                <Pressable onPress={onAsk} accessibilityRole="button" accessibilityLabel="Ask Orvelis" style={[styles.ask, compact && styles.askCompact]}>
                    <View style={styles.orb}>
                        <Animated.View style={[styles.orbit, { transform: [{ rotate }] }]}>
                            <View style={[styles.orbitDot, { top: 0, left: 8 }]} />
                            <View style={[styles.orbitDot, { top: 13, left: 14.5 }]} />
                            <View style={[styles.orbitDot, { top: 13, left: 1.5 }]} />
                        </Animated.View>
                        <View style={styles.orbCore} />
                    </View>
                    {!compact && <Text style={styles.askText}>ORVELIS</Text>}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        height: 44,
    },
    closeHit: {
        width: 40,
        height: 40,
    },
    closeGlass: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(7,8,12,0.45)',
        borderWidth: 1,
        borderColor: 'rgba(218,230,247,0.26)',
    },
    xBox: {
        width: 5 * DOT + 4 * GAP,
        height: 5 * DOT + 4 * GAP,
    },
    xDot: {
        position: 'absolute',
        width: DOT,
        height: DOT,
        borderRadius: DOT / 2,
        backgroundColor: ICE,
    },
    center: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        alignItems: 'center',
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 32,
        paddingHorizontal: 12,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(7,8,12,0.45)',
        borderWidth: 1,
        borderColor: 'rgba(218,230,247,0.26)',
    },
    liveDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: ICE,
        marginRight: 8,
    },
    counterText: {
        fontFamily: 'Doto_900Black',
        fontSize: 19,
        letterSpacing: 1,
        color: ICE,
    },
    counterSlash: {
        fontFamily: 'Doto_700Bold',
        fontSize: 17,
        color: 'rgba(218,230,247,0.45)',
        marginHorizontal: 3,
    },
    counterTotal: {
        fontFamily: 'Doto_700Bold',
        fontSize: 17,
        letterSpacing: 1,
        color: 'rgba(218,230,247,0.6)',
    },
    rail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
    },
    tick: {
        width: 5,
        height: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(218,230,247,0.28)',
    },
    tickActive: {
        width: 18,
        backgroundColor: ICE,
    },
    askWrap: {
        height: 40,
        justifyContent: 'center',
    },
    halo: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        borderRadius: 20,
        backgroundColor: ICE,
    },
    ask: {
        height: 40,
        minWidth: 40,
        borderRadius: 20,
        paddingLeft: 11,
        paddingRight: 11,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ICE,
    },
    askCompact: {
        width: 40,
        paddingLeft: 0,
        paddingRight: 0,
    },
    orb: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orbit: {
        position: 'absolute',
        width: 20,
        height: 20,
    },
    orbitDot: {
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: INK,
    },
    orbCore: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: INK,
    },
    askText: {
        marginLeft: 8,
        fontFamily: 'Doto_900Black',
        fontSize: 15,
        letterSpacing: 1.2,
        color: INK,
    },
});
