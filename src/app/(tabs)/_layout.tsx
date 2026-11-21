/** @jsxImportSource react */
import React, { useEffect } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { BottomTabBar } from 'expo-router/build/layouts/Tabs';
import { setAudioModeAsync } from 'expo-audio';
import { AppNavigationIcon } from '../../components/Navigation/AppNavigationIcon';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ResponsiveLayout } from '../../components/Layout/ResponsiveLayout';
import { useTheme } from '../../components/Theme/ThemeProvider';
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
    const isDark = mode === 'dark';
    const background = theme.colors.background.primary;
    const isDesktopWeb = Platform.OS === 'web' && width > 768;

    useEffect(() => {
        if (Platform.OS === 'android') {
            const barColor = isDark ? '#0B0D18' : '#FAFBFE';
            SystemUI.setBackgroundColorAsync(barColor).catch(() => {});
        }
    }, [isDark]);

    const activeTabColor = isDark ? '#E1E8F5' : '#111318';
    const inactiveTabColor = isDark ? '#A0ACBE' : '#242830';
    const bottomInset = Platform.OS === 'web' ? (insets.bottom || 0) : Math.max(insets.bottom, 8);
    const barHeight = 52 + bottomInset;

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
                        paddingTop: 16,
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
                            <AppNavigationIcon name="feed" selected={focused}
                                color={focused ? activeTabColor : inactiveTabColor} size={22} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="discover"
                    options={{
                        title: 'Discover',
                        tabBarAccessibilityLabel: 'Discover',
                        tabBarIcon: ({ focused }) => (
                            <AppNavigationIcon name="discover" selected={focused}
                                color={focused ? activeTabColor : inactiveTabColor} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="create"
                    options={{
                        title: 'Create',
                        tabBarAccessibilityLabel: 'Create',
                        tabBarIcon: () => <AppNavigationIcon name="create" size={40} />,
                    }}
                />
                <Tabs.Screen
                    name="ai"
                    options={{
                        title: 'Orvelis AI',
                        tabBarAccessibilityLabel: 'Orvelis AI',
                        tabBarIcon: ({ focused }) => (
                            <AppNavigationIcon name="ai" selected={focused}
                                color={focused ? activeTabColor : inactiveTabColor} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="inbox"
                    options={{
                        title: 'Inbox',
                        tabBarAccessibilityLabel: 'Inbox',
                        tabBarIcon: ({ focused }) => (
                            <AppNavigationIcon name="inbox" selected={focused}
                                color={focused ? activeTabColor : inactiveTabColor} />
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
