import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../Theme/ThemeProvider';
import { FONT } from '@design-system/fonts';
import { ICE, INK } from '@design-system/theme';
import { pixelClip } from '@design-system/pixel';

interface ChatItemProps {
    id: string;
    name: string;
    message: string;
    time: string;
    unreadCount?: number;
    isAi?: boolean;
    isTyping?: boolean;
    onPress: () => void;
}

export function ChatItem({
    name,
    message,
    time,
    unreadCount = 0,
    isAi = false,
    isTyping = false,
    onPress
}: ChatItemProps) {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const accent = theme.colors.primary.DEFAULT;

    const hairline = isDark ? 'rgba(218, 230, 247, 0.14)' : 'rgba(7, 8, 12, 0.14)';
    const hairlineStrong = isDark ? 'rgba(218, 230, 247, 0.4)' : 'rgba(7, 8, 12, 0.5)';

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.75}
            style={[
                styles.container,
                pixelClip(5),
                {
                    backgroundColor: isAi
                        ? (isDark ? 'rgba(218, 230, 247, 0.07)' : 'rgba(255, 255, 255, 0.82)')
                        : (isDark ? 'rgba(218, 230, 247, 0.03)' : 'rgba(255, 255, 255, 0.55)'),
                    borderColor: isAi ? hairlineStrong : hairline,
                },
            ]}
        >
            {/* Avatar: a notched tile, like the logo */}
            <View style={styles.avatarWrap}>
                <View
                    style={[
                        styles.avatar,
                        pixelClip(4),
                        isAi
                            ? { backgroundColor: INK, borderColor: ICE }
                            : { backgroundColor: isDark ? 'rgba(218, 230, 247, 0.08)' : 'rgba(7, 8, 12, 0.06)', borderColor: hairline },
                    ]}
                >
                    {isAi ? (
                        <MaterialCommunityIcons name="robot-excited" size={24} color={ICE} />
                    ) : (
                        <Text style={[styles.avatarText, { color: theme.colors.text.primary }]}>{name.charAt(0).toUpperCase()}</Text>
                    )}
                </View>
                {isAi && <View style={[styles.onlineBadge, { borderColor: isDark ? '#0C0D12' : '#FFFFFF', backgroundColor: theme.colors.success }]} />}
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <Text
                        style={[
                            styles.name,
                            { color: theme.colors.text.primary },
                            isAi && styles.aiName,
                        ]}
                        numberOfLines={1}
                    >
                        {name} {isAi && <Ionicons name="checkmark-circle" size={14} color={accent} />}
                    </Text>
                    <Text style={[styles.time, { color: unreadCount > 0 ? theme.colors.text.primary : theme.colors.text.muted }]}>
                        {time.toUpperCase()}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text
                        style={[
                            styles.message,
                            { color: theme.colors.text.secondary },
                            unreadCount > 0 && { color: theme.colors.text.primary },
                        ]}
                        numberOfLines={2}
                    >
                        {isTyping ? 'Thinking...' : message}
                    </Text>

                    {unreadCount > 0 && (
                        <View style={[styles.badge, pixelClip(2), { backgroundColor: accent }]}>
                            <Text style={[styles.badgeText, { color: theme.colors.primary.onPrimary }]}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 14,
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 10,
        borderWidth: 1,
    },
    avatarWrap: {
        width: 52,
        height: 52,
        marginRight: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: FONT.display,
        fontSize: 24,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: -3,
        right: -3,
        width: 11,
        height: 11,
        borderWidth: 2,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
        gap: 12,
    },
    name: {
        flexShrink: 1,
        fontFamily: FONT.sansBold,
        fontSize: 16,
    },
    aiName: {
        fontFamily: FONT.display,
        fontSize: 18,
        letterSpacing: 0.6,
    },
    time: {
        fontFamily: FONT.tech,
        fontSize: 10,
        letterSpacing: 1.2,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    message: {
        fontFamily: FONT.sans,
        fontSize: 14,
        flex: 1,
        marginRight: 14,
        lineHeight: 20,
    },
    badge: {
        paddingHorizontal: 7,
        paddingVertical: 3,
        minWidth: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontFamily: FONT.techBold,
        fontSize: 11,
    },
});
