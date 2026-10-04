import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../components/Theme/ThemeProvider';
import { useAuth } from '../lib/supabase/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen() {
    const router = useRouter();
    const { mode, toggleTheme, theme } = useTheme();
    const { signOut } = useAuth();

    const isDark = mode === 'dark';

    const handleSignOut = () => {
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

    const monoFont = { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.colors.surface.overlay }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.text.primary }, monoFont]}>[ SETTINGS ]</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.content}>
                    {/* Promote Business — gradient CTA */}
                    <Pressable
                        onPress={() => router.push('/business')}
                        style={styles.promoteWrapper}
                    >
                        <LinearGradient
                            colors={['#D9E4FF', '#D9E4FF', '#EC4899']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.promoteGradient}
                        >
                            <View style={styles.promoteLeft}>
                                <MaterialCommunityIcons name="rocket-launch-outline" size={22} color="#fff" />
                                <View>
                                    <Text style={[styles.promoteTitle, monoFont]}>[ PROMOTE BUSINESS ]</Text>
                                    <Text style={[styles.promoteSubtitle, monoFont]}>[ ADVERTISING.AND.PROMOTION ]</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                        </LinearGradient>
                    </Pressable>

                    <View style={[styles.section, { borderBottomColor: theme.colors.surface.overlay }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.primary.DEFAULT }, monoFont]}>[ ACCOUNT ]</Text>
                        <TouchableOpacity style={[styles.row, { borderBottomColor: theme.colors.surface.overlay, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]} onPress={() => router.push('/edit-profile')}>
                            <Text style={[styles.rowLabel, { color: theme.colors.text.primary }, monoFont]}>&gt; EDIT PROFILE</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.row, { borderBottomColor: theme.colors.surface.overlay, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                            <Text style={[styles.rowLabel, { color: theme.colors.text.primary }, monoFont]}>&gt; PRIVACY & SECURITY</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.row, { borderBottomColor: theme.colors.surface.overlay, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                            <Text style={[styles.rowLabel, { color: theme.colors.text.primary }, monoFont]}>&gt; NOTIFICATIONS</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.section, { borderBottomColor: theme.colors.surface.overlay }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.primary.DEFAULT }, monoFont]}>[ PREFERENCES ]</Text>
                        <View style={[styles.row, { borderBottomColor: theme.colors.surface.overlay, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                            <Text style={[styles.rowLabel, { color: theme.colors.text.primary }, monoFont]}>&gt; DARK MODE</Text>
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: theme.colors.surface.light, true: theme.colors.primary.DEFAULT }}
                            />
                        </View>
                        <View style={[styles.row, { borderBottomColor: theme.colors.surface.overlay, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                            <Text style={[styles.rowLabel, { color: theme.colors.text.primary }, monoFont]}>&gt; AUTOPLAY VIDEOS</Text>
                            <Switch value={true} trackColor={{ false: theme.colors.surface.light, true: theme.colors.primary.DEFAULT }} />
                        </View>
                    </View>

                    <View style={[styles.section, { borderBottomColor: theme.colors.surface.overlay }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.primary.DEFAULT }, monoFont]}>[ SUPPORT ]</Text>
                        <TouchableOpacity style={[styles.row, { borderBottomColor: theme.colors.surface.overlay, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                            <Text style={[styles.rowLabel, { color: theme.colors.text.primary }, monoFont]}>&gt; HELP CENTER</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.row, { borderBottomColor: theme.colors.surface.overlay, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                            <Text style={[styles.rowLabel, { color: theme.colors.text.primary }, monoFont]}>&gt; REPORT A PROBLEM</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[styles.row, { borderBottomWidth: 0, marginTop: 20, backgroundColor: 'transparent' }]} onPress={handleSignOut}>
                        <Text style={[styles.rowLabel, { color: theme.colors.error, fontWeight: '700' }, monoFont]}>[ LOG OUT ]</Text>
                    </TouchableOpacity>

                    <Text style={[styles.version, { color: theme.colors.text.muted }, monoFont]}>[ VERSION.1.0.0 ]</Text>
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
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    /* Promote Business */
    promoteWrapper: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 8,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    promoteGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    promoteLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    promoteTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    promoteSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    section: {
        marginBottom: 24,
        borderBottomWidth: 1,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 20,
        marginBottom: 8,
        marginTop: 16,
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    rowLabel: {
        fontSize: 16,
    },
    version: {
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 40,
        fontSize: 12,
    },
});
