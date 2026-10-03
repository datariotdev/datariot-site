import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@components/UI/BlurView';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { theme, ICE, INK } from '../../design-system/theme';
import { FONT } from '../../design-system/fonts';
import { pixelClip } from '@design-system/pixel';

interface DNAMatchCardProps {
    creator: {
        id: string;
        username: string;
        avatarUrl: string;
        matchPercent: number;
        topInterest: string;
        bio: string;
    };
    onPress: () => void;
}

export const DNAMatchCard: React.FC<DNAMatchCardProps> = ({ creator, onPress }) => {
    const { width } = useWindowDimensions();
    const cardWidth = width - 32;

    return (
        <Animated.View
            entering={FadeInDown.duration(800).delay(200)}
            style={[styles.container, { width: cardWidth }]}
        >
            <Pressable onPress={onPress} style={styles.card}>
                <Image
                    source={{ uri: creator.avatarUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />

                <LinearGradient
                    colors={['transparent', 'rgba(7,8,12,0.55)', '#07080C']}
                    locations={[0, 0.4, 1]}
                    style={StyleSheet.absoluteFill}
                />

                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <View style={styles.matchBadge}>
                            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                            <MaterialCommunityIcons name="molecule" size={16} color={ICE} />
                            <Text style={styles.matchText}>{creator.matchPercent}% DNA MATCH</Text>
                        </View>

                        <View style={[styles.interestBadge, pixelClip(2)]}>
                            <Text style={styles.interestText}>{creator.topInterest.toUpperCase()}</Text>
                        </View>
                    </View>

                    <View style={styles.bottomInfo}>
                        <Text style={styles.username}>@{creator.username}</Text>
                        <Text style={styles.bio} numberOfLines={2}>{creator.bio}</Text>

                        <View style={styles.actionRow}>
                            <View style={styles.previewStats}>
                                <View style={styles.stat}>
                                    <Ionicons name="chatbubbles-outline" size={14} color="rgba(255,255,255,0.6)" />
                                    <Text style={styles.statValue}>1.2k</Text>
                                </View>
                                <View style={styles.stat}>
                                    <Ionicons name="videocam-outline" size={14} color="rgba(255,255,255,0.6)" />
                                    <Text style={styles.statValue}>48</Text>
                                </View>
                            </View>

                            <Pressable style={[styles.exploreButton, pixelClip(4)]} onPress={onPress}>
                                <Text style={styles.exploreButtonText}>EXPLORE DNA</Text>
                                <Ionicons name="arrow-forward" size={16} color={INK} />
                            </Pressable>
                        </View>
                    </View>
                </View>

                <View style={styles.dnaDecoration}>
                    <MaterialCommunityIcons name="dna" size={120} color="rgba(218, 230, 247, 0.1)" />
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 380,
        marginHorizontal: 16,
        ...pixelClip(6),
        overflow: 'hidden',
        backgroundColor: '#07080C',
        borderWidth: 1,
        borderColor: 'rgba(218, 230, 247, 0.14)',
    },
    card: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
        zIndex: 2,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    matchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        ...pixelClip(5),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(218, 230, 247, 0.3)',
        gap: 6,
    },
    matchText: {
        color: '#DAE6F7',
        fontFamily: FONT.techBold,
        fontSize: 10,
        letterSpacing: 1.5,
    },
    interestBadge: {
        backgroundColor: '#DAE6F7',
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    interestText: {
        color: '#07080C',
        fontFamily: FONT.techBold,
        fontSize: 10,
        letterSpacing: 1,
    },
    bottomInfo: {
        gap: 6,
    },
    username: {
        color: '#EEF2FA',
        fontFamily: FONT.display,
        fontSize: 30,
        letterSpacing: 0.6,
    },
    bio: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: theme.typography.fontFamilies.regular,
        fontSize: 14,
        lineHeight: 20,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
    },
    previewStats: {
        flexDirection: 'row',
        gap: 16,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        color: 'rgba(255,255,255,0.5)',
        fontFamily: theme.typography.fontFamilies.medium,
        fontSize: 12,
    },
    exploreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DAE6F7',
        paddingHorizontal: 18,
        paddingVertical: 10,
        gap: 8,
    },
    exploreButtonText: {
        color: '#07080C',
        fontFamily: FONT.techBold,
        fontSize: 11,
        letterSpacing: 1,
    },
    dnaDecoration: {
        position: 'absolute',
        top: -20,
        right: -30,
        opacity: 0.5,
        zIndex: 1,
    },
});
