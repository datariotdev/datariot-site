import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUI } from '../../design-system/ui';
import { Txt } from '../../components/core/Txt';
import { Button } from '../../components/core/Button';

/** The way in: the name, one line about what this is, and three choices. */
export default function WelcomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { c, isDark } = useUI();

    const browse = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

    return (
        <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <View style={styles.hero}>
                <View style={styles.brand}>
                    <Image source={require('../../../assets/logo.jpg')} style={styles.logo} />
                    <Txt variant="title">Datariot</Txt>
                </View>
                <Txt variant="display" style={{ marginTop: 28 }}>Short videos{'\n'}with a point.</Txt>
                <Txt variant="body" tone="secondary" style={{ marginTop: 12, maxWidth: 300 }}>
                    Learn something in a minute. Answer back on camera. The clearest argument wins, not the loudest.
                </Txt>
            </View>

            <View style={styles.actions}>
                <Button label="Sign in" onPress={() => router.push('/auth/login-form')} fullWidth />
                <Button label="Create account" variant="secondary" onPress={() => router.push('/auth/signup-form')} fullWidth />
                <Button label="Keep browsing" variant="ghost" onPress={browse} fullWidth />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, paddingHorizontal: 24 },
    hero: { flex: 1, justifyContent: 'center' },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    logo: { width: 52, height: 52, borderRadius: 14 },
    actions: { gap: 10 },
});
