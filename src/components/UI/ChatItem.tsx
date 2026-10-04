import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUI } from '../../design-system/ui';
import { Avatar } from '../core/Avatar';
import { Txt } from '../core/Txt';

interface ChatItemProps {
    id: string;
    name: string;
    message: string;
    time?: string;
    unreadCount?: number;
    avatarUrl?: string | null;
    isAi?: boolean;
    isTyping?: boolean;
    onPress: () => void;
}

/** A conversation: a face, a name, the last thing said. Unread ones are louder, nothing else is. */
export function ChatItem({ name, message, time, unreadCount = 0, avatarUrl, isAi = false, isTyping = false, onPress }: ChatItemProps) {
    const { c } = useUI();
    const unread = unreadCount > 0;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${name}. ${message}`}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.surface }]}
        >
            {isAi ? (
                <View style={[styles.aiAvatar, { backgroundColor: c.surfaceHigh }]}>
                    <Ionicons name="sparkles" size={22} color={c.text} />
                </View>
            ) : (
                <Avatar uri={avatarUrl} name={name} size={52} />
            )}

            <View style={styles.text}>
                <View style={styles.top}>
                    <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>{name}</Txt>
                    {time ? <Txt variant="caption" tone={unread ? 'primary' : 'tertiary'}>{time}</Txt> : null}
                </View>
                <View style={styles.bottom}>
                    <Txt variant="callout" tone={unread ? 'primary' : 'secondary'} numberOfLines={1} style={{ flex: 1 }}>
                        {isTyping ? 'Thinking…' : message}
                    </Txt>
                    {unread ? (
                        <View style={[styles.badge, { backgroundColor: c.accent }]}>
                            <Txt variant="micro" style={{ color: c.onAccent }}>{unreadCount > 99 ? '99+' : unreadCount}</Txt>
                        </View>
                    ) : null}
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12 },
    aiAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    text: { flex: 1, gap: 3 },
    top: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    bottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
});
