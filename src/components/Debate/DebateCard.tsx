import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming, withSpring } from 'react-native-reanimated';
import { useTheme } from '../Theme/ThemeProvider';
import { Post } from '@lib/supabase/hooks/usePosts';
import { FONT } from '@design-system/fonts';
import { pixelClip } from '@design-system/pixel';

interface DebateCardProps {
    item: Post;
    onPress?: () => void;
    onDelete?: (id: string) => void;
    isOwnPost?: boolean;
    /** Outer spacing override, for laying cards out in columns. */
    style?: any;
}

export function DebateCard({ item, onPress, onDelete, isOwnPost, style }: DebateCardProps) {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const deleteScale = useSharedValue(1);

    const handleDeletePress = () => {
        deleteScale.value = withSequence(
            withTiming(1.2, { duration: 100 }),
            withSpring(1)
        );
        if (onDelete) onDelete(item.id);
    };

    const animatedDeleteStyle = useAnimatedStyle(() => ({
        transform: [{ scale: deleteScale.value }]
    }));

    // The Logic Score is currently stored in "likes"
    const threadWeight = item.likes;
    const argumentsCount = item.comments;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.card,
                pixelClip(6),
                {
                    backgroundColor: isDark ? 'rgba(218, 230, 247, 0.03)' : 'rgba(255, 255, 255, 0.6)',
                    borderColor: isDark ? 'rgba(218, 230, 247, 0.14)' : 'rgba(7, 8, 12, 0.14)',
                },
                style,
                pressed && { opacity: 0.8 }
            ]}
        >
            <View style={styles.header}>
                <View style={styles.authorRow}>
                    <View style={[styles.avatar, pixelClip(3), { borderColor: isDark ? 'rgba(218, 230, 247, 0.25)' : 'rgba(7, 8, 12, 0.2)' }]}>
                        {item.authorAvatar ? (
                            <Image source={{ uri: item.authorAvatar }} style={styles.avatarImage} />
                        ) : (
                            <Text style={[styles.avatarText, { color: theme.colors.text.primary, fontFamily: FONT.display }]}>
                                {item.authorName ? item.authorName[0].toUpperCase() : '?'}
                            </Text>
                        )}
                    </View>
                    <View style={styles.authorInfo}>
                        <Text style={[styles.authorName, { color: theme.colors.text.primary }]}>{item.authorName}</Text>
                        <Text style={[styles.date, { color: theme.colors.text.muted }]}>
                            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Text>
                    </View>
                </View>

                {item.isAiAssisted && (
                    <View style={[styles.aiBadge, pixelClip(2), { backgroundColor: theme.colors.primary.DEFAULT }]}>
                        <Ionicons name="sparkles" size={12} color={theme.colors.primary.onPrimary} />
                        <Text style={[styles.aiBadgeText, { color: theme.colors.primary.onPrimary }]}>LOGIC ORACLE</Text>
                    </View>
                )}

                {isOwnPost && onDelete && (
                    <Pressable
                        onPress={handleDeletePress}
                        style={({ pressed }) => ([
                            styles.deleteButton,
                            pixelClip(3),
                            { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.1)' },
                            pressed && { opacity: 0.7 }
                        ])}
                    >
                        <Animated.View style={animatedDeleteStyle}>
                            <Ionicons name="trash-bin-outline" size={18} color="#EF4444" />
                        </Animated.View>
                    </Pressable>
                )}
            </View>

            <View style={styles.body}>
                <View style={styles.bodyContentRow}>
                    <View style={styles.textContent}>
                        <View style={[styles.thesisBadge, pixelClip(2), { borderColor: isDark ? 'rgba(218, 230, 247, 0.3)' : 'rgba(7, 8, 12, 0.3)' }]}>
                            <Text style={[styles.thesisBadgeText, { color: theme.colors.primary.DEFAULT }]}>[ THESIS ]</Text>
                        </View>
                        <Text style={[styles.content, { color: theme.colors.text.primary }]} numberOfLines={3}>
                            {item.content}
                        </Text>
                    </View>

                    {(item.videoUrl || item.imageUrl) && (
                        <View style={[styles.mediaPreview, pixelClip(4)]}>
                            <Image
                                source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=80' }}
                                style={styles.thumbnail}
                            />
                            {item.videoUrl && (
                                <View style={[styles.videoIconOverlay, pixelClip(2)]}>
                                    <Ionicons name="play" size={16} color="#FFFFFF" />
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Logic Balance Bar */}
                {item.logicStats && (
                    <View style={styles.logicBalanceContainer}>
                        <View style={styles.logicLabels}>
                            <Text style={[styles.logicLabelText, { color: theme.colors.text.muted }]}>FOR</Text>
                            <Text style={[styles.logicLabelText, { textAlign: 'right', color: theme.colors.text.muted }]}>AGAINST</Text>
                        </View>
                        <View style={styles.balanceTrack}>
                            <View
                                style={[
                                    styles.balanceFill,
                                    {
                                        width: `${item.logicStats.forPercentage}%`,
                                        backgroundColor: theme.colors.primary.DEFAULT
                                    }
                                ]}
                            />
                            <View
                                style={[
                                    styles.balanceFill,
                                    {
                                        width: `${100 - item.logicStats.forPercentage}%`,
                                        backgroundColor: isDark ? '#5F6B82' : '#9AA7BD'
                                    }
                                ]}
                            />
                        </View>
                        <View style={styles.logicScores}>
                            <Text style={[styles.logicScoreText, { color: theme.colors.primary.DEFAULT }]}>{item.logicStats.forScore}</Text>
                            <Text style={[styles.logicScoreText, { textAlign: 'right', color: theme.colors.text.secondary }]}>{item.logicStats.againstScore}</Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <View style={styles.statGroup}>
                    <Ionicons name="bulb-outline" size={18} color={theme.colors.primary.DEFAULT} />
                    <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                        <Text style={{ fontWeight: 'bold', color: theme.colors.text.primary }}>{threadWeight}</Text> Reputation
                    </Text>
                </View>

                <View style={styles.statGroup}>
                    <Ionicons name="chatbubbles-outline" size={18} color={theme.colors.text.secondary} />
                    <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                        <Text style={{ fontWeight: 'bold', color: theme.colors.text.primary }}>{argumentsCount}</Text> Arguments
                    </Text>
                </View>

                <View style={styles.flexSpacer} />

                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 14,
        marginHorizontal: 16,
        padding: 4,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        paddingBottom: 8,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 20,
    },
    authorInfo: {
        marginLeft: 12,
        justifyContent: 'center'
    },
    authorName: {
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 2,
    },
    date: {
        fontSize: 12,
        fontWeight: '500',
    },
    deleteButton: {
        padding: 8,
    },
    body: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    thesisBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        marginBottom: 10,
    },
    thesisBadgeText: {
        fontFamily: FONT.tech,
        fontSize: 10,
        letterSpacing: 1.6,
    },
    content: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(128,128,128,0.1)',
        gap: 16,
    },
    statGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 13,
    },
    flexSpacer: {
        flex: 1,
    },
    // New Styles
    bodyContentRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    textContent: {
        flex: 1,
    },
    mediaPreview: {
        width: 80,
        height: 100,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.1)',
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    videoIconOverlay: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 4,
    },
    logicBalanceContainer: {
        marginVertical: 4,
    },
    logicLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    logicLabelText: {
        fontFamily: FONT.tech,
        fontSize: 10,
        letterSpacing: 1.6,
        color: 'rgba(255,255,255,0.4)',
    },
    balanceTrack: {
        height: 6,
        flexDirection: 'row',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    balanceFill: {
        height: '100%',
    },
    logicScores: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    logicScoreText: {
        fontFamily: FONT.tech,
        fontSize: 11,
        color: '#DAE6F7',
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DAE6F7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4,
    },
    aiBadgeText: {
        fontFamily: FONT.techBold,
        fontSize: 9,
        color: '#07080C',
        letterSpacing: 1,
    },
});
