import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../Theme/ThemeProvider';
import { pixelClip } from '@design-system/pixel';
import { FONT } from '@design-system/fonts';

interface DebateSwitcherProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const TABS = [
    { id: 'active', label: 'ARENAS', icon: 'flame' },
    { id: 'historical', label: 'HISTORY', icon: 'time' },
    { id: 'dives', label: 'DIVES', icon: 'search' },
];

/**
 * Segmented switch in the info site's idiom: a hairline track with stepped
 * corners and a solid accent slab that slides to the active segment. The slab
 * is sized from the track's measured width, not the window's — the page column
 * is narrower than the window on desktop.
 */
export const DebateSwitcher: React.FC<DebateSwitcherProps> = ({ activeTab, onTabChange }) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const [trackWidth, setTrackWidth] = useState(0);
    const tabWidth = trackWidth > 0 ? (trackWidth - 8) / TABS.length : 0;

    const activeIndex = Math.max(0, TABS.findIndex(t => t.id === activeTab));
    const translateX = useSharedValue(activeIndex * tabWidth);

    React.useEffect(() => {
        translateX.value = withSpring(activeIndex * tabWidth, {
            damping: 20,
            stiffness: 90,
        });
    }, [activeIndex, tabWidth]);

    const slidingIndicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const accent = theme.colors.primary.DEFAULT;
    const onAccent = theme.colors.primary.onPrimary;

    return (
        <View style={styles.container}>
            <View
                onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                style={[
                    styles.content,
                    {
                        backgroundColor: isDark ? 'rgba(218, 230, 247, 0.04)' : 'rgba(255, 255, 255, 0.6)',
                        borderColor: isDark ? 'rgba(218, 230, 247, 0.16)' : 'rgba(7, 8, 12, 0.16)',
                    },
                ]}
            >
                {/* Sliding accent slab */}
                {tabWidth > 0 && (
                    <Animated.View
                        style={[
                            styles.activePill,
                            { width: tabWidth, backgroundColor: accent },
                            slidingIndicatorStyle,
                        ]}
                    />
                )}

                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <Pressable
                            key={tab.id}
                            onPress={() => onTabChange(tab.id)}
                            style={styles.tab}
                        >
                            <Ionicons
                                name={tab.icon as any}
                                size={14}
                                color={isActive ? onAccent : theme.colors.text.muted}
                                style={styles.tabIcon}
                            />
                            <Text style={[
                                styles.tabText,
                                { color: isActive ? onAccent : theme.colors.text.secondary },
                            ]}>
                                {tab.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: 20,
    },
    content: {
        flexDirection: 'row',
        ...pixelClip(5),
        padding: 4,
        borderWidth: 1,
        position: 'relative',
        height: 52,
        alignItems: 'center',
    },
    activePill: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 4,
        ...pixelClip(4),
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    tabIcon: {
        marginRight: 7,
    },
    tabText: {
        fontFamily: FONT.techMedium,
        fontSize: 10.5,
        letterSpacing: 1.4,
    },
});
