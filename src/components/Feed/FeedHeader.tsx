import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '../core/IconButton';
import { Txt } from '../core/Txt';
import { ON_VIDEO, useUI } from '../../design-system/ui';

export type HomeTab = 'following' | 'foryou' | 'arena';

const TABS: { key: HomeTab; label: string }[] = [
    { key: 'following', label: 'Following' },
    { key: 'foryou', label: 'For you' },
    { key: 'arena', label: 'Arena' },
];

export const HEADER_ROW = 48;

interface FeedHeaderProps {
    tab: HomeTab;
    onTab: (tab: HomeTab) => void;
    onProfile: () => void;
    onSearch: () => void;
    /** Sitting over video (white) or over a plain screen (theme colours). */
    overVideo: boolean;
}

/** Profile on the left, three words in the middle, search on the right. */
export function FeedHeader({ tab, onTab, onProfile, onSearch, overVideo }: FeedHeaderProps) {
    const insets = useSafeAreaInsets();
    const { c } = useUI();

    const on = overVideo ? ON_VIDEO.text : c.text;
    const off = overVideo ? ON_VIDEO.textTertiary : c.textTertiary;

    return (
        <View style={[styles.wrap, { paddingTop: insets.top }]} pointerEvents="box-none">
            {overVideo ? (
                <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)']}
                    style={StyleSheet.absoluteFill}
                />
            ) : null}
            <View style={styles.row} pointerEvents="box-none">
                <IconButton
                    name="person-outline"
                    size={22}
                    color={on}
                    label="Profile"
                    onPress={onProfile}
                />

                <View style={styles.tabs} pointerEvents="box-none">
                    {TABS.map(t => {
                        const active = t.key === tab;
                        return (
                            <Pressable
                                key={t.key}
                                onPress={() => onTab(t.key)}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: active }}
                                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                style={styles.tab}
                            >
                                <Txt
                                    variant="headline"
                                    style={[{ color: active ? on : off }, overVideo && styles.shadow]}
                                >
                                    {t.label}
                                </Txt>
                                <View style={[styles.underline, { backgroundColor: active ? on : 'transparent' }]} />
                            </Pressable>
                        );
                    })}
                </View>

                <IconButton
                    name="search-outline"
                    size={22}
                    color={on}
                    label="Search"
                    onPress={onSearch}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 },
    row: { height: HEADER_ROW, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
    tabs: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 18 },
    tab: { alignItems: 'center', justifyContent: 'center' },
    underline: { width: 18, height: 2, borderRadius: 1, marginTop: 3 },
    shadow: { textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
});
