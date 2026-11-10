import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { theme } from '@design-system/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, Feather } from '@expo/vector-icons';

export default function SignupFormScreen() {
    const { signUp } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
                setError(result.error.message.includes('Database error') ? 'We couldn’t complete your registration. Please try again.' : result.error.message);
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
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Back Button */}
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </Pressable>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Sign Up</Text>
                        <Text style={styles.subtitle}>Create your account</Text>
                    </View>

                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor="#8A95A5"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#8A95A5"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#8A95A5"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        {error ? <View accessibilityRole="alert" style={styles.errorCard}><Feather name="alert-circle" size={19} color="#B42332" /><View style={{ flex: 1 }}><Text style={styles.errorHeading}>Couldn't create your account</Text><Text style={styles.errorText}>{error}</Text></View></View> : null}

                        <Pressable
                            style={[styles.signupButton, loading && styles.buttonDisabled]}
                            onPress={handleSignUp}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#D9E4FF', '#D9E4FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.signupButtonGradient}
                            >
                                <Text style={styles.signupButtonText}>
                                    {loading ? 'Loading...' : 'Create Account'}
                                </Text>
                            </LinearGradient>
                        </Pressable>



                        {/* Google Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.googleButton,
                                pressed && styles.buttonPressed
                            ]}
                            onPress={() => {/* TODO: Google Auth */ }}
                        >
                            <AntDesign name="google" size={20} color="#4285F4" style={styles.googleIcon} />
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
    },
    backButton: {
        padding: theme.spacing.lg,
    },
    backButtonText: {
        color: '#182131',
        fontSize: theme.typography.sizes.lg,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
    },
    header: {
        marginBottom: theme.spacing['3xl'],
    },
    title: {
        fontSize: theme.typography.sizes['4xl'],
        fontWeight: 'bold',
        color: '#182131',
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: theme.typography.sizes.lg,
        color: '#818C9D',
    },
    form: {
        gap: theme.spacing.lg,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: theme.borderRadius.lg,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        fontSize: theme.typography.sizes.lg,
        color: '#182131',
        borderWidth: 1,
        borderColor: '#DCE3F0',
    },
    errorCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 13, borderRadius: 13, borderWidth: 1, borderColor: '#F6CCD0', backgroundColor: '#FFF5F5' },
    errorHeading: { fontSize: 14, fontWeight: '700', color: '#A72230', marginBottom: 3 },
    errorText: { fontSize: 12, lineHeight: 18, color: '#76575D' },
    signupButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    signupButtonGradient: {
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signupButtonText: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: '600',
        color: '#000000',
    },
    buttonDisabled: {
        opacity: 0.5,
    },

    googleButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: theme.borderRadius.xl,
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#E1E7F1',
    },
    googleButtonText: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: '600',
        color: '#000000',
    },
    googleIcon: {
        marginRight: 10,
    },
    buttonPressed: {
        opacity: 0.8,
    },
});
