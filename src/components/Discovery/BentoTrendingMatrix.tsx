import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { usePalette } from '../../design-system/palette';

interface BentoTrendingMatrixProps {
    onSelectTopic: (topicQuery: string) => void;
}

export const BentoTrendingMatrix: React.FC<BentoTrendingMatrixProps> = ({ onSelectTopic }) => {
    const p = usePalette();
    const { width } = useWindowDimensions();
    const contentWidth = Math.min(width - 32, 540);
    const halfCardWidth = (contentWidth - 12) / 2;

    const topics = {
        primary: {
            id: 'crisis',
            tag: '🔥 TOPIC #01 • 98% PULSE',
            title: 'Global Resource Crisis',
            desc: 'Autonomous logistics, deep sea mining & ethical allocation protocols.',
            icon: 'earth',
            stats: '142 CLASHES',
            proPercent: 68,
            query: 'Global Resource Crisis',
            accent: '#38BDF8',
        },
        secondaryLeft: {
            id: 'mars',
            tag: '🚀 92% PULSE',
            title: 'Mars Colony 2040',
            desc: 'Interplanetary sovereignty & space law.',
            icon: 'rocket-launch-outline',
            stats: '86 CLASHES',
            query: 'Mars Colony in 2040',
            accent: '#FB923C',
        },
        secondaryRight: {
            id: 'bitcoin',
            tag: '🌐 95% PULSE',
            title: 'Bitcoin vs TradFi',
            desc: 'Decentralized assets & sovereign reserves.',
            icon: 'currency-btc',
            stats: '312 CLASHES',
            query: 'Bitcoin vs Traditional Finance',
            accent: '#FBBF24',
        },
        tertiary: {
            id: 'neural',
            tag: '⚡ 89% PULSE',
            title: 'Neural Interfaces & Free Will',
            desc: 'Cognitive sovereignty, synthetic memory and privacy in the era of neural links.',
            icon: 'brain',
            stats: '94 CLASHES',
            query: 'Neural Interfaces',
            accent: '#A78BFA',
        },
    };

    return (
        <View style={[styles.container, { width: contentWidth }]}>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <View style={styles.headerTitleGroup}>
                    <View style={[styles.liveDot, { backgroundColor: p.isDark ? '#38BDF8' : '#07080C' }]} />
                    <Text style={[styles.sectionTitle, { color: p.text, fontFamily: p.fonts.extrabold }]}>
                        TRENDING MATRIX
                    </Text>
                </View>
                <Text style={[styles.sectionMeta, { color: p.faint, fontFamily: p.fonts.tech }]}>
                    PULSE &gt; 85%
                </Text>
            </View>

            {/* Bento Grid */}
            <View style={styles.grid}>
                {/* 1. Primary Full-Width Bento */}
                <Pressable
                    onPress={() => onSelectTopic(topics.primary.query)}
                    style={({ pressed }) => [
                        styles.primaryCard,
                        {
                            borderColor: p.isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(7, 8, 12, 0.08)',
                            backgroundColor: p.isDark ? '#0C0E17' : '#FFFFFF',
                        },
                        pressed && { transform: [{ scale: 0.985 }] },
                    ]}
                >
                    <LinearGradient
                        colors={
                            p.isDark
                                ? ['rgba(56, 189, 248, 0.09)', 'rgba(12, 14, 23, 0.95)', '#090A10']
                                : ['rgba(56, 189, 248, 0.12)', 'rgba(240, 245, 255, 0.8)', '#FFFFFF']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.cardHeaderRow}>
                        <View
                            style={[
                                styles.pulsePill,
                                {
                                    backgroundColor: p.isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.14)',
                                    borderColor: p.isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(56, 189, 248, 0.25)',
                                },
                            ]}
                        >
                            <Text style={[styles.pulsePillText, { color: p.isDark ? '#38BDF8' : '#0284C7', fontFamily: p.fonts.extrabold }]}>
                                {topics.primary.tag}
                            </Text>
                        </View>

                        <View style={[styles.iconCircle, { backgroundColor: p.isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.1)' }]}>
                            <MaterialCommunityIcons name={topics.primary.icon as any} size={22} color={p.isDark ? '#38BDF8' : '#0284C7'} />
                        </View>
                    </View>

                    <Text style={[styles.primaryTitle, { color: p.text, fontFamily: p.fonts.bold }]}>
                        {topics.primary.title}
                    </Text>

                    <Text style={[styles.primaryDesc, { color: p.sub, fontFamily: p.fonts.regular }]} numberOfLines={2}>
                        {topics.primary.desc}
                    </Text>

                    {/* Mini Pulse / Tension Track */}
                    <View style={styles.primaryFooter}>
                        <View style={styles.miniGaugeWrap}>
                            <View style={styles.miniGaugeTrack}>
                                <View style={[styles.miniGaugeFill, { width: `${topics.primary.proPercent}%`, backgroundColor: '#38BDF8' }]} />
                            </View>
                            <Text style={[styles.miniGaugeText, { color: p.sub, fontFamily: p.fonts.medium }]}>
                                {topics.primary.proPercent}% PRO
                            </Text>
                        </View>

                        <View style={styles.clashCounter}>
                            <Ionicons name="flame" size={13} color="#FB923C" />
                            <Text style={[styles.clashCountText, { color: p.text, fontFamily: p.fonts.bold }]}>
                                {topics.primary.stats}
                            </Text>
                            <Feather name="arrow-up-right" size={14} color={p.sub} style={{ marginLeft: 4 }} />
                        </View>
                    </View>
                </Pressable>

                {/* 2 & 3. Half-Width Row */}
                <View style={styles.row}>
                    {/* Left Card */}
                    <Pressable
                        onPress={() => onSelectTopic(topics.secondaryLeft.query)}
                        style={({ pressed }) => [
                            styles.halfCard,
                            {
                                width: halfCardWidth,
                                borderColor: p.isDark ? 'rgba(251, 146, 60, 0.22)' : 'rgba(7, 8, 12, 0.08)',
                                backgroundColor: p.isDark ? '#0C0E17' : '#FFFFFF',
                            },
                            pressed && { transform: [{ scale: 0.98 }] },
                        ]}
                    >
                        <LinearGradient
                            colors={
                                p.isDark
                                    ? ['rgba(251, 146, 60, 0.08)', '#090A10']
                                    : ['rgba(251, 146, 60, 0.1)', '#FFFFFF']
                            }
                            style={StyleSheet.absoluteFill}
                        />

                        <View style={styles.halfCardTop}>
                            <View style={[styles.iconCircleSmall, { backgroundColor: p.isDark ? 'rgba(251, 146, 60, 0.15)' : 'rgba(251, 146, 60, 0.1)' }]}>
                                <MaterialCommunityIcons name={topics.secondaryLeft.icon as any} size={18} color="#FB923C" />
                            </View>
                            <Text style={[styles.miniBadge, { color: '#FB923C', fontFamily: p.fonts.bold }]}>
                                {topics.secondaryLeft.tag}
                            </Text>
                        </View>

                        <Text style={[styles.halfTitle, { color: p.text, fontFamily: p.fonts.bold }]} numberOfLines={1}>
                            {topics.secondaryLeft.title}
                        </Text>
                        <Text style={[styles.halfDesc, { color: p.sub, fontFamily: p.fonts.regular }]} numberOfLines={2}>
                            {topics.secondaryLeft.desc}
                        </Text>

                        <View style={styles.halfFoot}>
                            <Text style={[styles.halfStats, { color: p.faint, fontFamily: p.fonts.tech }]}>
                                {topics.secondaryLeft.stats}
                            </Text>
                            <Feather name="arrow-up-right" size={13} color={p.sub} />
                        </View>
                    </Pressable>

                    {/* Right Card */}
                    <Pressable
                        onPress={() => onSelectTopic(topics.secondaryRight.query)}
                        style={({ pressed }) => [
                            styles.halfCard,
                            {
                                width: halfCardWidth,
                                borderColor: p.isDark ? 'rgba(251, 191, 36, 0.22)' : 'rgba(7, 8, 12, 0.08)',
                                backgroundColor: p.isDark ? '#0C0E17' : '#FFFFFF',
                            },
                            pressed && { transform: [{ scale: 0.98 }] },
                        ]}
                    >
                        <LinearGradient
                            colors={
                                p.isDark
                                    ? ['rgba(251, 191, 36, 0.08)', '#090A10']
                                    : ['rgba(251, 191, 36, 0.1)', '#FFFFFF']
                            }
                            style={StyleSheet.absoluteFill}
                        />

                        <View style={styles.halfCardTop}>
                            <View style={[styles.iconCircleSmall, { backgroundColor: p.isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)' }]}>
                                <MaterialCommunityIcons name={topics.secondaryRight.icon as any} size={18} color="#FBBF24" />
                            </View>
                            <Text style={[styles.miniBadge, { color: '#FBBF24', fontFamily: p.fonts.bold }]}>
                                {topics.secondaryRight.tag}
                            </Text>
                        </View>

                        <Text style={[styles.halfTitle, { color: p.text, fontFamily: p.fonts.bold }]} numberOfLines={1}>
                            {topics.secondaryRight.title}
                        </Text>
                        <Text style={[styles.halfDesc, { color: p.sub, fontFamily: p.fonts.regular }]} numberOfLines={2}>
                            {topics.secondaryRight.desc}
                        </Text>

                        <View style={styles.halfFoot}>
                            <Text style={[styles.halfStats, { color: p.faint, fontFamily: p.fonts.tech }]}>
                                {topics.secondaryRight.stats}
                            </Text>
                            <Feather name="arrow-up-right" size={13} color={p.sub} />
                        </View>
                    </Pressable>
                </View>

                {/* 4. Bottom Wide Card */}
                <Pressable
                    onPress={() => onSelectTopic(topics.tertiary.query)}
                    style={({ pressed }) => [
                        styles.bottomCard,
                        {
                            borderColor: p.isDark ? 'rgba(167, 139, 250, 0.22)' : 'rgba(7, 8, 12, 0.08)',
                            backgroundColor: p.isDark ? '#0C0E17' : '#FFFFFF',
                        },
                        pressed && { transform: [{ scale: 0.985 }] },
                    ]}
                >
                    <LinearGradient
                        colors={
                            p.isDark
                                ? ['rgba(167, 139, 250, 0.08)', '#090A10']
                                : ['rgba(167, 139, 250, 0.1)', '#FFFFFF']
                        }
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.bottomLeft}>
                        <View style={styles.bottomPillRow}>
                            <Text style={[styles.miniBadge, { color: '#A78BFA', fontFamily: p.fonts.bold }]}>
                                {topics.tertiary.tag}
                            </Text>
                            <Text style={[styles.bottomStats, { color: p.sub, fontFamily: p.fonts.tech }]}>
                                • {topics.tertiary.stats}
                            </Text>
                        </View>
                        <Text style={[styles.bottomTitle, { color: p.text, fontFamily: p.fonts.bold }]}>
                            {topics.tertiary.title}
                        </Text>
                        <Text style={[styles.bottomDesc, { color: p.sub, fontFamily: p.fonts.regular }]} numberOfLines={1}>
                            {topics.tertiary.desc}
                        </Text>
                    </View>

                    <View style={[styles.iconCircle, { backgroundColor: p.isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(167, 139, 250, 0.1)' }]}>
                        <MaterialCommunityIcons name={topics.tertiary.icon as any} size={22} color="#A78BFA" />
                    </View>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'center',
        marginHorizontal: 16,
        marginVertical: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    headerTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    sectionTitle: {
        fontSize: 13,
        letterSpacing: 1.2,
    },
    sectionMeta: {
        fontSize: 11,
        letterSpacing: 0.6,
    },
    grid: {
        gap: 12,
    },
    primaryCard: {
        borderRadius: 22,
        borderWidth: 1,
        padding: 18,
        overflow: 'hidden',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    pulsePill: {
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    pulsePillText: {
        fontSize: 10,
        letterSpacing: 0.6,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircleSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryTitle: {
        fontSize: 18,
        letterSpacing: -0.3,
        marginBottom: 6,
    },
    primaryDesc: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 14,
    },
    primaryFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
    },
    miniGaugeWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    miniGaugeTrack: {
        width: 64,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(150, 150, 150, 0.2)',
        overflow: 'hidden',
    },
    miniGaugeFill: {
        height: '100%',
    },
    miniGaugeText: {
        fontSize: 11,
    },
    clashCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    clashCountText: {
        fontSize: 11.5,
        letterSpacing: 0.4,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    halfCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 14,
        overflow: 'hidden',
    },
    halfCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    miniBadge: {
        fontSize: 10,
        letterSpacing: 0.5,
    },
    halfTitle: {
        fontSize: 14,
        letterSpacing: -0.2,
        marginBottom: 4,
    },
    halfDesc: {
        fontSize: 11.5,
        lineHeight: 16,
        marginBottom: 12,
    },
    halfFoot: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
    },
    halfStats: {
        fontSize: 10.5,
        letterSpacing: 0.5,
    },
    bottomCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    bottomLeft: {
        flex: 1,
        marginRight: 14,
    },
    bottomPillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    bottomStats: {
        fontSize: 10.5,
    },
    bottomTitle: {
        fontSize: 15,
        letterSpacing: -0.2,
        marginBottom: 3,
    },
    bottomDesc: {
        fontSize: 12,
    },
});
