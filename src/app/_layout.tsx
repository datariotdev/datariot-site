import React, { useEffect } from 'react';
import '@design-system/defaultFont';
import { Stack } from 'expo-router';
import { ThemeProvider as NavThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../components/Theme/ThemeProvider';
import { HudBackdrop } from '../components/UI/HudBackdrop';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
    PixelifySans_400Regular,
    PixelifySans_500Medium,
    PixelifySans_700Bold,
} from '@expo-google-fonts/pixelify-sans';
import {
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import {
    Doto_400Regular,
    Doto_700Bold,
    Doto_900Black,
} from '@expo-google-fonts/doto';
import {
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

import { Feather, Ionicons, MaterialCommunityIcons, Entypo, SimpleLineIcons, AntDesign, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

SplashScreen.preventAutoHideAsync();

// The stack's content background used to be a fixed #08090D, which flashed
// black between screens in light mode.
const ThemedStack = () => {
    const { theme, mode } = useTheme();
    // The navigator paints its own scene colour (rgb(242,242,242) by default) over
    // anything behind it. Transparent, so the aurora under the Stack shows through.
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    const navTheme = { ...base, colors: { ...base.colors, background: 'transparent', card: 'transparent' } };
    return (
        // One surface under every route: the aurora lives here, the screens
        // are transparent, and the base colour is only what shows on native
        // before the wash. Login, publish and chat get the same page as the feed.
        <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
            <HudBackdrop isDark={mode === 'dark'} />
            <NavThemeProvider value={navTheme}>
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="auth" options={{ headerShown: false }} />
                    <Stack.Screen name="editor" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                </Stack>
            </NavThemeProvider>
        </View>
    );
};

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        PixelifySans_400Regular,
        PixelifySans_500Medium,
        PixelifySans_700Bold,
        JetBrainsMono_400Regular,
        JetBrainsMono_500Medium,
        JetBrainsMono_600SemiBold,
        JetBrainsMono_700Bold,
        Doto_400Regular,
        Doto_700Bold,
        Doto_900Black,
        Manrope_300Light,
        Manrope_400Regular,
        Manrope_500Medium,
        Manrope_600SemiBold,
        Manrope_700Bold,
        Manrope_800ExtraBold,
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
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                    <ThemedStack />
                </SafeAreaProvider>
            </GestureHandlerRootView>
            {Platform.OS === 'web' && (
                <>
                    <Analytics />
                    <SpeedInsights />
                </>
            )}
        </ThemeProvider>
    );
}
