/** @jsxImportSource react */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePalette } from '../../design-system/palette';
import type { FeedType } from '../../lib/supabase/hooks/useVideos';

interface Props {
    tabs: readonly { key: FeedType; label: string }[];
    activeTab: FeedType;
    onTabPress: (tab: FeedType) => void;
    isFocused: boolean;
}

export function WebFeedHeader({ tabs, activeTab, onTabPress, isFocused }: Props) {
    const p = usePalette();
    const selectedBackground = p.isDark ? '#253348' : '#E9F0FA';
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [query, setQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

    useEffect(() => {
        if (!isFocused || typeof document === 'undefined') return;
        const handleShortcut = (event: KeyboardEvent) => {
            if (event.key !== '/' || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
            const active = document.activeElement;
            if (active instanceof HTMLElement && (active.isContentEditable || active.matches('input, textarea, select'))) return;
            event.preventDefault();
            inputRef.current?.focus();
        };

        document.addEventListener('keydown', handleShortcut);
        return () => document.removeEventListener('keydown', handleShortcut);
    }, [isFocused]);

    const submit = () => {
        const q = query.trim();
        router.push(q ? { pathname: '/discover', params: { q } } : '/discover');
    };

    return (
        <View style={[styles.bar, { borderColor: p.border }]}>
            <View accessibilityRole="tablist" style={styles.tabs}>
                {tabs.map(tab => {
                    const selected = activeTab === tab.key;
                    return (
                        <Pressable key={tab.key} accessibilityRole="tab" accessibilityLabel={tab.label}
                            accessibilityState={{ selected }} onPress={() => onTabPress(tab.key)}
                            style={[styles.tab, {
                                backgroundColor: selected ? selectedBackground : 'transparent',
                            }]}>
                            <Text style={[styles.tabLabel, { color: selected ? p.text : p.sub }]}>{tab.label}</Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={[styles.search, width < 1000 && styles.searchCompact, {
                borderColor: searchFocused ? '#7797BF' : p.border, backgroundColor: p.card,
            }]}>
                <Pressable accessibilityRole="button" accessibilityLabel="Submit debate search" onPress={submit} style={styles.searchIcon}>
                    <Feather name="search" size={17} color={p.sub} />
                </Pressable>
                <TextInput ref={inputRef} accessibilityLabel="Search debates" placeholder="Search debates"
                    placeholderTextColor={p.sub} value={query} onChangeText={setQuery}
                    onSubmitEditing={submit} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                    returnKeyType="search" style={[styles.input, { color: p.text }]} />
                <View aria-hidden style={[styles.keycap, { borderColor: p.border }]}>
                    <Text style={[styles.keycapText, { color: p.sub }]}>/</Text>
                </View>
            </View>
        </View>
    );
}

export function WebFeedViewSwitch({ grid, onChange }: { grid: boolean; onChange: (grid: boolean) => void }) {
    const p = usePalette();
    const selectedBackground = p.isDark ? '#253348' : '#E9F0FA';

    return (
        <View style={[styles.viewSwitch, { borderColor: p.border, backgroundColor: p.card }]}>
            {([{ grid: false, icon: 'layout', label: 'Large cards' }, { grid: true, icon: 'grid', label: 'Compact grid' }] as const).map(view => {
                const selected = grid === view.grid;
                return (
                    <Pressable key={view.label} accessibilityRole="button" accessibilityLabel={view.label}
                        aria-pressed={selected} onPress={() => onChange(view.grid)}
                        style={[styles.viewButton, { backgroundColor: selected ? selectedBackground : 'transparent' }]}>
                        <Feather name={view.icon} size={17} color={selected ? p.text : p.sub} />
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    bar: { height: 76, flexShrink: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, gap: 16 },
    tabs: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tab: { minHeight: 40, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 9 },
    tabLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
    search: { flexDirection: 'row', alignItems: 'center', width: 260, height: 42, borderWidth: 1, borderRadius: 11, paddingRight: 9 },
    searchCompact: { width: 206 },
    searchIcon: { width: 42, height: 40, justifyContent: 'center', alignItems: 'center' },
    input: { flex: 1, minWidth: 0, height: 40, padding: 0, paddingRight: 6, fontFamily: 'Inter_400Regular', fontSize: 13, outlineWidth: 0 },
    keycap: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 5 },
    keycapText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
    viewSwitch: { flexDirection: 'row', padding: 3, borderWidth: 1, borderRadius: 10 },
    viewButton: { width: 37, height: 34, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
});
