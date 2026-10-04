import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { setAudioModeAsync } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ResponsiveLayout } from '../../components/Layout/ResponsiveLayout';
import { useUI } from '../../design-system/ui';
import { TAB_BAR_BASE } from '../../lib/constants/layout';

type IconName = keyof typeof Ionicons.glyphMap;

const TabIcon = ({ outline, filled, focused, color }: { outline: IconName; filled: IconName; focused: boolean; color: string }) => (
    <Ionicons name={focused ? filled : outline} size={25} color={color} />
);

const TabLayout = () => {
    useEffect(() => {
        const initAudio = async () => {
            try {
                await setAudioModeAsync({
                    playsInSilentMode: true,
                    shouldRouteThroughEarpiece: false,
                });
            } catch (e) {
                console.error('Failed to set audio mode:', e);
            }
        };
        initAudio();
    }, []);

    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { c, isDark } = useUI();
    const isDesktopWeb = Platform.OS === 'web' && width > 768;
    const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;

    return (
        <ResponsiveLayout>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    // Let the layout's backdrop show through instead of the navigator's scene colour.
                    sceneStyle: { backgroundColor: 'transparent' },
                    tabBarActiveTintColor: c.text,
                    tabBarInactiveTintColor: isDark ? 'rgba(243, 244, 247, 0.42)' : 'rgba(11, 12, 16, 0.4)',
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        display: isDesktopWeb ? 'none' : 'flex',
                        // Floats over every screen so the home feed can run edge to edge;
                        // screens pad by useTabBarHeight().
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: TAB_BAR_BASE + bottomInset,
                        paddingBottom: bottomInset,
                        backgroundColor: 'transparent',
                        borderTopWidth: 0,
                        elevation: 0,
                        shadowOpacity: 0,
                    },
                    tabBarItemStyle: { alignItems: 'center', justifyContent: 'center' },
                    // A blurred scrim and a hairline: icons never sit directly on top of
                    // cards, lists or a chat input, whatever scrolls underneath.
                    tabBarBackground: () => (
                        <View style={StyleSheet.absoluteFill} pointerEvents="none">
                            <BlurView
                                intensity={isDark ? 50 : 60}
                                tint={isDark ? 'dark' : 'light'}
                                style={StyleSheet.absoluteFill}
                            />
                            <View
                                style={[
                                    StyleSheet.absoluteFill,
                                    { backgroundColor: isDark ? 'rgba(8, 9, 13, 0.8)' : 'rgba(255, 255, 255, 0.84)' },
                                ]}
                            />
                            <View
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: StyleSheet.hairlineWidth,
                                    backgroundColor: c.hairline,
                                }}
                            />
                        </View>
                    ),
                    tabBarHideOnKeyboard: true,
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarAccessibilityLabel: 'Home',
                        tabBarIcon: ({ focused, color }) => <TabIcon outline="home-outline" filled="home" focused={focused} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="discover"
                    options={{
                        title: 'Explore',
                        tabBarAccessibilityLabel: 'Explore',
                        tabBarIcon: ({ focused, color }) => <TabIcon outline="search-outline" filled="search" focused={focused} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="create"
                    options={{
                        title: 'Create',
                        tabBarAccessibilityLabel: 'Create',
                        tabBarIcon: () => (
                            <View
                                style={{
                                    width: 46,
                                    height: 32,
                                    borderRadius: 11,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: c.accent,
                                }}
                            >
                                <Ionicons name="add" size={24} color={c.onAccent} />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="ai"
                    options={{
                        title: 'Orvelis',
                        tabBarAccessibilityLabel: 'Orvelis AI',
                        tabBarIcon: ({ focused, color }) => <TabIcon outline="sparkles-outline" filled="sparkles" focused={focused} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="inbox"
                    options={{
                        title: 'Messages',
                        tabBarAccessibilityLabel: 'Messages',
                        tabBarIcon: ({ focused, color }) => <TabIcon outline="chatbubble-outline" filled="chatbubble" focused={focused} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        href: null, // Reached from the avatar on Home, from a creator's name and from Settings; not a tab of its own
                    }}
                />
            </Tabs>
        </ResponsiveLayout>
    );
};

export default TabLayout;
