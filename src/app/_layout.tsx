import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ScreenFrame } from '../components/Layout/ScreenFrame';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { lightColors, ThemeProvider, useTheme } from '../components/Theme/ThemeProvider';
import { NotificationsProvider } from '../components/Notifications/NotificationsProvider';
import * as SplashScreen from 'expo-splash-screen';
import {
    useFonts,
    Oxanium_400Regular,
    Oxanium_500Medium,
    Oxanium_600SemiBold,
    Oxanium_700Bold
} from '@expo-google-fonts/oxanium';
import {
    Orbitron_400Regular,
    Orbitron_500Medium,
    Orbitron_600SemiBold,
    Orbitron_700Bold,
    Orbitron_900Black
} from '@expo-google-fonts/orbitron';
import {
    Audiowide_400Regular
} from '@expo-google-fonts/audiowide';
import {
    Syncopate_400Regular,
    Syncopate_700Bold
} from '@expo-google-fonts/syncopate';
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold
} from '@expo-google-fonts/inter';
import {
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black
} from '@expo-google-fonts/outfit';
import {
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold
} from '@expo-google-fonts/space-grotesk';

import { Feather, Ionicons, MaterialCommunityIcons, Entypo, SimpleLineIcons, AntDesign, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import VercelAnalytics from '../components/Web/VercelAnalytics';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        Oxanium_400Regular,
        Oxanium_500Medium,
        Oxanium_600SemiBold,
        Oxanium_700Bold,
        Orbitron_400Regular,
        Orbitron_500Medium,
        Orbitron_600SemiBold,
        Orbitron_700Bold,
        Orbitron_900Black,
        Audiowide_400Regular,
        Syncopate_400Regular,
        Syncopate_700Bold,
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Outfit_300Light,
        Outfit_400Regular,
        Outfit_500Medium,
        Outfit_600SemiBold,
        Outfit_700Bold,
        Outfit_800ExtraBold,
        Outfit_900Black,
        SpaceGrotesk_400Regular,
        SpaceGrotesk_500Medium,
        SpaceGrotesk_700Bold,
        // Dot-matrix digits for the video timer (same face as the website's counters)
        Doto_900Black: require('../../assets/fonts/Doto_900Black.ttf'),
        ...Feather.font,
        ...Ionicons.font,
        ...MaterialCommunityIcons.font,
        ...Entypo.font,
        ...SimpleLineIcons.font,
        ...AntDesign.font,
        ...FontAwesome5.font,
        ...MaterialIcons.font,
    });

    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync().catch(() => { });
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <ThemeProvider>
            <ThemedAppContent />
            <VercelAnalytics />
        </ThemeProvider>
    );
}

function ThemedAppContent() {
    const { mode, theme } = useTheme();
    const isDark = mode === 'dark';
    const bg = theme.colors.background.primary;

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: bg }}>
            <SafeAreaProvider>
                <NotificationsProvider>
                    <SystemBarsSync />
                    <Stack
                        screenLayout={({ children, route }) => (
                            <ScreenFrame fullWidth={route.name === '(tabs)' || route.name === 'profile' || route.name === 'publish' || route.name === 'business' || route.name === 'notifications' || route.name.startsWith('user/')}>
                                {children}
                            </ScreenFrame>
                        )}
                        screenOptions={{ contentStyle: { backgroundColor: bg } }}
                    >
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
                        <Stack.Screen name="auth" options={{ headerShown: false }} />
                        <Stack.Screen name="editor" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                        <Stack.Screen name="notifications" options={{ headerShown: false }} />
                        <Stack.Screen name="video-player" options={{ headerShown: false }} />
                        <Stack.Screen name="profile" options={{ headerShown: false }} />
                        <Stack.Screen name="edit-profile" options={{
                            headerShown: false,
                            contentStyle: { backgroundColor: lightColors.background.primary },
                        }} />
                    </Stack>
                </NotificationsProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

function SystemBarsSync() {
    const { mode } = useTheme();
    const isDark = mode === 'dark';
    const barColor = isDark ? '#0B0D18' : '#FAFBFE';

    useEffect(() => {
        if (Platform.OS === 'android') {
            SystemUI.setBackgroundColorAsync(barColor).catch(() => {});
        } else if (Platform.OS === 'web' && typeof document !== 'undefined') {
            try {
                let meta = document.querySelector('meta[name="theme-color"]');
                if (!meta) {
                    meta = document.createElement('meta');
                    meta.setAttribute('name', 'theme-color');
                    document.head.appendChild(meta);
                }
                meta.setAttribute('content', barColor);
            } catch (e) {}
        }
    }, [isDark, barColor]);

    return <StatusBar style={isDark ? 'light' : 'dark'} />;
}
