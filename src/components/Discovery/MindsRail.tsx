import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { useTheme } from '../Theme/ThemeProvider';
import { FONT } from '@design-system/fonts';
import { pixelClip, fadeRight } from '@design-system/pixel';

export interface Mind {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    isFollowing: boolean;
}

interface MindsRailProps {
    minds: Mind[];
    onFollow: (id: string) => void;
    onPress: (id: string) => void;
}

const FOCUS = [
    'Active in AI Ethics',
    'Top rebutter in Space Law',
    'Builds the case for open money',
    'Cross-examines the future of work',
    'Steelmans the other side',
];

/**
 * The profile carries no reputation or focus yet, so both are derived from the
 * id: stable between renders and devices, unlike the random score this
 * replaces. Swap for real fields when the backend has them.
 */
const hash = (s: string) => {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h;
};
export const reputationOf = (id: string) => 5000 + (hash(id) % 15000);
const focusOf = (id: string) => FOCUS[hash(id + 'f') % FOCUS.length];

const MindCard = ({ mind, onFollow, onPress }: { mind: Mind; onFollow: () => void; onPress: () => void }) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const [hovered, setHovered] = useState(false);
    const accent = theme.colors.primary.DEFAULT;
    const name = mind.username || 'thinker';

    return (
        <Pressable
            onPress={onPress}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            style={[
                styles.card,
                pixelClip(6),
                {
                    backgroundColor: isDark ? 'rgba(218, 230, 247, 0.04)' : 'rgba(255, 255, 255, 0.66)',
                    borderColor: hovered ? accent : (isDark ? 'rgba(218, 230, 247, 0.14)' : 'rgba(7, 8, 12, 0.14)'),
                    transform: [{ translateY: hovered ? -3 : 0 }],
                },
            ]}
        >
            <View style={styles.top}>
                <View style={[styles.avatar, pixelClip(4), { backgroundColor: isDark ? 'rgba(218, 230, 247, 0.1)' : 'rgba(7, 8, 12, 0.08)' }]}>
                    {mind.avatarUrl ? (
                        <Image source={{ uri: mind.avatarUrl }} style={styles.avatarImg} />
                    ) : (
                        <Text style={[styles.initial, { color: theme.colors.text.primary }]}>{name.charAt(0).toUpperCase()}</Text>
                    )}
                </View>
                <View style={styles.repBlock}>
                    <Text style={[styles.repLabel, { color: theme.colors.text.muted }]}>REP</Text>
                    <Text style={[styles.repValue, { color: accent }]}>{reputationOf(mind.id).toLocaleString('en-US')}</Text>
                </View>
            </View>

            <Text style={[styles.name, { color: theme.colors.text.primary }]} numberOfLines={1}>{`> @${name.toUpperCase()}`}</Text>
            <Text style={[styles.focus, { color: theme.colors.text.secondary }]} numberOfLines={2}>{focusOf(mind.id)}</Text>

            <Pressable
                onPress={onFollow}
                style={[
                    styles.follow,
                    pixelClip(3),
                    mind.isFollowing
                        ? { borderColor: isDark ? 'rgba(218, 230, 247, 0.3)' : 'rgba(7, 8, 12, 0.3)', backgroundColor: 'transparent' }
                        : { borderColor: accent, backgroundColor: accent },
                ]}
            >
                <Text
                    style={[
                        styles.followText,
                        { color: mind.isFollowing ? theme.colors.text.secondary : theme.colors.primary.onPrimary },
                    ]}
                >
                    {mind.isFollowing ? '[ FOLLOWING ]' : '[ FOLLOW ]'}
                </Text>
            </Pressable>
        </Pressable>
    );
};

/** Horizontal rail of people worth following; runs off the right edge on purpose. */
export const MindsRail = ({ minds, onFollow, onPress }: MindsRailProps) => {
    if (minds.length === 0) return null;
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={fadeRight(48)}
            contentContainerStyle={styles.rail}
        >
            {minds.map((m) => (
                <MindCard key={m.id} mind={m} onFollow={() => onFollow(m.id)} onPress={() => onPress(m.id)} />
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    rail: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        gap: 12,
    },
    card: {
        width: 212,
        padding: 14,
        borderWidth: 1,
        // @ts-ignore — web-only
        cursor: 'pointer',
        // @ts-ignore — web-only
        transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease',
    },
    top: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    initial: {
        fontFamily: FONT.display,
        fontSize: 24,
    },
    repBlock: {
        alignItems: 'flex-end',
    },
    repLabel: {
        fontFamily: FONT.tech,
        fontSize: 9,
        letterSpacing: 1.8,
    },
    repValue: {
        fontFamily: FONT.lcd,
        fontSize: 24,
        lineHeight: 28,
    },
    name: {
        fontFamily: FONT.techBold,
        fontSize: 13,
        letterSpacing: 0.4,
    },
    focus: {
        fontFamily: FONT.sans,
        fontSize: 12.5,
        lineHeight: 18,
        marginTop: 4,
        minHeight: 36,
    },
    follow: {
        marginTop: 14,
        height: 34,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    followText: {
        fontFamily: FONT.techBold,
        fontSize: 10.5,
        letterSpacing: 1.6,
    },
});
