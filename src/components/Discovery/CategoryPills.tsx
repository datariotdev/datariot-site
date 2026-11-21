/** @jsxImportSource react */
import React from 'react';
import { ScrollView, Text, StyleSheet, Pressable, View } from 'react-native';
import { useTheme } from '../Theme/ThemeProvider';

interface CategoryPillsProps {
    categories: string[];
    activeCategory: string | null;
    onCategoryPress: (category: string) => void;
    showFilterLabel?: boolean;
    desktop?: boolean;
}

export const CategoryPills = ({ categories, activeCategory, onCategoryPress, desktop = false }: CategoryPillsProps) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const solid = isDark ? '#DAE6F7' : '#07080C';
    const onSolid = isDark ? '#07080C' : '#DAE6F7';

    const activeBg = desktop ? isDark ? '#26354C' : '#DFEBFB' : solid;
    const activeText = desktop ? isDark ? '#D9E4FF' : '#25466D' : onSolid;
    const chips = categories.map(category => {
        const active = activeCategory === category;
        return (
            <Pressable
                key={category}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${category}`}
                accessibilityState={{ selected: active }}
                aria-pressed={active}
                onPress={() => onCategoryPress(category)}
                style={({ pressed }) => [styles.chip, desktop && styles.desktopChip, {
                    backgroundColor: active
                        ? activeBg
                        : pressed
                            ? (isDark ? 'rgba(218,230,247,0.08)' : 'rgba(255,255,255,0.5)')
                            : (isDark ? 'rgba(255,255,255,0.04)' : desktop ? '#FFFFFF' : 'rgba(0,0,0,0.03)'),
                    borderColor: active
                        ? activeBg
                        : isDark
                            ? 'rgba(218,230,247,0.22)'
                            : desktop ? '#DFE5EE' : 'rgba(7,8,12,0.18)',
                }]}
            >
                {active && !desktop && <View style={[styles.dot, { backgroundColor: onSolid }]} />}
                <Text style={[styles.text, {
                    fontFamily: active ? theme.typography.fontFamilies.semibold : theme.typography.fontFamilies.medium,
                    color: active ? activeText : theme.colors.text.secondary,
                    fontWeight: active ? '700' : '500',
                }]}>{category}</Text>
            </Pressable>
        );
    });

    return desktop ? <View style={styles.wrap}>{chips}</View> : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}
            contentContainerStyle={styles.container}>
            {chips}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    desktopChip: { paddingHorizontal: 12 },
    scroll: { flexGrow: 0, flexShrink: 0, width: '100%' },
    container: {
        paddingHorizontal: 16,
        gap: 8,
        paddingVertical: 6,
        alignItems: 'center',
    },
    chip: {
        minHeight: 34,
        flexShrink: 0,
        paddingHorizontal: 15,
        borderRadius: 999,
        borderWidth: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 7,
    },
    text: {
        fontSize: 13,
        includeFontPadding: false,
    },
});
