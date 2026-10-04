import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Animated, ScrollView, Switch, Image as RNImage, useWindowDimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { useTheme } from '../Theme/ThemeProvider';
import { supabase } from '../../lib/supabase/client';
import { usePalette } from '../../design-system/palette';
import { Avatar } from '../UI/Avatar';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

type IconName = keyof typeof Ionicons.glyphMap;

/** Only places that exist. The old menu listed Rules, Leaderboard and Forum, which opened nothing. */
const MENU_ITEMS: { title: string; icon: IconName; route: string; match: string[] }[] = [
    { title: 'Home', icon: 'home-outline', route: '/', match: ['/', '/index'] },
    { title: 'Explore', icon: 'compass-outline', route: '/discover', match: ['/discover'] },
    { title: 'Create', icon: 'add-circle-outline', route: '/create', match: ['/create'] },
    { title: 'Orvelis', icon: 'sparkles-outline', route: '/ai', match: ['/ai'] },
    { title: 'Messages', icon: 'chatbubble-ellipses-outline', route: '/inbox', match: ['/inbox'] },
    { title: 'Profile', icon: 'person-outline', route: '/profile', match: ['/profile'] },
    { title: 'Settings', icon: 'settings-outline', route: '/settings', match: ['/settings'] },
];

const SOCIAL_LINKS = [
    { id: 'twitter', icon: 'twitter', url: 'https://twitter.com/datariot_xyz' },
    { id: 'discord', icon: 'discord', url: 'https://discord.gg/KvBpEVrk2' },
    { id: 'instagram', icon: 'instagram', url: 'https://instagram.com/datariot.xyz' },
];

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    // The tab bar is drawn above this menu, so the footer has to sit clear of it
    const tabBarHeight = useBottomTabBarHeight();
    const { width } = useWindowDimensions();
    const { user, signOut } = useAuth();
    const { toggleTheme } = useTheme();
    const p = usePalette();

    const panelWidth = Math.min(340, Math.round(width * 0.86));
    const progress = useRef(new Animated.Value(0)).current;
    const [mounted, setMounted] = useState(isOpen);
    const [me, setMe] = useState<{ name: string; avatar: string | null } | null>(null);

    useEffect(() => {
        if (isOpen) setMounted(true);
        Animated.timing(progress, { toValue: isOpen ? 1 : 0, duration: isOpen ? 260 : 200, useNativeDriver: true }).start(({ finished }) => {
            if (finished && !isOpen) setMounted(false);
        });
    }, [isOpen, progress]);

    // Who is signed in, for the card at the top
    useEffect(() => {
        if (!isOpen || !user || !supabase) return;
        let cancelled = false;
        supabase.from('profiles').select('username, display_name, avatar_url').eq('id', user.id).maybeSingle().then(({ data }: { data: any }) => {
            if (cancelled) return;
            setMe({
                name: data?.display_name || data?.username || user.email?.split('@')[0] || 'You',
                avatar: data?.avatar_url ?? null,
            });
        });
        return () => { cancelled = true; };
    }, [isOpen, user]);

    const go = (route: string) => {
        onClose();
        setTimeout(() => router.navigate(route as any), 180);
    };

    const handleSignOut = async () => {
        await signOut();
        onClose();
    };

    if (!mounted) return null;

    const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-panelWidth, 0] });

    return (
        <View style={styles.container} pointerEvents={isOpen ? 'auto' : 'none'}>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress, backgroundColor: 'rgba(0, 0, 0, 0.55)' }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
            </Animated.View>

            <Animated.View
                style={[
                    styles.panel,
                    { width: panelWidth, backgroundColor: p.bg, borderRightColor: p.border, paddingTop: insets.top + 14, paddingBottom: tabBarHeight + 10, transform: [{ translateX }] },
                ]}
            >
                {/* Brand + close */}
                <View style={styles.head}>
                    <View style={styles.brand}>
                        <RNImage source={require('../../../assets/logo.jpg')} style={styles.logo} />
                        <Text style={[styles.brandText, { color: p.text, fontFamily: p.fonts.bold }]}>Datariot</Text>
                    </View>
                    <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close menu" style={[styles.close, { backgroundColor: p.card, borderColor: p.border }]}>
                        <Ionicons name="close" size={20} color={p.text} />
                    </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
                    {/* Account */}
                    {user ? (
                        <Pressable onPress={() => go('/profile')} style={({ pressed }) => [styles.account, { backgroundColor: p.card, borderColor: p.border }, pressed && { opacity: 0.8 }]}>
                            <Avatar uri={me?.avatar} name={me?.name || user.email || ''} size={44} />
                            <View style={{ flex: 1 }}>
                                <Text numberOfLines={1} style={[styles.accName, { color: p.text, fontFamily: p.fonts.bold }]}>{me?.name || user.email?.split('@')[0]}</Text>
                                <Text style={[styles.accSub, { color: p.sub, fontFamily: p.fonts.regular }]}>View profile</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={p.faint} />
                        </Pressable>
                    ) : (
                        <Pressable onPress={() => { onClose(); setTimeout(() => router.push('/auth/login'), 180); }} style={({ pressed }) => [styles.signIn, { backgroundColor: p.accent }, pressed && { opacity: 0.85 }]}>
                            <Text style={[styles.signInText, { color: p.onAccent, fontFamily: p.fonts.semibold }]}>Sign in or create an account</Text>
                        </Pressable>
                    )}

                    {/* Where to go */}
                    <View style={styles.nav}>
                        {MENU_ITEMS.map(item => {
                            const active = item.match.includes(pathname);
                            return (
                                <Pressable
                                    key={item.title}
                                    onPress={() => go(item.route)}
                                    style={({ pressed }) => [styles.item, active && { backgroundColor: p.soft }, pressed && { opacity: 0.7 }]}
                                >
                                    <Ionicons name={item.icon} size={22} color={active ? p.accent : p.sub} />
                                    <Text style={[styles.itemText, { color: active ? p.text : p.sub, fontFamily: active ? p.fonts.bold : p.fonts.medium }]}>{item.title}</Text>
                                    {active ? <View style={[styles.dot, { backgroundColor: p.accent }]} /> : null}
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Preferences and the way out */}
                <View style={[styles.footer, { borderTopColor: p.border }]}>
                    <View style={styles.row}>
                        <Ionicons name="moon-outline" size={20} color={p.sub} />
                        <Text style={[styles.rowText, { color: p.text, fontFamily: p.fonts.medium }]}>Dark mode</Text>
                        <Switch
                            value={p.isDark}
                            onValueChange={() => toggleTheme()}
                            trackColor={{ false: p.cardHigh, true: p.accent }}
                            thumbColor={p.isDark ? p.onAccent : '#FFFFFF'}
                            ios_backgroundColor={p.cardHigh}
                        />
                    </View>

                    <View style={styles.social}>
                        {SOCIAL_LINKS.map(s => (
                            <Pressable
                                key={s.id}
                                onPress={() => Linking.openURL(s.url).catch(() => { })}
                                accessibilityLabel={s.id}
                                style={[styles.socialBtn, { backgroundColor: p.card, borderColor: p.border }]}
                            >
                                <FontAwesome5 name={s.icon} size={17} color={p.text} />
                            </Pressable>
                        ))}
                        <View style={{ flex: 1 }} />
                        {user ? (
                            <Pressable onPress={handleSignOut} hitSlop={8}>
                                <Text style={[styles.signOut, { color: p.danger, fontFamily: p.fonts.semibold }]}>Log out</Text>
                            </Pressable>
                        ) : null}
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
    panel: { position: 'absolute', top: 0, bottom: 0, left: 0, paddingHorizontal: 18, borderRightWidth: StyleSheet.hairlineWidth },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logo: { width: 34, height: 34, borderRadius: 10 },
    brandText: { fontSize: 20, letterSpacing: -0.3 },
    close: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    account: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, borderWidth: 1 },
    accName: { fontSize: 16 },
    accSub: { fontSize: 12.5, marginTop: 1 },
    signIn: { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
    signInText: { fontSize: 14.5 },
    nav: { marginTop: 14, gap: 2 },
    item: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 52, paddingHorizontal: 14, borderRadius: 14 },
    itemText: { flex: 1, fontSize: 16.5 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    footer: { paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, gap: 14 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6 },
    rowText: { flex: 1, fontSize: 15.5 },
    social: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2 },
    socialBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    signOut: { fontSize: 14.5, paddingHorizontal: 6 },
});
