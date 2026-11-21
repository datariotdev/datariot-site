/** @jsxImportSource react */
import React, { useEffect } from 'react';
import { OrvelisMark } from '../../components/AI/OrvelisMark';
import { Tabs, usePathname } from 'expo-router';
import { BottomTabBar } from 'expo-router/build/layouts/Tabs';
import { setAudioModeAsync } from 'expo-audio';
import { AppNavigationIcon } from '../../components/Navigation/AppNavigationIcon';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ResponsiveLayout } from '../../components/Layout/ResponsiveLayout';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { usePalette } from '../../design-system/palette';
import { NavVisibilityProvider, useNavVisibility } from '../../context/NavVisibilityContext';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import * as SystemUI from 'expo-system-ui';

function AnimatedTabBar(props: any) {
    const { isNavVisible } = useNavVisibility();
    const { width } = useWindowDimensions();
    const isDesktopWeb = Platform.OS === 'web' && width > 768;

    const animStyle = useAnimatedStyle(() => ({
        transform: [{
            translateY: withTiming(isNavVisible ? 0 : 120, {
                duration: 250,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            }),
        }],
        opacity: withTiming(isNavVisible ? 1 : 0, {
            duration: 220,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
    }), [isNavVisible]);

    if (isDesktopWeb) return null;

    return (
        <Animated.View
            pointerEvents={isNavVisible ? 'auto' : 'none'}
            style={[{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 999 }, animStyle]}
        >
            <BottomTabBar {...props} />
        </Animated.View>
    );
}


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
    const pathname = usePathname();
    const activeWebRoute = pathname.split('/').filter(Boolean)[0] || 'index';
    const insets = useSafeAreaInsets();
    const { theme, mode } = useTheme();
    const p = usePalette();
    const isDark = p.isDark;
    const background = theme.colors.background.primary;
    const isDesktopWeb = Platform.OS === 'web' && width > 768;

    useEffect(() => {
        if (Platform.OS === 'android') {
            const barColor = isDark ? '#0B0D18' : '#FAFBFE';
            SystemUI.setBackgroundColorAsync(barColor).catch(() => {});
        }
    }, [isDark]);

    const activeTabColor = isDark ? '#E1E8F5' : '#8BB8F3';
    const inactiveTabColor = isDark ? '#A0ACBE' : '#252A34';
    const bottomInset = Platform.OS === 'web' ? (insets.bottom || 0) : Math.max(insets.bottom, 8);
    const barHeight = 58 + bottomInset;

    return (
        <NavVisibilityProvider>
            <ResponsiveLayout>
                <Tabs
                    tabBar={(props) => <AnimatedTabBar {...props} />}
                    screenOptions={({ route }) => ({
                    headerShown: false,
                    // The web screen fallback can keep inactive tabs mounted.
                    // Hide their scenes explicitly so Inbox never paints over Feed.
                    sceneStyle: {
                        backgroundColor: background,
                        ...(Platform.OS === 'web' && { display: route.name === activeWebRoute ? 'flex' : 'none' }),
                    },
                    tabBarActiveTintColor: activeTabColor,
                    tabBarInactiveTintColor: inactiveTabColor,
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        display: isDesktopWeb ? 'none' : 'flex',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: barHeight,
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        borderTopWidth: 0,
                        borderTopColor: 'transparent',
                        borderColor: 'transparent',
                        elevation: 0,
                        shadowOpacity: 0,
                        shadowColor: 'transparent',
                        shadowOffset: { width: 0, height: 0 },
                        shadowRadius: 0,
                        paddingBottom: bottomInset,
                        paddingTop: 6,
                    },
                    tabBarBackground: () => null,
                    tabBarLabelStyle: {
                        display: 'none',
                    },
                    tabBarItemStyle: {
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                    tabBarHideOnKeyboard: true,
                })}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Feed',
                        tabBarAccessibilityLabel: 'Feed',
                        tabBarIcon: ({ focused }) => (
                            <MaterialCommunityIcons
                                name={focused ? 'home-variant' : 'home-variant-outline'}
                                size={24}
                                color={focused ? activeTabColor : inactiveTabColor}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="discover"
                    options={{
                        title: 'Discover',
                        tabBarAccessibilityLabel: 'Discover',
                        tabBarIcon: ({ focused }) => (
                            <Ionicons
                                name={focused ? 'navigate-circle' : 'navigate-circle-outline'}
                                size={24}
                                color={focused ? activeTabColor : inactiveTabColor}
                            />
                        ),
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
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#D9E4FF',
                                    shadowColor: '#111318',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 6,
                                    elevation: 4,
                                }}
                            >
                                <Feather
                                    name="plus"
                                    size={21}
                                    color="#111318"
                                />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="ai"
                    options={{
                        title: 'Orvelis AI',
                        tabBarAccessibilityLabel: 'Orvelis AI',
                        tabBarIcon: ({ focused }) => (
                            <Ionicons
                                name={focused ? 'sparkles' : 'sparkles-outline'}
                                size={24}
                                color={focused ? activeTabColor : inactiveTabColor}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="inbox"
                    options={{
                        title: 'Inbox',
                        tabBarAccessibilityLabel: 'Inbox',
                        tabBarIcon: ({ focused }) => (
                            <Ionicons
                                name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
                                size={24}
                                color={focused ? activeTabColor : inactiveTabColor}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        tabBarButton: () => null,
                        tabBarItemStyle: { display: 'none' },
                    }}
                />
            </Tabs>
        </ResponsiveLayout>
    </NavVisibilityProvider>
    );
};

export default TabLayout;
