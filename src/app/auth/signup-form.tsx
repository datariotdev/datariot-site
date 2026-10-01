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

export default function SignupFormScreen() {
    const { signUp } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { theme } = useTheme();

    const handleSignUp = async () => {
        if (!email || !password || !username) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await signUp(email, password, username);

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
        <AuthShell kicker="Create account" title="Sign Up" subtitle="Create your account" onBack={() => router.back()}>
            <Field
                label="Username"
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />
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
                onSubmitEditing={handleSignUp}
            />

            {error ? <Text style={[styles.error, { color: theme.colors.error }]}>[ ! ] {error}</Text> : null}

            <Button title="Create Account" size="large" fullWidth loading={loading} onPress={handleSignUp} />

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
