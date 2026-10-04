import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { setAudioModeAsync } from 'expo-audio';
import { Feather, SimpleLineIcons, Ionicons, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { View, Dimensions, Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { ResponsiveLayout } from '../../components/Layout/ResponsiveLayout';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

    // Same two colours as the site: the logo's ice (dark) or ink (light) for what is selected
    const accent = isDark ? '#D9E4FF' : '#07080C';
    const onAccent = isDark ? '#07080C' : '#DAE6F7';

    return (
        <ResponsiveLayout>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    // Let the layout's HUD backdrop show through instead of the
                    // navigator's default light scene background.
                    sceneStyle: { backgroundColor: 'transparent' },
                    tabBarActiveTintColor: accent,
                    tabBarInactiveTintColor: isDark ? 'rgba(241, 242, 245, 0.58)' : 'rgba(7, 8, 12, 0.52)',
                    tabBarStyle: {
                        display: isDesktopWeb ? 'none' : 'flex',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: Platform.OS === 'ios' ? 88 : 68,
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
                        paddingTop: 8,
                        paddingBottom: Platform.OS === 'ios' ? 26 : 8,
                    },
                    // A real surface under the icons: they used to float over the video and the text
                    tabBarBackground: () => (
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    backgroundColor: isDark ? 'rgba(8, 9, 13, 0.9)' : 'rgba(218, 230, 247, 0.93)',
                                    borderTopWidth: StyleSheet.hairlineWidth,
                                    borderTopColor: isDark ? 'rgba(217, 228, 255, 0.12)' : 'rgba(7, 8, 12, 0.10)',
                                },
                            ]}
                        >
                            {Platform.OS === 'ios' ? <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : null}
                        </View>
                    ),
                    tabBarShowLabel: true,
                    tabBarLabelStyle: {
                        fontSize: 10.5,
                        marginTop: 3,
                        fontFamily: theme.typography.fontFamilies.medium,
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
                        title: 'Home',
                        tabBarIcon: ({ focused, color }) => (
                            <MaterialCommunityIcons
                                name={focused ? "home-variant" : "home-variant-outline"}
                                size={25}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="discover"
                    options={{
                        title: 'Explore',
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
                        title: 'Create',
                        tabBarLabel: () => null,
                        tabBarIcon: ({ focused }) => (
                            <View style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: accent,
                                marginTop: 2,
                            }}>
                                <Feather
                                    name="plus"
                                    size={24}
                                    color={onAccent}
                                />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="ai"
                    options={{
                        title: 'Orvelis',
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
                        title: 'Messages',
                        tabBarIcon: ({ focused, color }) => (
                            <Ionicons
                                name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
                                size={25}
                                color={color}
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
