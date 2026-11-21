import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated, Easing, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePalette } from '../../design-system/palette';

interface ArenaHeroClashProps {
    onPress: () => void;
    clash?: {
        id: string;
        clashNumber: number;
        category: string;
        title: string;
        spectators: number;
        logicPool: number;
        argumentsCount: number;
        pro: {
            username: string;
            avatarUrl: string;
            percentage: number;
        };
        con: {
            username: string;
            avatarUrl: string;
            percentage: number;
        };
    };
}

export const ArenaHeroClash: React.FC<ArenaHeroClashProps> = ({
    onPress,
    clash = {
        id: 'clash-live-01',
        clashNumber: 89,
        category: 'AI & TRANSHUMANISM',
        title: 'Will Artificial Consciousness have legal & moral personhood before 2035?',
        spectators: 1420,
        logicPool: 48500,
        argumentsCount: 156,
        pro: {
            username: 'dr_orvelis',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
            percentage: 64,
        },
        con: {
            username: 'humanist_dao',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
            percentage: 36,
        },
    },
}) => {
    const p = usePalette();
    const { width } = useWindowDimensions();
    const cardWidth = Math.min(width - 32, 540);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.35,
                    duration: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        const glow = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 0.85,
                    duration: 1600,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.4,
                    duration: 1600,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ])
        );

        pulse.start();
        glow.start();

        return () => {
            pulse.stop();
            glow.stop();
        };
    }, [pulseAnim, glowAnim]);

    return (
        <View style={[styles.wrapper, { width: cardWidth }]}>
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    styles.card,
                    {
                        borderColor: p.isDark ? 'rgba(217, 228, 255, 0.16)' : 'rgba(7, 8, 12, 0.12)',
                        backgroundColor: p.isDark ? '#0A0C14' : '#FFFFFF',
                    },
                    pressed && { transform: [{ scale: 0.985 }] },
                ]}
            >
                {/* Background Cyber Gradient */}
                <LinearGradient
                    colors={
                        p.isDark
                            ? ['rgba(217, 228, 255, 0.08)', 'rgba(7, 8, 16, 0.95)', '#06070B']
                            : ['rgba(217, 228, 255, 0.45)', 'rgba(240, 245, 255, 0.85)', '#FFFFFF']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                {/* Animated Atmospheric Corner Glow */}
                <Animated.View
                    style={[
                        styles.cornerGlow,
                        {
                            opacity: glowAnim,
                            backgroundColor: p.isDark ? 'rgba(99, 140, 255, 0.22)' : 'rgba(76, 110, 245, 0.15)',
                        },
                    ]}
                />

                {/* Top Badge & Live Status */}
                <View style={styles.topRow}>
                    <View
                        style={[
                            styles.categoryBadge,
                            {
                                backgroundColor: p.isDark ? 'rgba(217, 228, 255, 0.10)' : 'rgba(7, 8, 12, 0.06)',
                                borderColor: p.isDark ? 'rgba(217, 228, 255, 0.18)' : 'rgba(7, 8, 12, 0.1)',
                            },
                        ]}
                    >
                        <MaterialCommunityIcons name="sword-cross" size={13} color={p.isDark ? '#D9E4FF' : '#07080C'} />
                        <Text style={[styles.categoryText, { color: p.text, fontFamily: p.fonts.bold }]}>
                            {clash.category}
                        </Text>
                    </View>

                    <View style={styles.liveBadge}>
                        <Animated.View
                            style={[
                                styles.livePulseDot,
                                {
                                    transform: [{ scale: pulseAnim }],
                                },
                            ]}
                        />
                        <View style={styles.liveCoreDot} />
                        <Text style={[styles.liveText, { fontFamily: p.fonts.extrabold }]}>
                            LIVE CLASH #{clash.clashNumber}
                        </Text>
                    </View>
                </View>

                {/* Question / Debate Topic */}
                <Text style={[styles.title, { color: p.text, fontFamily: p.fonts.extrabold }]} numberOfLines={3}>
                    {clash.title}
                </Text>

                {/* Combatants & Tension Meter */}
                <View style={styles.arenaDuel}>
                    {/* Combatant A (PRO) */}
                    <View style={styles.combatantRow}>
                        <View style={styles.combatant}>
                            <View style={[styles.avatarWrap, { borderColor: '#38BDF8' }]}>
                                <Image source={{ uri: clash.pro.avatarUrl }} style={styles.avatar} />
                                <View style={[styles.sideTag, { backgroundColor: '#38BDF8' }]}>
                                    <Text style={styles.sideTagText}>PRO</Text>
                                </View>
                            </View>
                            <View style={styles.combatantInfo}>
                                <Text style={[styles.combatantName, { color: p.text, fontFamily: p.fonts.bold }]}>
                                    @{clash.pro.username}
                                </Text>
                                <Text style={[styles.percentage, { color: '#38BDF8', fontFamily: p.fonts.extrabold }]}>
                                    {clash.pro.percentage}%
                                </Text>
                            </View>
                        </View>

                        <View style={styles.vsBadge}>
                            <Text style={[styles.vsText, { fontFamily: p.fonts.black, color: p.sub }]}>VS</Text>
                        </View>

                        {/* Combatant B (CON) */}
                        <View style={[styles.combatant, styles.combatantRight]}>
                            <View style={styles.combatantInfoRight}>
                                <Text style={[styles.combatantName, { color: p.text, fontFamily: p.fonts.bold }]}>
                                    @{clash.con.username}
                                </Text>
                                <Text style={[styles.percentage, { color: '#F43F5E', fontFamily: p.fonts.extrabold }]}>
                                    {clash.con.percentage}%
                                </Text>
                            </View>
                            <View style={[styles.avatarWrap, { borderColor: '#F43F5E' }]}>
                                <Image source={{ uri: clash.con.avatarUrl }} style={styles.avatar} />
                                <View style={[styles.sideTag, { backgroundColor: '#F43F5E' }]}>
                                    <Text style={styles.sideTagText}>CON</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Dynamic Split Tension Meter */}
                    <View style={styles.tensionTrack}>
                        <View
                            style={[
                                styles.tensionPro,
                                {
                                    width: `${clash.pro.percentage}%`,
                                    backgroundColor: '#38BDF8',
                                },
                            ]}
                        />
                        <View style={styles.tensionBlade} />
                        <View
                            style={[
                                styles.tensionCon,
                                {
                                    width: `${clash.con.percentage}%`,
                                    backgroundColor: '#F43F5E',
                                },
                            ]}
                        />
                    </View>
                </View>

                {/* Footer Stats & CTA */}
                <View
                    style={[
                        styles.footer,
                        {
                            borderTopColor: p.isDark ? 'rgba(217, 228, 255, 0.08)' : 'rgba(7, 8, 12, 0.06)',
                        },
                    ]}
                >
                    <View style={styles.statsGroup}>
                        <View style={styles.statItem}>
                            <Ionicons name="eye-outline" size={13} color={p.sub} />
                            <Text style={[styles.statText, { color: p.sub, fontFamily: p.fonts.medium }]}>
                                {clash.spectators.toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.statDot} />
                        <View style={styles.statItem}>
                            <MaterialCommunityIcons name="molecule" size={14} color={p.isDark ? '#D9E4FF' : '#4C6EF5'} />
                            <Text style={[styles.statText, { color: p.text, fontFamily: p.fonts.bold }]}>
                                {(clash.logicPool / 1000).toFixed(1)}K LOGIC
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[
                            styles.enterBtn,
                            {
                                backgroundColor: p.accent,
                            },
                        ]}
                    >
                        <Text style={[styles.enterBtnText, { color: p.onAccent, fontFamily: p.fonts.extrabold }]}>
                            ENTER ARENA
                        </Text>
                        <Ionicons name="flash" size={13} color={p.onAccent} />
                    </View>
                </View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        alignSelf: 'center',
        marginHorizontal: 16,
        marginVertical: 6,
    },
    card: {
        borderRadius: 26,
        borderWidth: 1,
        padding: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 8,
    },
    cornerGlow: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 180,
        height: 180,
        borderRadius: 90,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 10.5,
        letterSpacing: 0.8,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: 'rgba(244, 63, 94, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(244, 63, 94, 0.35)',
    },
    livePulseDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#F43F5E',
        marginRight: 6,
    },
    liveCoreDot: {
        position: 'absolute',
        left: 10,
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#F43F5E',
    },
    liveText: {
        fontSize: 10.5,
        color: '#F43F5E',
        letterSpacing: 0.8,
    },
    title: {
        fontSize: 20,
        lineHeight: 27,
        letterSpacing: -0.4,
        marginBottom: 18,
    },
    arenaDuel: {
        marginBottom: 16,
    },
    combatantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    combatant: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    combatantRight: {
        justifyContent: 'flex-end',
    },
    avatarWrap: {
        position: 'relative',
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        padding: 2,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    sideTag: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 6,
    },
    sideTagText: {
        color: '#FFFFFF',
        fontSize: 8.5,
        fontWeight: '900',
    },
    combatantInfo: {
        gap: 2,
    },
    combatantInfoRight: {
        alignItems: 'flex-end',
        gap: 2,
    },
    combatantName: {
        fontSize: 13,
    },
    percentage: {
        fontSize: 16,
    },
    vsBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    vsText: {
        fontSize: 11,
        letterSpacing: 1,
    },
    tensionTrack: {
        height: 6,
        borderRadius: 3,
        flexDirection: 'row',
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        position: 'relative',
    },
    tensionPro: {
        height: '100%',
    },
    tensionBlade: {
        width: 2,
        height: '100%',
        backgroundColor: '#FFFFFF',
        zIndex: 2,
    },
    tensionCon: {
        height: '100%',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 14,
        borderTopWidth: 1,
    },
    statsGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    statText: {
        fontSize: 12,
    },
    statDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(150, 150, 150, 0.4)',
    },
    enterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
    },
    enterBtnText: {
        fontSize: 11.5,
        letterSpacing: 0.6,
    },
});
