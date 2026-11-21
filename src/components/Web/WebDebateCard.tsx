import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { usePalette } from '@design-system/palette';
import type { Post } from '@lib/supabase/hooks/usePosts';

export function WebDebateCard({ item }: { item: Post }) {
    const p = usePalette();
    const [hovered, setHovered] = useState(false);
    const accent = p.isDark ? '#BFD9FF' : '#355D89';
    const highlight = p.isDark ? '#1A2A3E' : '#EAF2FC';
    const panel = p.isDark ? '#151D2B' : '#F1F5FB';
    const emphasis = p.isDark ? '#3B5371' : '#B7CAE0';
    const title = item.content.trim() || (item.videoUrl ? 'Video debate' : 'Debate');
    const date = new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const { forScore = 0, againstScore = 0, forPercentage = 0 } = item.logicStats ?? {};
    const hasVotes = forScore + againstScore > 0;

    return (
        <Link href={{ pathname: '/debate/[id]', params: { id: item.id } }} asChild>
            <Pressable accessibilityRole="link" onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}
                style={StyleSheet.flatten([styles.card, {
                    backgroundColor: p.card,
                    borderColor: hovered ? emphasis : p.border,
                }])}>
                <View style={styles.content}>
                    <View style={styles.titleRow}>
                        {item.imageUrl && (
                            <Image accessible={false} source={{ uri: item.imageUrl }}
                                style={[styles.thumbnail, { backgroundColor: panel }]} resizeMode="cover" />
                        )}
                        <View style={styles.copy}>
                            <Text numberOfLines={3} style={[styles.title, { color: p.text }]}>{title}</Text>
                            <View style={styles.author}>
                                {item.authorAvatar && <Image accessible={false} source={{ uri: item.authorAvatar }} style={styles.avatar} />}
                                <Text numberOfLines={1} style={[styles.authorName, { color: p.sub }]}>{item.authorName}</Text>
                                <Text style={[styles.meta, { color: p.sub }]}>· {date}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.metadata}>
                        <View style={styles.detail}>
                            <Feather aria-hidden name="message-circle" size={14} color={accent} />
                            <Text style={[styles.meta, { color: p.sub }]}>
                                {item.comments} {item.comments === 1 ? 'argument' : 'arguments'}
                            </Text>
                        </View>
                        <View style={styles.detail}>
                            <Feather aria-hidden name="thumbs-up" size={14} color={accent} />
                            <Text style={[styles.meta, { color: p.sub }]}>{item.likes} reputation</Text>
                        </View>
                        {item.videoUrl && (
                            <View style={styles.detail}>
                                <Feather aria-hidden name="video" size={14} color={accent} />
                                <Text style={[styles.meta, { color: p.sub }]}>Video attached</Text>
                            </View>
                        )}
                        {item.isAiAssisted && (
                            <View style={styles.detail}>
                                <Feather aria-hidden name="zap" size={14} color={accent} />
                                <Text style={[styles.meta, { color: p.sub }]}>AI-assisted</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={[styles.tally, { backgroundColor: panel }]}>
                    {hasVotes ? (
                        <>
                            <View style={styles.scores}>
                                <View>
                                    <Text style={[styles.score, { color: accent }]}>{forScore}</Text>
                                    <Text style={[styles.meta, { color: p.sub }]}>For</Text>
                                </View>
                                <View style={styles.against}>
                                    <Text style={[styles.score, { color: p.text }]}>{againstScore}</Text>
                                    <Text style={[styles.meta, { color: p.sub }]}>Against</Text>
                                </View>
                            </View>
                            <View style={[styles.track, { backgroundColor: p.isDark ? '#526780' : '#2F4158' }]}>
                                <View style={{ width: `${forPercentage}%`, height: '100%', backgroundColor: p.isDark ? '#A9CBF2' : '#81ADD9' }} />
                            </View>
                        </>
                    ) : (
                        <View style={styles.emptyVotes}>
                            <Feather aria-hidden name="bar-chart-2" size={16} color={accent} />
                            <Text style={[styles.meta, { color: p.sub }]}>No votes yet</Text>
                        </View>
                    )}
                </View>

                <View style={[styles.arrow, { backgroundColor: hovered ? highlight : panel }]}>
                    <Feather aria-hidden name="arrow-up-right" size={19} color={accent} />
                </View>
            </Pressable>
        </Link>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginHorizontal: 16,
        marginBottom: 8, borderWidth: 1, borderRadius: 17,
    },
    content: { flex: 1, minWidth: 0, gap: 13 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    thumbnail: { width: 58, height: 58, borderRadius: 10 },
    copy: { flex: 1, minWidth: 0, gap: 5 },
    title: { fontFamily: 'Outfit_600SemiBold', fontSize: 24, lineHeight: 28, letterSpacing: -0.5 },
    author: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    avatar: { width: 19, height: 19, borderRadius: 10 },
    authorName: { flexShrink: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17 },
    metadata: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
    detail: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    meta: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
    tally: { width: 138, minHeight: 72, justifyContent: 'center', borderRadius: 12, padding: 10, gap: 6 },
    scores: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
    against: { alignItems: 'flex-end' },
    score: { fontFamily: 'Outfit_600SemiBold', fontSize: 22, lineHeight: 24, fontVariant: ['tabular-nums'] },
    track: { height: 4, borderRadius: 2, overflow: 'hidden' },
    emptyVotes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    arrow: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
