/** @jsxImportSource react */
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePathname, useRouter, type Href } from 'expo-router';
import { AppNavigationIcon, LOGO_ICE_COLOR, type NavigationDestination } from '../Navigation/AppNavigationIcon';
import { useTheme } from '../Theme/ThemeProvider';
import { usePalette } from '../../design-system/palette';
import { useAuth } from '../../lib/supabase/hooks/useAuth';

const PRIMARY_NAV = [
    { label: 'Feed', path: '/', icon: 'feed' },
    { label: 'Discover', path: '/discover', icon: 'discover' },
    { label: 'Orvelis AI', path: '/ai', icon: 'ai' },
    { label: 'Inbox', path: '/inbox', icon: 'inbox' },
    { label: 'Profile', path: '/profile', icon: 'profile' },
] as const satisfies ReadonlyArray<{ label: string; path: Href; icon: NavigationDestination }>;

const SECONDARY_NAV = [
    { label: 'Notifications', path: '/notifications', icon: 'notifications' },
    { label: 'Saved clips', path: '/profile?tab=saved', icon: 'saved' },
] as const satisfies ReadonlyArray<{ label: string; path: Href; icon: NavigationDestination }>;

export function WebSidebar({ compact = false }: { compact?: boolean }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const { toggleTheme } = useTheme();
    const p = usePalette();
    const [hoveredPath, setHoveredPath] = useState<Href | null>(null);
    const iconColor = p.isDark ? LOGO_ICE_COLOR : '#345983';
    const selection = p.isDark ? '#22334B' : '#EAF2FD';
    const quiet = p.isDark ? '#192230' : '#F3F6FB';
    const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Your account';
    const avatar = user?.user_metadata?.avatar_url;

    const renderLink = (
        entry: { label: string; path: Href; icon: NavigationDestination },
        active = false,
    ) => (
        <Pressable
            key={entry.label}
            accessibilityRole="link"
            accessibilityLabel={entry.label}
            aria-current={active ? 'page' : undefined}
            onPress={() => router.push(entry.path)}
            onHoverIn={() => setHoveredPath(entry.path)}
            onHoverOut={() => setHoveredPath(null)}
            style={({ pressed }) => [
                styles.navItem,
                compact && styles.centered,
                {
                    backgroundColor: active ? selection : hoveredPath === entry.path ? quiet : 'transparent',
                    opacity: pressed ? 0.72 : 1,
                },
            ]}
        >
            <View style={[styles.navIcon, active && { backgroundColor: p.isDark ? '#2F4868' : '#DCEBFD' }]}>
                <AppNavigationIcon name={entry.icon} selected={active} color={active ? iconColor : p.sub} size={19} />
            </View>
            {!compact && <Text style={[styles.label, { color: active ? iconColor : p.sub }]}>{entry.label}</Text>}
        </Pressable>
    );

    return (
        <View style={[styles.rail, compact && styles.compactRail]}>
            <View role="navigation" accessibilityLabel="Datariot navigation"
                style={[styles.sidebar, compact && styles.compactSidebar, {
                    borderColor: p.isDark ? '#243247' : '#E7EDF5',
                    backgroundColor: p.isDark ? '#121823' : p.card,
                    boxShadow: p.isDark ? '0 10px 22px rgba(0, 0, 0, 0.18)' : '0 10px 25px rgba(32, 57, 89, 0.075), 0 2px 5px rgba(32, 57, 89, 0.035)',
                }]}>
                <Pressable accessibilityRole="link" accessibilityLabel="Datariot home" onPress={() => router.push('/')}
                    style={[styles.brand, compact && styles.centered]}>
                    <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                    {!compact && <Text style={[styles.wordmark, { color: p.text }]}>Datariot</Text>}
                </Pressable>

                <ScrollView style={styles.links} contentContainerStyle={styles.linkList} showsVerticalScrollIndicator={false}>
                    {PRIMARY_NAV.map(entry => renderLink(entry, entry.path === '/'
                        ? pathname === '/' || pathname === '/index'
                        : pathname === entry.path || pathname.startsWith(entry.path + '/')))}
                    <View style={styles.groupSpace} />
                    {SECONDARY_NAV.map(entry => renderLink(entry))}
                </ScrollView>

                <View style={styles.footer}>
                    <Pressable accessibilityRole="link" accessibilityLabel="Create clip" onPress={() => router.push('/create')}
                        style={({ pressed }) => [styles.create, compact && styles.centered, {
                            backgroundColor: quiet,
                            opacity: pressed ? 0.75 : 1,
                        }]}>
                        <AppNavigationIcon name="create" size={32} />
                        {!compact && <Text style={[styles.label, { color: p.text }]}>Create clip</Text>}
                    </Pressable>
                    <View style={styles.footerSpace} />
                    {renderLink({ label: 'Settings', path: '/settings', icon: 'settings' })}
                    <Pressable accessibilityRole="button" accessibilityLabel={p.isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                        onPress={toggleTheme} style={[styles.navItem, compact && styles.centered]}>
                        <View style={styles.navIcon}>
                            <AppNavigationIcon name={p.isDark ? 'sun' : 'moon'} size={18} color={p.sub} />
                        </View>
                        {!compact && <Text style={[styles.label, { color: p.sub }]}>{p.isDark ? 'Light mode' : 'Dark mode'}</Text>}
                    </Pressable>
                    <View style={[styles.account, { backgroundColor: quiet }]}>
                        <Pressable accessibilityRole="link" accessibilityLabel={user ? 'Your account' : 'Sign in'}
                            onPress={() => router.push(user ? '/profile' : '/auth/login')}
                            style={[styles.accountLink, compact && styles.centered]}>
                            {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : (
                                <View style={[styles.avatar, styles.centered, { backgroundColor: selection }]}>
                                    {user ? <Text style={[styles.label, { color: iconColor }]}>{username.charAt(0).toUpperCase()}</Text>
                                        : <Feather name="user" size={14} color={iconColor} />}
                                </View>
                            )}
                            {!compact && <Text style={[styles.label, styles.accountLabel, { color: p.text }]} numberOfLines={1}>
                                {user ? username : 'Sign in'}
                            </Text>}
                        </Pressable>
                        {user && !compact && (
                            <Pressable accessibilityRole="button" accessibilityLabel="Sign out" style={styles.signOut}
                                onPress={async () => {
                                    await signOut();
                                    router.replace('/auth/login');
                                }}>
                                <Feather name="log-out" size={15} color={p.sub} />
                            </Pressable>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    rail: { width: 218, flexShrink: 0, paddingLeft: 14, paddingVertical: 14 },
    compactRail: { width: 76, paddingLeft: 9, paddingVertical: 10 },
    sidebar: { flex: 1, minHeight: 0, borderWidth: 1, borderRadius: 23, paddingHorizontal: 11, paddingVertical: 11 },
    compactSidebar: { borderRadius: 19, paddingHorizontal: 7, paddingVertical: 8 },
    brand: { height: 50, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 6, marginBottom: 12 },
    logo: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#07090C' },
    wordmark: { fontFamily: 'Outfit_700Bold', fontSize: 24, letterSpacing: -0.75 },
    links: { flex: 1, minHeight: 0 },
    linkList: { gap: 3 },
    navItem: { minHeight: 43, borderRadius: 11, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6 },
    navIcon: { width: 29, height: 29, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    centered: { alignItems: 'center', justifyContent: 'center' },
    label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, letterSpacing: -0.1 },
    groupSpace: { height: 11 },
    footerSpace: { height: 5 },
    create: { minHeight: 45, borderRadius: 11, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6 },
    footer: { paddingTop: 8, gap: 2 },
    account: { flexDirection: 'row', alignItems: 'center', marginTop: 4, borderRadius: 11, paddingHorizontal: 3 },
    accountLink: { flex: 1, minWidth: 0, minHeight: 44, gap: 9, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
    avatar: { width: 30, height: 30, borderRadius: 15 },
    accountLabel: { flexShrink: 1 },
    signOut: { height: 40, width: 36, alignItems: 'center', justifyContent: 'center' },
});
