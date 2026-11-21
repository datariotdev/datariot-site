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
    selected?: boolean;
    onPress: () => void;
}

/** One conversation: a face, a name, the last thing said. Unread ones get a ring, a bright time and a count. */
export function ChatItem({ name, message, time, unreadCount = 0, avatar_url, selected = false, onPress }: ChatItemProps) {
    const p = usePalette();
    const unread = unreadCount > 0;
    const isMedia = /^sent a (video|image|photo)/i.test(message);

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${name}. ${message}`}
            aria-pressed={selected}
            style={({ pressed }) => [styles.row, (selected || pressed) && { backgroundColor: p.isDark ? '#253850' : '#E7F0FD' }]}
        >
            <View style={styles.avatarWrap}>
                {unread && <View style={[styles.ring, { borderColor: p.accent }]} />}
                <Avatar uri={avatar_url} name={name} size={42} />
            </View>

            <View style={styles.body}>
                <View style={styles.top}>
                    <Text numberOfLines={1} style={[styles.name, { color: p.text, fontFamily: unread ? p.fonts.bold : p.fonts.semibold }]}>{name}</Text>
                    {time ? <Text style={[styles.time, { color: unread ? p.accent : p.faint, fontFamily: unread ? p.fonts.semibold : p.fonts.regular }]}>{time}</Text> : null}
                </View>
                <View style={styles.bottom}>
                    {isMedia ? <Ionicons name="play-circle" size={16} color={unread ? p.accent : p.faint} /> : null}
                    <Text numberOfLines={1} style={[styles.msg, { color: unread ? p.text : p.sub, fontFamily: unread ? p.fonts.medium : p.fonts.regular }]}>
                        {message}
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
    row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 9, gap: 8, borderRadius: 10 },
    avatarWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    ring: { position: 'absolute', width: 48, height: 48, borderRadius: 24, borderWidth: 1.5 },
    body: { flex: 1, minWidth: 0, paddingVertical: 14, paddingRight: 10, gap: 4 },
    top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { flex: 1, fontSize: 14 },
    time: { fontSize: 11 },
    bottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    msg: { flex: 1, fontSize: 12 },
    badge: { minWidth: 26, height: 22, borderRadius: 11, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center' },
    badgeText: { fontSize: 12, fontVariant: ['tabular-nums'] },
});
