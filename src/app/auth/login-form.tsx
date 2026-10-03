import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { AntDesign } from '@expo/vector-icons';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { AuthShell } from '@components/Auth/AuthShell';
import { Field } from '@components/UI/Field';
import { Button } from '@components/UI/Button';
import { FONT } from '@design-system/fonts';

export default function LoginFormScreen() {
    const { signIn } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { theme } = useTheme();

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await signIn(email, password);

            if (result.error) {
                setError(result.error.message);
            } else {
                router.replace('/(tabs)');
            }
        } catch {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell kicker="Sign in" title="Login" subtitle="Welcome back!" onBack={() => router.back()}>
            <Field
                label="Email"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <Field
                label="Password"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onSubmitEditing={handleLogin}
            />

            {error ? <Text style={[styles.error, { color: theme.colors.error }]}>[ ! ] {error}</Text> : null}

            <Button title="Login" size="large" fullWidth loading={loading} onPress={handleLogin} />

            <Button
                title="Continue with Google"
                variant="secondary"
                size="large"
                fullWidth
                onPress={() => {/* TODO: Google Auth */ }}
                leading={<AntDesign name="google" size={18} color={theme.colors.text.primary} />}
            />
        </AuthShell>
    );
}

const styles = StyleSheet.create({
    error: {
        fontFamily: FONT.tech,
        fontSize: 12,
        letterSpacing: 0.4,
        lineHeight: 18,
    },
});
