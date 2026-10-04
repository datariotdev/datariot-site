import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '@lib/supabase/hooks/usePosts';
import { RADIUS, useUI } from '../../design-system/ui';
import { formatCount, timeAgo } from '../../lib/utils/format';
import { Avatar } from '../core/Avatar';
import { Txt } from '../core/Txt';

interface DebateCardProps {
    item: Post;
    onPress?: () => void;
    onDelete?: (id: string) => void;
    isOwnPost?: boolean;
}

/** A debate in a list: who put the thesis, the thesis, which side is ahead, and how many have weighed in. */
export function DebateCard({ item, onPress, onDelete, isOwnPost }: DebateCardProps) {
    const { c } = useUI();

    const stats = item.logicStats;
    const voted = !!stats && stats.forScore + stats.againstScore > 0;
    const forPct = voted ? Math.round(stats!.forPercentage) : 50;
    const when = timeAgo(item.createdAt);

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.card,
                { backgroundColor: c.surface, borderColor: c.hairline },
                pressed && { opacity: 0.8 },
            ]}
        >
            <View style={styles.head}>
                <Avatar uri={item.authorAvatar} name={item.authorName} size={34} />
                <View style={{ flex: 1 }}>
                    <Txt variant="callout" numberOfLines={1}>{item.authorName}</Txt>
                    {when ? <Txt variant="caption" tone="tertiary">{when}</Txt> : null}
                </View>

                {item.isAiAssisted ? (
                    <View style={[styles.badge, { backgroundColor: c.surfaceHigh }]}>
                        <Ionicons name="sparkles" size={11} color={c.textSecondary} />
                        <Txt variant="micro" tone="secondary">Checked by Orvelis</Txt>
                    </View>
                ) : null}

                {isOwnPost && onDelete ? (
                    <Pressable onPress={() => onDelete(item.id)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Delete debate">
                        <Ionicons name="trash-outline" size={18} color={c.danger} />
                    </Pressable>
                ) : null}
            </View>

            <View style={styles.body}>
                <Txt variant="headline" numberOfLines={4} style={{ flex: 1 }}>{item.content}</Txt>
                {item.imageUrl ? (
                    <View style={styles.thumbWrap}>
                        <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
                        {item.videoUrl ? (
                            <View style={styles.play}>
                                <Ionicons name="play" size={13} color="#FFFFFF" />
                            </View>
                        ) : null}
                    </View>
                ) : null}
            </View>

            <View style={{ gap: 8, marginTop: 14 }}>
                <View style={[styles.track, { backgroundColor: c.surfaceHigh }]}>
                    {voted ? <View style={[styles.fill, { width: `${forPct}%`, backgroundColor: c.accent }]} /> : null}
                </View>
                <View style={styles.sideRow}>
                    <Txt variant="caption" tone={voted ? 'primary' : 'tertiary'}>{voted ? `For ${forPct}%` : 'No votes yet'}</Txt>
                    {voted ? <Txt variant="caption" tone="secondary">Against {100 - forPct}%</Txt> : null}
                </View>
            </View>

            <View style={[styles.foot, { borderTopColor: c.hairline }]}>
                <View style={styles.stat}>
                    <Ionicons name="chatbubbles-outline" size={16} color={c.textSecondary} />
                    <Txt variant="caption" tone="secondary">{formatCount(item.comments)} {item.comments === 1 ? 'argument' : 'arguments'}</Txt>
                </View>
                <View style={styles.stat}>
                    <Ionicons name={item.isLiked ? 'heart' : 'heart-outline'} size={16} color={item.isLiked ? c.like : c.textSecondary} />
                    <Txt variant="caption" tone="secondary">{formatCount(item.likes)}</Txt>
                </View>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
    },
    head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 11 },
    body: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
    thumbWrap: { width: 64, height: 64, borderRadius: 12, overflow: 'hidden' },
    thumb: { width: '100%', height: '100%' },
    play: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.28)',
    },
    track: { height: 5, borderRadius: 3, overflow: 'hidden', flexDirection: 'row' },
    fill: { height: 5, borderRadius: 3 },
    sideRow: { flexDirection: 'row', justifyContent: 'space-between' },
    foot: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
