import React from 'react';
import { ScrollView, Text, StyleSheet, Pressable, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme as baseTheme } from '../../design-system/theme';
import { useTheme } from '../Theme/ThemeProvider';
import { EdgeFade } from './EdgeFade';

interface CategoryPillsProps {
    categories: string[];
    activeCategory: string | null;
    onCategoryPress: (category: string) => void;
}

export const CategoryPills = ({ categories, activeCategory, onCategoryPress }: CategoryPillsProps) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollStyle}
                contentContainerStyle={styles.container}
            >
                {categories.map((category) => {
                    const isActive = activeCategory === category;

                    return (
                        <PillButton
                            key={category}
                            category={category}
                            isActive={isActive}
                            isDark={isDark}
                            theme={theme}
                            onPress={() => onCategoryPress(category)}
                        />
                    );
                })}
            </ScrollView>

            <EdgeFade width={36} />
        </View>
    );
};

const PillButton = ({ category, isActive, isDark, theme, onPress }: { category: string, isActive: boolean, isDark: boolean, theme: any, onPress: () => void }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <Pressable
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
            style={[
                styles.pill,
                {
                    borderColor: isActive
                        ? 'transparent'
                        : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    borderWidth: 1,
                    backgroundColor: isActive 
                        ? 'transparent' 
                        : (isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.65)'),
                },
                isActive && isDark && {
                    shadowColor: '#D9E4FF',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                },
                isActive && !isDark && {
                    shadowColor: '#6B7FCC',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.12,
                    shadowRadius: 8,
                },
                isHovered && !isActive && {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.95)',
                    borderColor: isDark ? 'rgba(217, 228, 255, 0.25)' : 'rgba(107, 127, 204, 0.25)',
                    transform: [{ scale: 1.03 }],
                }
            ]}
            onPress={onPress}
        >
            {isActive && (
                <LinearGradient
                    colors={isDark ? ['#D9E4FF', '#A5C6FF'] : ['#6B7FCC', '#99B4FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.activeGradient}
                />
            )}
            <Text
                allowFontScaling={false}
                style={[
                    styles.text,
                    {
                        color: isActive
                            ? (isDark ? '#000000' : '#FFFFFF')
                            : (isDark ? '#38BDF8' : '#4C6EF5'),
                        fontWeight: isActive ? '800' : '700',
                        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                    }
                ]}
            >
                {`[ ${category.toUpperCase()} ]`}
            </Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        width: '100%',
    },
    scrollStyle: {
        flex: 1,
        width: '100%',
    },
    container: {
        paddingHorizontal: baseTheme.spacing.md,
        gap: 10,
        paddingTop: 8,
        paddingBottom: 8,
        flexDirection: 'row',
    },
    pill: {
        height: 34,
        paddingHorizontal: 18,
        borderRadius: 100,
        overflow: 'hidden',
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // @ts-ignore
        transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
    },
    activeGradient: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: 100,
    },
    text: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
});
