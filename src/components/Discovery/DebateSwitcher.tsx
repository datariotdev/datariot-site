import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePalette } from '../../design-system/palette';

const tabs = [
    { id: 'latest', label: 'Latest', icon: 'clock' },
    { id: 'discussed', label: 'Most discussed', icon: 'message-circle' },
    { id: 'video', label: 'With video', icon: 'video' },
] as const;

export type DebateTab = typeof tabs[number]['id'];

interface DebateSwitcherProps {
    activeTab: DebateTab;
    onTabChange: (tab: DebateTab) => void;
}

export function DebateSwitcher({ activeTab, onTabChange }: DebateSwitcherProps) {
    const p = usePalette();

    return (
        <View accessibilityRole="tablist" accessibilityLabel="Debate filters" style={styles.tabs}>
            {tabs.map(tab => {
                const selected = tab.id === activeTab;
                const color = selected ? p.onAccent : p.sub;
                return (
                    <Pressable
                        key={tab.id}
                        accessibilityRole="tab"
                        accessibilityState={{ selected }}
                        onPress={() => onTabChange(tab.id)}
                        style={({ pressed }) => [
                            styles.tab,
                            { backgroundColor: selected ? p.accent : p.card, borderColor: selected ? p.accent : p.border },
                            pressed && { opacity: 0.75 },
                        ]}
                    >
                        <Feather name={tab.icon} size={14} color={color} />
                        <Text style={{ color, fontFamily: p.fonts.semibold, fontSize: 12 }}>{tab.label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 9 },
});
