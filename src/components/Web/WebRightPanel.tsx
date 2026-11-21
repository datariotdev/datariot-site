/** @jsxImportSource react */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { usePalette } from '../../design-system/palette';
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
            <Pressable accessibilityRole="link" accessibilityLabel="Ask Orvelis AI" onPress={() => router.push('/ai')}
                style={({ pressed }) => [styles.assistant, { borderColor: p.border, opacity: pressed ? 0.78 : 1 }]}>
                <LinearGradient colors={p.isDark ? ['#1D2B40', '#111722'] : ['#EEF5FF', '#F9FBFF']}
                    start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                <View pointerEvents="none" style={[styles.orbit, { borderColor: p.isDark ? '#475D7A' : '#DAE7F9' }]} />
                <View pointerEvents="none" style={[styles.orbit, styles.outerOrbit, { borderColor: p.isDark ? '#354960' : '#E2EBF9' }]} />
                <View style={[styles.assistantIcon, { backgroundColor: tile }]}>
                    <Ionicons name="sparkles-outline" size={19} color={accent} />
                </View>
                <Text style={[styles.assistantTitle, { color: p.text }]}>Orvelis AI</Text>
                <Text style={[styles.assistantCopy, { color: p.sub }]}>Ask a follow-up or get a second take on a clip.</Text>
                <View style={styles.assistantAction}>
                    <Text style={[styles.actionLabel, { color: accent }]}>Ask Orvelis</Text>
                    <Feather name="arrow-up-right" size={15} color={accent} />
                </View>
            </Pressable>

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
    assistant: { borderWidth: 1, borderRadius: 18, overflow: 'hidden', padding: 17 },
    orbit: { position: 'absolute', top: -44, right: -21, width: 157, height: 128, borderRadius: 78, borderWidth: 1, transform: [{ rotate: '-27deg' }] },
    outerOrbit: { top: -46, right: -37, width: 191, height: 147, borderRadius: 95 },
    assistantIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginBottom: 14 },
    assistantTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 22, letterSpacing: -0.55, marginBottom: 5 },
    assistantCopy: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, maxWidth: 180 },
    assistantAction: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 15 },
    actionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
    topics: { gap: 3 },
    topicsTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 20, letterSpacing: -0.35, marginBottom: 6, paddingLeft: 3 },
    topic: { minHeight: 46, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 6 },
    topicIcon: { width: 31, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    topicLabel: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13 },
});
