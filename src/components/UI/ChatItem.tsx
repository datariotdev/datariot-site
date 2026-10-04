import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePalette } from '../../design-system/palette';
import { Avatar } from './Avatar';

interface ChatItemProps {
    id: string;
    name: string;
    message: string;
    time: string;
    unreadCount?: number;
    avatar_url?: string | null;
    isAi?: boolean;
    isTyping?: boolean;
    onPress: () => void;
}

/** One conversation: a face, a name, the last thing said. Unread ones get louder, nothing else does. */
export function ChatItem({ name, message, time, unreadCount = 0, avatar_url, isAi = false, isTyping = false, onPress }: ChatItemProps) {
    const p = usePalette();
    const unread = unreadCount > 0;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${name}. ${message}`}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: p.soft }]}
        >
            {isAi ? (
                <View style={[styles.ai, { backgroundColor: p.accent }]}>
                    <Ionicons name="sparkles" size={22} color={p.onAccent} />
                </View>
            ) : (
                <Avatar uri={avatar_url} name={name} size={54} />
            )}

            <View style={[styles.body, { borderBottomColor: p.border }]}>
                <View style={styles.top}>
                    <Text numberOfLines={1} style={[styles.name, { color: p.text, fontFamily: unread ? p.fonts.bold : p.fonts.semibold }]}>{name}</Text>
                    {time ? <Text style={[styles.time, { color: unread ? p.accent : p.faint, fontFamily: unread ? p.fonts.semibold : p.fonts.regular }]}>{time}</Text> : null}
                </View>
                <View style={styles.bottom}>
                    <Text numberOfLines={1} style={[styles.msg, { color: unread ? p.text : p.sub, fontFamily: unread ? p.fonts.medium : p.fonts.regular }]}>
                        {isTyping ? 'Thinking…' : message}
                    </Text>
                    {unread ? (
                        <View style={[styles.badge, { backgroundColor: p.accent }]}>
                            <Text style={[styles.badgeText, { color: p.onAccent, fontFamily: p.fonts.bold }]}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                        </View>
                    ) : null}
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, gap: 14 },
    ai: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
    body: { flex: 1, paddingVertical: 15, paddingRight: 20, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth },
    top: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    name: { flex: 1, fontSize: 16 },
    time: { fontSize: 12 },
    bottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    msg: { flex: 1, fontSize: 14 },
    badge: { minWidth: 21, height: 21, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
    badgeText: { fontSize: 11.5 },
});
