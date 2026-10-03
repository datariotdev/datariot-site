import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Image as RNImage } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { pageBg } from '@design-system/surface';
import { FONT } from '@design-system/fonts';
import { pixelClip } from '@design-system/pixel';
import { Button } from '@components/UI/Button';

export default function WelcomeScreen() {
    const router = useRouter();
    const loginScale = useRef(new Animated.Value(1)).current;
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const handleLogin = () => {
        router.push('/auth/login-form');
    };

    const handleSignUp = () => {
        router.push('/auth/signup-form');
    };

    const onLoginPressIn = useCallback(() => {
        Animated.spring(loginScale, {
            toValue: 0.95,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    }, [loginScale]);

    const onLoginPressOut = useCallback(() => {
        Animated.spring(loginScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 8,
        }).start();
    }, [loginScale]);

    return (
        <View style={[styles.container, { backgroundColor: pageBg(theme.colors.background.primary) }]}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.contentContainer}>
                    {/* Wordmark: the logo tile and the name, as on info.datariot.xyz */}
                    <View style={styles.brandRow}>
                        <RNImage
                            source={require('../../../assets/logo.jpg')}
                            style={[styles.logoTile, pixelClip(5)]}
                        />
                        <Text style={[styles.appName, { color: theme.colors.text.primary, fontFamily: FONT.display }]}>DATARIOT</Text>
                    </View>

                    <Text style={[styles.tagline, { color: theme.colors.text.muted, fontFamily: FONT.tech }]}>
                        [ DISCOVER // LEARN // GROW ]
                    </Text>

                    <View style={styles.buttonsSection}>
                        <Button
                            title="Sign in"
                            size="large"
                            fullWidth
                            onPress={handleLogin}
                            trailing={<Feather name="arrow-right" size={18} color={theme.colors.primary.onPrimary} />}
                        />
                        <Button title="Create account" variant="secondary" size="large" fullWidth onPress={handleSignUp} />
                        <Button
                            title="Continue with Google"
                            variant="secondary"
                            size="large"
                            fullWidth
                            onPress={() => {/* TODO: Google Auth */ }}
                            leading={<AntDesign name="google" size={18} color={theme.colors.text.primary} />}
                        />
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        width: '100%',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    logoTile: {
        width: 44,
        height: 44,
    },
    appName: {
        fontSize: 38,
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 11,
        letterSpacing: 2.4,
        marginTop: 14,
        marginBottom: 52,
        textAlign: 'center',
    },
    buttonsSection: {
        width: '100%',
        maxWidth: 400,
        gap: 12,
    },
});
