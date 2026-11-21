/** @jsxImportSource react */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { OrvelisMark } from '../UI/OrvelisMark';
import { usePalette } from '../../design-system/palette';
import { FEATURED_PROMPT } from '../../lib/ai/featuredPrompt';
import type { VideoCategory } from '../../lib/constants/categories';

const TOPICS = [
    { name: 'Engineering', icon: 'construct-outline' },
    { name: 'Education', icon: 'book-outline' },
    { name: 'AI', icon: 'hardware-chip-outline' },
] as const;

interface Props {
    activeCategory: string | null;
    onSelectCategory: (category: VideoCategory) => void;
}

export function WebRightPanel({ activeCategory, onSelectCategory }: Props) {
    const p = usePalette();
    const router = useRouter();
    const accent = p.isDark ? '#BDD1F1' : '#3D5F8A';
    const tile = p.isDark ? '#253449' : '#E4EEFC';

    return (
        <View style={styles.panel}>
            <View style={[styles.assistant, { backgroundColor: p.card, borderColor: p.border }]}>
                <View style={styles.assistantBrand}>
                    <OrvelisMark size={22} color={p.text} coreColor={accent} />
                    <Text accessibilityRole="header" aria-level={2} style={[styles.assistantTitle, { color: p.text }]}>Orvelis AI</Text>
                </View>
                <Pressable accessibilityRole="link" accessibilityLabel={`Try asking Orvelis AI: ${FEATURED_PROMPT.question}`}
                    onPress={() => router.push({ pathname: '/ai', params: { starter: FEATURED_PROMPT.id } })}
                    style={({ hovered, pressed }) => [
                        styles.questionCard, { backgroundColor: hovered ? tile : p.cardHigh, borderColor: p.border },
                        pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.question, { color: p.text }]}>{FEATURED_PROMPT.question}</Text>
                    <View style={styles.assistantAction}>
                        <Text style={[styles.actionLabel, { color: accent }]}>Try this question</Text>
                        <Feather aria-hidden name="arrow-up-right" size={15} color={accent} />
                    </View>
                </Pressable>
            </View>

            <View style={styles.topics}>
                <Text accessibilityRole="header" aria-level={2} style={[styles.topicsTitle, { color: p.text }]}>Explore topics</Text>
                {TOPICS.map(topic => {
                    const selected = topic.name === activeCategory;
                    return (
                        <Pressable key={topic.name} accessibilityRole="button" accessibilityLabel={`Explore ${topic.name}`}
                            aria-pressed={selected} onPress={() => onSelectCategory(topic.name)}
                            style={({ pressed }) => [styles.topic, {
                                backgroundColor: selected ? tile : 'transparent',
                                opacity: pressed ? 0.65 : 1,
                            }]}>
                            <View style={[styles.topicIcon, { backgroundColor: tile }]}>
                                <Ionicons name={topic.icon} size={16} color={accent} />
                            </View>
                            <Text style={[styles.topicLabel, { color: p.text }]}>{topic.name}</Text>
                            <Feather name={selected ? 'check' : 'arrow-up-right'} size={14} color={p.sub} />
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    panel: { gap: 25 },
    assistant: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 10 },
    assistantBrand: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 2 },
    assistantTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 17, letterSpacing: -0.25 },
    questionCard: { borderWidth: 1, borderRadius: 11, padding: 12, gap: 14 },
    question: { fontFamily: 'Outfit_600SemiBold', fontSize: 19, lineHeight: 22, letterSpacing: -0.4 },
    assistantAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    actionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    pressed: { opacity: 0.75 },
    topics: { gap: 3 },
    topicsTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 20, letterSpacing: -0.35, marginBottom: 6, paddingLeft: 3 },
    topic: { minHeight: 46, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 6 },
    topicIcon: { width: 31, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    topicLabel: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13 },
});
