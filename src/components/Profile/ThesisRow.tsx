import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePalette } from '../../design-system/palette';
import { Post } from '@lib/supabase/hooks/usePosts';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const METER = 24;

const pad = (n: number) => n.toString().padStart(2, '0');

interface ThesisRowProps {
    item: Post;
    index: number;
    onPress: () => void;
    onDelete?: () => void;
}

/** One of the user's theses: the claim, who is winning it as a row of dots, and how loud it got */
export function ThesisRow({ item, index, onPress, onDelete }: ThesisRowProps) {
    const p = usePalette();
    const d = new Date(item.createdAt);
    const dateLabel = isNaN(d.getTime()) ? '' : `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`;

    const stats = item.logicStats;
    const voted = !!stats && stats.forScore + stats.againstScore > 0;
    const forPct = voted ? Math.round(stats!.forPercentage) : 0;
    const lit = voted ? Math.round((stats!.forPercentage / 100) * METER) : 0;

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
                    <Text style={[styles.idx, { color: p.accent }]}>T{pad(index + 1)}</Text>
                    {!!dateLabel && <Text style={[styles.date, { color: p.faint }]}>{dateLabel}</Text>}
                    {item.isAiAssisted && (
                        <View style={[styles.oracle, { borderColor: p.border }]}>
                            <Ionicons name="sparkles" size={10} color={p.accent} />
                            <Text style={[styles.oracleText, { color: p.accent }]}>ORACLE</Text>
                        </View>
                    )}
                </View>
                {onDelete && (
                    <Pressable
                        onPress={onDelete}
                        hitSlop={8}
                        accessibilityLabel="Delete thesis"
                        style={[styles.trash, { borderColor: p.border }]}
                    >
                        <Ionicons name="trash-outline" size={15} color={p.faint} />
                    </Pressable>
                )}
            </View>

            <View style={styles.body}>
                <Text style={[styles.claim, { color: p.text, fontFamily: p.fonts.semibold }]} numberOfLines={4}>
                    {item.content}
                </Text>
                {!!item.imageUrl && <Image source={{ uri: item.imageUrl }} style={[styles.thumb, { backgroundColor: p.soft }]} />}
            </View>

            <View style={styles.meter}>
                {Array.from({ length: METER }, (_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.mDot,
                            { backgroundColor: p.accent, opacity: voted ? (i < lit ? 1 : 0.2) : 0.16 },
                        ]}
                    />
                ))}
            </View>
            <View style={styles.meterCaps}>
                <Text style={[styles.cap, { color: voted ? p.text : p.sub }]}>{voted ? `FOR ${forPct}%` : 'NO VOTES YET'}</Text>
                {voted && <Text style={[styles.cap, { color: p.sub }]}>{`AGAINST ${100 - forPct}%`}</Text>}
            </View>

            <View style={[styles.foot, { borderColor: p.border }]}>
                <View style={styles.stat}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={p.faint} />
                    <Text style={[styles.statNum, { color: p.text }]}>{pad(item.comments || 0)}</Text>
                    <Text style={[styles.statCap, { color: p.sub }]}>ARGUMENTS</Text>
                </View>
                <View style={styles.stat}>
                    <Ionicons name="heart-outline" size={14} color={p.faint} />
                    <Text style={[styles.statNum, { color: p.text }]}>{pad(item.likes || 0)}</Text>
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
        marginBottom: 12,
    },
    topLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    idx: {
        fontFamily: 'Doto_900Black',
        fontSize: 16,
        letterSpacing: 1,
        includeFontPadding: false,
    },
    date: {
        fontFamily: 'Doto_700Bold',
        fontSize: 13,
        letterSpacing: 1,
        includeFontPadding: false,
    },
    oracle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: 20,
        paddingHorizontal: 7,
        borderRadius: 10,
        borderWidth: 1,
    },
    oracleText: {
        fontFamily: 'Doto_900Black',
        fontSize: 10.5,
        letterSpacing: 1,
        includeFontPadding: false,
    },
    trash: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
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
    meter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    mDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    meterCaps: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    cap: {
        fontFamily: 'Doto_700Bold',
        fontSize: 11.5,
        letterSpacing: 1.3,
        includeFontPadding: false,
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
        fontFamily: 'Doto_900Black',
        fontSize: 16,
        letterSpacing: 0.8,
        includeFontPadding: false,
    },
    statCap: {
        fontFamily: 'Doto_700Bold',
        fontSize: 10.5,
        letterSpacing: 1.3,
        includeFontPadding: false,
    },
});
