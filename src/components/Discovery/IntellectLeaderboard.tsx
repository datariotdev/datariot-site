import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePalette } from '../../design-system/palette';

export interface IntellectItem {
    id: string;
    username: string;
    avatarUrl: string;
    logicScore: number;
    activity: string;
    isFollowing?: boolean;
}

interface IntellectLeaderboardProps {
    intellects: IntellectItem[];
    onFollow: (id: string) => void;
    onPress: (id: string) => void;
}

export const IntellectLeaderboard: React.FC<IntellectLeaderboardProps> = ({
    intellects,
    onFollow,
    onPress,
}) => {
    const p = usePalette();
    const { width } = useWindowDimensions();
    const contentWidth = Math.min(width - 32, 540);

    return (
        <View style={[styles.container, { width: contentWidth }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={[styles.beaconDot, { backgroundColor: p.isDark ? '#38BDF8' : '#07080C' }]} />
                    <Text style={[styles.headerTitle, { color: p.text, fontFamily: p.fonts.extrabold }]}>
                        ELITE MINDS
                    </Text>
                </View>
                <Text style={[styles.headerSubtitle, { color: p.faint, fontFamily: p.fonts.tech }]}>
                    TOP LOGIC ARCHITECTS
                </Text>
            </View>

            {/* Thinker List */}
            <View style={styles.list}>
                {intellects.slice(0, 4).map((item, idx) => {
                    const rank = `#0${idx + 1}`;
                    const isTop1 = idx === 0;

                    return (
                        <Pressable
                            key={item.id}
                            onPress={() => onPress(item.id)}
                            style={({ pressed }) => [
                                styles.card,
                                {
                                    backgroundColor: p.isDark ? '#0C0E17' : '#FFFFFF',
                                    borderColor: isTop1
                                        ? (p.isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(7, 8, 12, 0.12)')
                                        : (p.isDark ? 'rgba(217, 228, 255, 0.08)' : 'rgba(7, 8, 12, 0.06)'),
                                },
                                pressed && { transform: [{ scale: 0.985 }] },
                            ]}
                        >
                            {/* Rank Badge */}
                            <View
                                style={[
                                    styles.rankBadge,
                                    {
                                        backgroundColor: isTop1
                                            ? (p.isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(7, 8, 12, 0.06)')
                                            : (p.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'),
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.rankText,
                                        {
                                            color: isTop1 ? (p.isDark ? '#38BDF8' : '#07080C') : p.faint,
                                            fontFamily: p.fonts.black,
                                        },
                                    ]}
                                >
                                    {rank}
                                </Text>
                            </View>

                            {/* Avatar with Glow ring */}
                            <View
                                style={[
                                    styles.avatarRing,
                                    {
                                        borderColor: isTop1 ? '#38BDF8' : (p.isDark ? 'rgba(217, 228, 255, 0.2)' : 'rgba(7, 8, 12, 0.1)'),
                                    },
                                ]}
                            >
                                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                            </View>

                            {/* Info */}
                            <View style={styles.info}>
                                <View style={styles.userRow}>
                                    <Text style={[styles.username, { color: p.text, fontFamily: p.fonts.bold }]} numberOfLines={1}>
                                        @{item.username}
                                    </Text>
                                    <Ionicons name="checkmark-circle" size={13} color={p.isDark ? '#38BDF8' : '#2563EB'} />
                                </View>

                                <Text style={[styles.activity, { color: p.sub, fontFamily: p.fonts.regular }]} numberOfLines={1}>
                                    {item.activity}
                                </Text>

                                <View style={styles.scoreRow}>
                                    <MaterialCommunityIcons name="molecule" size={12} color={p.isDark ? '#38BDF8' : '#07080C'} />
                                    <Text style={[styles.scoreText, { color: p.text, fontFamily: p.fonts.extrabold }]}>
                                        {item.logicScore.toLocaleString()} LOGIC
                                    </Text>
                                </View>
                            </View>

                            {/* Follow Button */}
                            <Pressable
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onFollow(item.id);
                                }}
                                style={({ pressed }) => [
                                    styles.followBtn,
                                    item.isFollowing
                                        ? {
                                            backgroundColor: p.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                                            borderColor: p.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                                        }
                                        : {
                                            backgroundColor: p.accent,
                                            borderColor: p.accent,
                                        },
                                    pressed && { transform: [{ scale: 0.94 }] },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.followBtnText,
                                        {
                                            color: item.isFollowing ? p.sub : p.onAccent,
                                            fontFamily: p.fonts.bold,
                                        },
                                    ]}
                                >
                                    {item.isFollowing ? 'Following' : '+ Follow'}
                                </Text>
                            </Pressable>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'center',
        marginHorizontal: 16,
        marginVertical: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    beaconDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    headerTitle: {
        fontSize: 13,
        letterSpacing: 1.2,
    },
    headerSubtitle: {
        fontSize: 11,
        letterSpacing: 0.6,
    },
    list: {
        gap: 10,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 18,
        borderWidth: 1,
    },
    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    rankText: {
        fontSize: 11,
        letterSpacing: -0.2,
    },
    avatarRing: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        padding: 2,
        marginRight: 12,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    info: {
        flex: 1,
        gap: 2,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    username: {
        fontSize: 14,
        letterSpacing: -0.2,
    },
    activity: {
        fontSize: 11.5,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    scoreText: {
        fontSize: 11,
        letterSpacing: 0.3,
    },
    followBtn: {
        paddingHorizontal: 13,
        paddingVertical: 7,
        borderRadius: 12,
        borderWidth: 1,
        minWidth: 78,
        alignItems: 'center',
        justifyContent: 'center',
    },
    followBtnText: {
        fontSize: 11.5,
        letterSpacing: 0.3,
    },
});
