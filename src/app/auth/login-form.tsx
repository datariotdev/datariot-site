import React, { useRef, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { useUI } from '../../design-system/ui';
import { Txt } from '../../components/core/Txt';
import { Button } from '../../components/core/Button';
import { Field } from '../../components/core/Field';
import { IconButton } from '../../components/core/IconButton';

export default function LoginFormScreen() {
    const { signIn } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { c, isDark } = useUI();
    const passwordRef = useRef<TextInput>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        if (!email.trim() || !password) {
            setError('Enter your email and password.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await signIn(email.trim(), password);
            if (result.error) setError(result.error.message);
            else router.replace('/(tabs)');
        } catch {
            setError('Something went wrong. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: c.bg }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <View style={{ paddingTop: insets.top + 4, paddingHorizontal: 6 }}>
                <IconButton name="chevron-back" label="Back" onPress={() => router.back()} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Txt variant="display">Welcome back</Txt>
                <Txt variant="body" tone="secondary" style={{ marginTop: 6, marginBottom: 32 }}>Sign in to pick up where you left off.</Txt>

                <View style={{ gap: 18 }}>
                    <Field
                        label="Email"
                        placeholder="you@example.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        returnKeyType="next"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        blurOnSubmit={false}
                    />
                    <Field
                        ref={passwordRef}
                        label="Password"
                        placeholder="Your password"
                        secret
                        value={password}
                        onChangeText={setPassword}
                        autoCapitalize="none"
                        autoComplete="password"
                        textContentType="password"
                        returnKeyType="go"
                        onSubmitEditing={submit}
                    />
                </View>

                {error ? <Txt variant="callout" tone="danger" style={{ marginTop: 14 }}>{error}</Txt> : null}

                <View style={{ marginTop: 26, gap: 12 }}>
                    <Button label="Sign in" onPress={submit} loading={loading} fullWidth />
                    <Button label="New here? Create an account" variant="ghost" onPress={() => router.replace('/auth/signup-form')} fullWidth />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
});
