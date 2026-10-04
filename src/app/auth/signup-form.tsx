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

export default function SignupFormScreen() {
    const { signUp } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { c, isDark } = useUI();
    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkEmail, setCheckEmail] = useState(false);

    const submit = async () => {
        if (!username.trim() || !email.trim() || !password) {
            setError('Fill in all three fields.');
            return;
        }
        if (password.length < 6) {
            setError('Use at least 6 characters for the password.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await signUp(email.trim(), password, username.trim());
            if (result.error) {
                setError(result.error.message);
            } else if (!result.data?.session) {
                // The project asks people to confirm their email first: there is no session yet
                setCheckEmail(true);
            } else {
                router.replace('/(tabs)');
            }
        } catch {
            setError('Something went wrong. Try again.');
        } finally {
            setLoading(false);
        }
    };

    if (checkEmail) {
        return (
            <View style={[styles.root, styles.center, { backgroundColor: c.bg, paddingHorizontal: 32 }]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <Txt variant="display" style={{ textAlign: 'center' }}>Check your email</Txt>
                <Txt variant="body" tone="secondary" style={{ textAlign: 'center', marginTop: 10, marginBottom: 28 }}>
                    We sent a link to {email.trim()}. Open it to confirm your account, then sign in.
                </Txt>
                <Button label="Go to sign in" onPress={() => router.replace('/auth/login-form')} fullWidth />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: c.bg }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <View style={{ paddingTop: insets.top + 4, paddingHorizontal: 6 }}>
                <IconButton name="chevron-back" label="Back" onPress={() => router.back()} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Txt variant="display">Create your account</Txt>
                <Txt variant="body" tone="secondary" style={{ marginTop: 6, marginBottom: 32 }}>It takes a minute, like everything here.</Txt>

                <View style={{ gap: 18 }}>
                    <Field
                        label="Username"
                        placeholder="How people will find you"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="username"
                        returnKeyType="next"
                        onSubmitEditing={() => emailRef.current?.focus()}
                        blurOnSubmit={false}
                    />
                    <Field
                        ref={emailRef}
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
                        placeholder="At least 6 characters"
                        secret
                        value={password}
                        onChangeText={setPassword}
                        autoCapitalize="none"
                        textContentType="newPassword"
                        returnKeyType="go"
                        onSubmitEditing={submit}
                    />
                </View>

                {error ? <Txt variant="callout" tone="danger" style={{ marginTop: 14 }}>{error}</Txt> : null}

                <View style={{ marginTop: 26, gap: 12 }}>
                    <Button label="Create account" onPress={submit} loading={loading} fullWidth />
                    <Button label="Already have an account? Sign in" variant="ghost" onPress={() => router.replace('/auth/login-form')} fullWidth />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    center: { alignItems: 'center', justifyContent: 'center' },
    content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
});
