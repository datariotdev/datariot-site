import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, Platform, useWindowDimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../components/Theme/ThemeProvider';
import { useAuth } from '../lib/supabase/hooks/useAuth';

export default function SettingsScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const desktop = Platform.OS === 'web' && width > 768;
    const { mode, toggleTheme, theme } = useTheme();
    const { signOut } = useAuth();

    const isDark = mode === 'dark';

    const handleSignOut = () => {
        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined' && window.confirm('Log out of Datariot?')) {
                void signOut().then(() => router.replace('/auth/login'));
            }
            return;
        }
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        router.replace('/auth/login');
                    }
                }
            ]
        );
    };

    const monoFont = { fontFamily: 'System' as const };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={[styles.safeArea, desktop && { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 24 }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.colors.surface.overlay }]}>
                    <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/profile')} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.text.primary }, monoFont]}>Settings</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.content} contentContainerStyle={desktop ? { paddingBottom: 48 } : undefined}>
                    <View style={[styles.section, { borderBottomColor: theme.colors.surface.overlay }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.primary.DEFAULT }, monoFont]}>ACCOUNT</Text>
                        <TouchableOpacity style={[styles.row, { borderBottomColor: theme.colors.surface.overlay, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]} onPress={() => router.push('/edit-profile')}>
                            <Text style={[styles.rowLabel, { color: theme.colors.text.primary }, monoFont]}>EDIT PROFILE</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.row, { borderBottomColor: theme.colors.surface.overlay, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                            <Text style={[styles.rowLabel, { color: theme.colors.text.primary }, monoFont]}>PRIVACY & SECURITY</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.row, { borderBottomColor: theme.colors.surface.overlay, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                            <Text style={[styles.rowLabel, { color: theme.colors.text.primary }, monoFont]}>NOTIFICATIONS</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.section, { borderBottomColor: theme.colors.surface.overlay }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.primary.DEFAULT }, monoFont]}>PREFERENCES</Text>
                        <View style={[styles.row, { borderBottomColor: theme.colors.surface.overlay, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                            <Text style={[styles.rowLabel, { color: theme.colors.text.primary }, monoFont]}>DARK MODE</Text>
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: theme.colors.surface.light, true: theme.colors.primary.DEFAULT }}
                            />
                        </View>
                        <View style={[styles.row, { borderBottomColor: theme.colors.surface.overlay, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                            <Text style={[styles.rowLabel, { color: theme.colors.text.primary }, monoFont]}>AUTOPLAY VIDEOS</Text>
                            <Switch value={true} trackColor={{ false: theme.colors.surface.light, true: theme.colors.primary.DEFAULT }} />
                        </View>
                    </View>

                    <View style={[styles.section, { borderBottomColor: theme.colors.surface.overlay }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.primary.DEFAULT }, monoFont]}>SUPPORT</Text>
                        <TouchableOpacity style={[styles.row, { borderBottomColor: theme.colors.surface.overlay, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                            <Text style={[styles.rowLabel, { color: theme.colors.text.primary }, monoFont]}>HELP CENTER</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.row, { borderBottomColor: theme.colors.surface.overlay, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                            <Text style={[styles.rowLabel, { color: theme.colors.text.primary }, monoFont]}>REPORT A PROBLEM</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[styles.row, { borderBottomWidth: 0, marginTop: 20, backgroundColor: 'transparent' }]} onPress={handleSignOut}>
                        <Text style={[styles.rowLabel, { color: theme.colors.error, fontWeight: '700' }, monoFont]}>Log out</Text>
                    </TouchableOpacity>

                    <Text style={[styles.version, { color: theme.colors.text.muted }, monoFont]}>Datariot · v1.0.0</Text>
                </ScrollView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 23,
        fontWeight: '800',
        letterSpacing: -0.6,
    },
    content: {
        flex: 1,
    },
    /* Promote Business */
    section: {
        marginBottom: 24,
        borderBottomWidth: 1,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        marginLeft: 24,
        marginBottom: 12,
        marginTop: 20,
        letterSpacing: 1.5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 21,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
    },
    rowLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    version: {
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 40,
        fontSize: 12,
    },
});
