import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePalette } from '../../design-system/palette';
import { Post } from '@lib/supabase/hooks/usePosts';

interface ThesisRowProps {
    item: Post;
    index: number;
    onPress: () => void;
    onDelete?: () => void;
}

/** One of the user's theses: the claim, who is winning it, and how much it was argued */
export function ThesisRow({ item, onPress, onDelete }: ThesisRowProps) {
    const p = usePalette();
    const d = new Date(item.createdAt);
    const dateLabel = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const stats = item.logicStats;
    const voted = !!stats && stats.forScore + stats.againstScore > 0;
    const forPct = voted ? Math.round(stats!.forPercentage) : 0;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.card,
                { backgroundColor: p.card, borderColor: p.border },
                pressed && { opacity: 0.85 },
            ]}
        >
            <View style={styles.top}>
                <View style={styles.topLeft}>
                    {!!dateLabel && <Text style={[styles.date, { color: p.sub, fontFamily: p.fonts.medium }]}>{dateLabel}</Text>}
                    {item.isAiAssisted && (
                        <View style={[styles.oracle, { backgroundColor: p.soft }]}>
                            <Ionicons name="sparkles" size={11} color={p.text} />
                            <Text style={[styles.oracleText, { color: p.text, fontFamily: p.fonts.semibold }]}>Oracle</Text>
                        </View>
                    )}
                </View>
                {onDelete && (
                    <Pressable
                        onPress={onDelete}
                        hitSlop={8}
                        accessibilityLabel="Delete thesis"
                        style={[styles.trash, { backgroundColor: p.soft }]}
                    >
                        <Ionicons name="trash-outline" size={15} color={p.sub} />
                    </Pressable>
                )}
            </View>

            <View style={styles.body}>
                <Text style={[styles.claim, { color: p.text, fontFamily: p.fonts.semibold }]} numberOfLines={4}>
                    {item.content}
                </Text>
                {!!item.imageUrl && <Image source={{ uri: item.imageUrl }} style={[styles.thumb, { backgroundColor: p.soft }]} />}
            </View>

            <View style={styles.balanceLabels}>
                <Text style={[styles.balanceText, { color: voted ? p.text : p.sub, fontFamily: p.fonts.semibold }]}>
                    {voted ? `For ${forPct}%` : 'No votes yet'}
                </Text>
                {voted && <Text style={[styles.balanceText, { color: p.sub, fontFamily: p.fonts.semibold }]}>{`${100 - forPct}% Against`}</Text>}
            </View>
            <View style={[styles.track, { backgroundColor: p.soft }]}>
                {voted && <View style={[styles.fill, { width: `${forPct}%`, backgroundColor: p.accent }]} />}
            </View>

            <View style={[styles.foot, { borderColor: p.border }]}>
                <View style={styles.stat}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={p.sub} />
                    <Text style={[styles.statNum, { color: p.text, fontFamily: p.fonts.semibold }]}>{item.comments || 0}</Text>
                    <Text style={[styles.statCap, { color: p.sub, fontFamily: p.fonts.regular }]}>
                        {(item.comments || 0) === 1 ? 'argument' : 'arguments'}
                    </Text>
                </View>
                <View style={styles.stat}>
                    <Ionicons name="heart-outline" size={16} color={p.sub} />
                    <Text style={[styles.statNum, { color: p.text, fontFamily: p.fonts.semibold }]}>{item.likes || 0}</Text>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '100%',
        maxWidth: 640,
        alignSelf: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 24,
        borderWidth: 1,
        padding: 16,
    },
    top: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    topLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    date: {
        fontSize: 13,
    },
    oracle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: 22,
        paddingHorizontal: 8,
        borderRadius: 11,
    },
    oracleText: {
        fontSize: 11.5,
    },
    trash: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    claim: {
        flex: 1,
        fontSize: 17,
        lineHeight: 24,
        letterSpacing: -0.2,
    },
    thumb: {
        width: 68,
        height: 68,
        borderRadius: 16,
    },
    balanceLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    balanceText: {
        fontSize: 12.5,
    },
    track: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginTop: 6,
    },
    fill: {
        height: '100%',
        borderRadius: 3,
    },
    foot: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statNum: {
        fontSize: 14,
        fontVariant: ['tabular-nums'],
    },
    statCap: {
        fontSize: 13,
    },
});
