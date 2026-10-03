import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { setAudioModeAsync } from 'expo-audio';
import { Feather, SimpleLineIcons, Ionicons, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { View, Dimensions, Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { ResponsiveLayout } from '../../components/Layout/ResponsiveLayout';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { BlurView } from '@components/UI/BlurView';
import { pixelClip } from '@design-system/pixel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Hides a tab's scene while it is not the focused one.
 *
 * On web the navigator stacks every visited scene on top of one another and
 * relies on the scenes' own backgrounds to hide the ones beneath. Now that the
 * scenes are transparent (the aurora behind them is one continuous surface),
 * the feed would show through Discover, so unfocused scenes are taken out of
 * the layout instead.
 */
const WebSceneGate = ({ navigation, children }: { navigation: any; children: React.ReactNode }) => {
    const [focused, setFocused] = useState<boolean>(() => navigation.isFocused());

    useEffect(() => {
        setFocused(navigation.isFocused());
        const onFocus = navigation.addListener('focus', () => setFocused(true));
        const onBlur = navigation.addListener('blur', () => setFocused(false));
        return () => {
            onFocus();
            onBlur();
        };
    }, [navigation]);

    return <View style={{ flex: 1, display: focused ? 'flex' : 'none' }}>{children}</View>;
};

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
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const isDesktopWeb = Platform.OS === 'web' && width > 768;

    return (
        <ResponsiveLayout>
            <Tabs
                screenLayout={Platform.OS === 'web'
                    ? ({ navigation, children }) => <WebSceneGate navigation={navigation}>{children}</WebSceneGate>
                    : undefined}
                screenOptions={{
                    headerShown: false,
                    // Let the layout's HUD backdrop show through instead of the
                    // navigator's default light scene background.
                    sceneStyle: { backgroundColor: 'transparent' },
                    tabBarActiveTintColor: theme.colors.primary.DEFAULT,
                    tabBarInactiveTintColor: isDark ? 'rgba(218, 230, 247, 0.55)' : 'rgba(7, 8, 12, 0.5)',
                    tabBarStyle: {
                        display: isDesktopWeb ? 'none' : 'flex',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: Platform.OS === 'ios' ? 88 : 64,
                        backgroundColor: isDark ? 'rgba(8, 9, 13, 0.92)' : 'rgba(250, 252, 255, 0.94)',
                        borderWidth: 0,
                        borderTopWidth: 1,
                        borderTopColor: isDark ? 'rgba(218, 230, 247, 0.12)' : 'rgba(7, 8, 12, 0.12)',
                        borderColor: 'transparent',
                        elevation: 0,
                        shadowOpacity: 0,
                        shadowColor: 'transparent',
                        shadowOffset: { width: 0, height: 0 },
                        shadowRadius: 0,
                        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
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
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: '',
                        tabBarIcon: ({ focused, color }) => (
                            <MaterialCommunityIcons
                                name={focused ? "home-variant" : "home-variant-outline"}
                                size={24}
                                color={color}
                                style={{ opacity: focused ? 1 : 0.8 }}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="discover"
                    options={{
                        title: '',
                        tabBarIcon: ({ focused, color }) => (
                            <Ionicons
                                name={focused ? "navigate-circle" : "navigate-circle-outline"}
                                size={24}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="create"
                    options={{
                        title: '',
                        tabBarIcon: ({ focused }) => (
                            <View style={[{
                                width: 44,
                                height: 44,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: theme.colors.primary.DEFAULT,
                            }, pixelClip(5)]}>
                                <Feather
                                    name="plus"
                                    size={22}
                                    color={theme.colors.primary.onPrimary}
                                />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="ai"
                    options={{
                        title: '',
                        tabBarIcon: ({ focused, color }) => (
                            <MaterialCommunityIcons
                                name={focused ? "robot-excited" : "robot-excited-outline"}
                                size={24}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="inbox"
                    options={{
                        title: '',
                        tabBarIcon: ({ focused, color }) => (
                            <Ionicons
                                name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
                                size={24}
                                color={color}
                                style={{ opacity: focused ? 1 : 0.8 }}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        href: null, // This is the correct way in Expo Router to completely remove the tab
                    }}
                />
            </Tabs>
        </ResponsiveLayout>
    );
};

export default TabLayout;
