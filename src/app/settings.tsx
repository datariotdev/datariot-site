import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../components/Theme/ThemeProvider';
import { useAuth } from '../lib/supabase/hooks/useAuth';
import { TECH_FONT } from '@design-system/fonts';
import { pixelClip } from '@design-system/pixel';
import { pageBg } from '@design-system/surface';

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

    const monoFont = { fontFamily: TECH_FONT };
    const accent = theme.colors.primary.DEFAULT;
    const onAccent = theme.colors.primary.onPrimary;

    // Ice track with an ink thumb on dark, ink track with a white thumb on light.
    const switchColors = (on: boolean) => ({
        trackColor: {
            false: isDark ? 'rgba(218, 230, 247, 0.14)' : 'rgba(7, 8, 12, 0.14)',
            true: accent,
        },
        thumbColor: on ? onAccent : theme.colors.text.muted,
        // react-native-web: colour of the thumb while the switch is on
        activeThumbColor: onAccent,
    });

    return (
        <View style={[styles.container, { backgroundColor: pageBg(theme.colors.background.primary) }]}>
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
                        style={[styles.promoteWrapper, pixelClip(5), { backgroundColor: accent }]}
                    >
                        <View style={styles.promoteGradient}>
                            <View style={styles.promoteLeft}>
                                <MaterialCommunityIcons name="rocket-launch-outline" size={22} color={onAccent} />
                                <View>
                                    <Text style={[styles.promoteTitle, monoFont, { color: onAccent }]}>[ PROMOTE BUSINESS ]</Text>
                                    <Text style={[styles.promoteSubtitle, monoFont, { color: onAccent }]}>[ ADVERTISING.AND.PROMOTION ]</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={onAccent} />
                        </View>
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
                                {...switchColors(isDark)}
                            />
                        </View>
                        <View style={[styles.row, { borderBottomColor: theme.colors.surface.overlay, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                            <Text style={[styles.rowLabel, { color: theme.colors.text.primary }, monoFont]}>&gt; AUTOPLAY VIDEOS</Text>
                            <Switch value={true} {...switchColors(true)} />
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
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.6,
    },
    promoteSubtitle: {
        fontSize: 10,
        letterSpacing: 1.2,
        marginTop: 4,
        opacity: 0.7,
    },
    section: {
        marginBottom: 24,
        borderBottomWidth: 1,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 20,
        marginBottom: 8,
        marginTop: 16,
        letterSpacing: 2,
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
        fontSize: 15,
        letterSpacing: 0.6,
    },
    version: {
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 40,
        fontSize: 12,
    },
});
