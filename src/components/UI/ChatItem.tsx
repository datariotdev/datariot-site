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
    onPress: () => void;
}

const pad = (n: number) => n.toString().padStart(2, '0');

/** One conversation: a face, a name, the last thing said. Unread ones get a ring, a bright time and a dot-matrix count. */
export function ChatItem({ name, message, time, unreadCount = 0, avatar_url, onPress }: ChatItemProps) {
    const p = usePalette();
    const unread = unreadCount > 0;
    const isMedia = /^sent a (video|image|photo)/i.test(message);

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${name}. ${message}`}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: p.soft }]}
        >
            <View style={styles.avatarWrap}>
                {unread && <View style={[styles.ring, { borderColor: p.accent }]} />}
                <Avatar uri={avatar_url} name={name} size={52} />
            </View>

            <View style={[styles.body, { borderBottomColor: p.border }]}>
                <View style={styles.top}>
                    <Text numberOfLines={1} style={[styles.name, { color: p.text, fontFamily: unread ? p.fonts.bold : p.fonts.semibold }]}>{name}</Text>
                    {time ? <Text style={[styles.time, { color: unread ? p.accent : p.faint }]}>{time.toUpperCase()}</Text> : null}
                </View>
                <View style={styles.bottom}>
                    {isMedia ? <Ionicons name="play-circle" size={16} color={unread ? p.accent : p.faint} /> : null}
                    <Text numberOfLines={1} style={[styles.msg, { color: unread ? p.text : p.sub, fontFamily: unread ? p.fonts.medium : p.fonts.regular }]}>
                        {message}
                    </Text>
                    {unread ? (
                        <View style={[styles.badge, { backgroundColor: p.accent }]}>
                            <Text style={[styles.badgeText, { color: p.onAccent }]}>{unreadCount > 99 ? '99+' : pad(unreadCount)}</Text>
                        </View>
                    ) : null}
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, gap: 12 },
    avatarWrap: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
    ring: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 1.5 },
    body: { flex: 1, paddingVertical: 15, paddingRight: 16, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth },
    top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { flex: 1, fontSize: 16 },
    time: { fontFamily: 'Doto_700Bold', fontSize: 12.5, letterSpacing: 0.8, includeFontPadding: false },
    bottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    msg: { flex: 1, fontSize: 14 },
    badge: { minWidth: 26, height: 22, borderRadius: 11, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center' },
    badgeText: { fontFamily: 'Doto_900Black', fontSize: 13, letterSpacing: 0.5, includeFontPadding: false },
});
