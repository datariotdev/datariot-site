/** @jsxImportSource react */
import React, { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { useTheme, type ThemeMode } from '../components/Theme/ThemeProvider';
import { usePalette } from '../design-system/palette';
import { useAuth } from '../lib/supabase/hooks/useAuth';

type Icon = keyof typeof Ionicons.glyphMap;

export default function SettingsScreen() {
    const router = useRouter();
    const p = usePalette();
    const { mode, setThemeMode } = useTheme();
    const { user, signOut } = useAuth();
    const wide = useWindowDimensions().width > 900;
    const desktop = Platform.OS !== 'web' && wide;
    const [accountOpen, setAccountOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [avatarFailed, setAvatarFailed] = useState(false);
    const name = user?.user_metadata?.display_name || user?.user_metadata?.username || user?.email?.split('@')[0] || 'Your account';
    const username = user?.user_metadata?.username || user?.email?.split('@')[0];
    const avatar = user?.user_metadata?.avatar_url;
    const version = Constants.expoConfig?.version || '1.0.0';
    const editProfile = () => router.push(user ? '/edit-profile' : '/auth/login');
    const openAccount = () => user ? setAccountOpen(true) : router.push('/auth/login');
    const openLink = (url: string) => {
        setFeedback('');
        void Linking.openURL(url).catch(() => setFeedback('Couldn’t open the link. Please try again.'));
    };
    const logout = async () => {
        setSigningOut(true);
        setFeedback('');
        try { await signOut(); router.replace('/auth/login'); }
        catch { setFeedback('Couldn’t sign out. Please try again.'); }
        finally { setSigningOut(false); }
    };
    const confirmLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Log out of Datariot?')) void logout();
        } else Alert.alert('Log out', 'Log out of Datariot on this device?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log out', style: 'destructive', onPress: () => { void logout(); } },
        ]);
    };

    return <View style={[s.root, { backgroundColor: p.bg }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={s.safeArea}>
            <View style={s.shell}>
                <View style={s.toolbar}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/profile')}
                        style={[s.back, { borderColor: p.border }]}><Ionicons name="arrow-back" size={19} color={p.text} /></Pressable>
                    <Text style={[s.breadcrumb, { color: p.text }]}>datariot<Text style={{ color: p.faint, fontFamily: 'Outfit_400Regular' }}> / settings</Text></Text>
                    <Text style={[s.version, { color: p.faint }]}>v{version}</Text>
                </View>
                <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, !desktop && { paddingHorizontal: 20 }]} showsVerticalScrollIndicator={false}>
                    <View style={s.intro}>
                        <Text style={[s.eyebrow, { color: p.faint }]}>YOUR SPACE</Text>
                        <Text style={[s.headline, { color: p.text }, !desktop && { fontSize: 30, lineHeight: 35 }]}>Make Datariot yours.</Text>
                        <Text style={[s.subtitle, { color: p.sub }]}>The details that make it feel like you.</Text>
                    </View>
                    <View style={[s.columns, !desktop && { flexDirection: 'column' }]}>
                        <View style={[s.mainColumn, desktop && { flex: 1.45 }]}>
                            <Pressable accessibilityRole="button" accessibilityLabel={user ? 'Edit your profile' : 'Sign in'} onPress={editProfile}
                                style={({ pressed }) => [s.profileCard, { borderColor: p.border, backgroundColor: p.card, opacity: pressed ? 0.8 : 1 }]}>
                                <View style={[s.avatar, { backgroundColor: p.soft }]}>
                                    <Text style={[s.initial, { color: p.accent }]}>{String(name)[0]?.toUpperCase()}</Text>
                                    {avatar && !avatarFailed && <Image source={{ uri: avatar }} style={StyleSheet.absoluteFill} onError={() => setAvatarFailed(true)} />}
                                </View>
                                <View style={s.profileText}>
                                    <Text numberOfLines={1} style={[s.profileName, { color: p.text }]}>{user ? name : 'Your next idea starts here.'}</Text>
                                    <Text numberOfLines={1} style={[s.profileHandle, { color: p.sub }]}>{user ? `@${username}` : 'Sign in to your Datariot account'}</Text>
                                </View>
                                <View style={[s.profileEdit, { backgroundColor: p.soft }]}><Ionicons name={user ? 'create-outline' : 'arrow-forward'} size={18} color={p.accent} /></View>
                            </Pressable>
                            <SettingsGroup title="Account" icon="person-outline">
                                <SettingRow icon="create-outline" title="Edit profile" subtitle="Your name, bio and profile photo" onPress={editProfile} />
                                <SettingRow icon="bookmark-outline" title="Saved clips" subtitle="Keep your favourite ideas close" onPress={() => router.push(user ? { pathname: '/profile', params: { tab: 'saved' } } : '/auth/login')} />
                                <SettingRow icon="notifications-outline" title="Notifications" subtitle="Likes, replies, follows and updates" onPress={() => router.push('/notifications')} />
                                <SettingRow icon="shield-checkmark-outline" title="Account details" subtitle="Your sign-in email and account information" onPress={openAccount} last />
                            </SettingsGroup>
                            <SettingsGroup title="A little help" icon="help-buoy-outline">
                                <SettingRow icon="book-outline" title="Help & documentation" subtitle="Get to know Datariot and Orvelis" external onPress={() => openLink('https://info.datariot.xyz')} />
                                <SettingRow icon="flag-outline" title="Report a problem" subtitle="Tell us what needs a closer look" external onPress={() => openLink('https://github.com/datariotdev/datariot-app/issues/new')} last />
                            </SettingsGroup>
                        </View>
                        <View style={[s.sideColumn, desktop && { flex: 1 }]}>
                            <SettingsGroup title="Appearance" icon="color-palette-outline">
                                <View style={s.appearanceContent}>
                                    <Text style={[s.appearanceHint, { color: p.sub }]}>Pick your kind of atmosphere.</Text>
                                    <View accessibilityRole="radiogroup" accessibilityLabel="Colour theme" style={s.themeOptions}>
                                        <ThemeOption value="light" selected={mode === 'light'} onSelect={setThemeMode} />
                                        <ThemeOption value="dark" selected={mode === 'dark'} onSelect={setThemeMode} />
                                    </View>
                                    <Text style={[s.themeHint, { color: p.faint }]}>Your choice is saved on this device.</Text>
                                </View>
                            </SettingsGroup>
                        </View>
                    </View>
                    {!!feedback && <Text accessibilityLiveRegion="polite" style={[s.feedback, { color: p.danger }]}>{feedback}</Text>}
                    <View style={[s.footer, { borderTopColor: p.border }]}>
                        <Pressable accessibilityRole="button" accessibilityLabel={user ? 'Log out' : 'Sign in'} accessibilityState={{ disabled: signingOut, busy: signingOut }} aria-disabled={signingOut} aria-busy={signingOut}
                            disabled={signingOut} onPress={user ? confirmLogout : () => router.push('/auth/login')} style={s.logout}>
                            {signingOut ? <ActivityIndicator size="small" color={p.danger} /> : <Ionicons name={user ? 'log-out-outline' : 'log-in-outline'} size={18} color={user ? p.danger : p.accent} />}
                            <Text style={[s.logoutText, { color: user ? p.danger : p.accent }]}>{signingOut ? 'Signing out…' : user ? 'Log out' : 'Sign in'}</Text>
                        </Pressable>
                        <Text style={[s.footerText, { color: p.faint }]}>A little more curious, every day.</Text>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
        <Modal visible={accountOpen} transparent animationType="fade" onRequestClose={() => setAccountOpen(false)}>
            <View style={s.backdrop}>
                <Pressable accessibilityRole="button" accessibilityLabel="Close account details" style={StyleSheet.absoluteFill} onPress={() => setAccountOpen(false)} />
                <View style={[s.accountSheet, { backgroundColor: p.card, borderColor: p.border }]}>
                    <View style={s.sheetHeader}><Text style={[s.sheetTitle, { color: p.text }]}>Account details</Text>
                        <Pressable accessibilityRole="button" accessibilityLabel="Close account details" onPress={() => setAccountOpen(false)} style={s.sheetClose}><Ionicons name="close" size={22} color={p.text} /></Pressable></View>
                    <Text style={[s.detailLabel, { color: p.faint }]}>SIGN-IN EMAIL</Text>
                    <Text selectable style={[s.detailValue, { color: p.text }]}>{user?.email || 'Not signed in'}</Text>
                    {user?.email && <View style={[s.emailStatus, { backgroundColor: p.soft }]}><Ionicons name={user.email_confirmed_at ? 'checkmark-circle-outline' : 'mail-outline'} size={16} color={p.accent} />
                        <Text style={[s.emailStatusText, { color: p.sub }]}>{user.email_confirmed_at ? 'Email verified' : 'Email not verified'}</Text></View>}
                    <Text style={[s.detailLabel, { color: p.faint, marginTop: 24 }]}>USERNAME</Text>
                    <Text selectable style={[s.detailValue, { color: p.text }]}>{username ? `@${username}` : '—'}</Text>
                </View>
            </View>
        </Modal>
    </View>;
}

function SettingsGroup({ title, icon, children }: { title: string; icon: Icon; children: ReactNode }) {
    const p = usePalette();
    return <View style={[s.group, { backgroundColor: p.card, borderColor: p.border }]}>
        <View style={s.groupHeader}><View style={[s.groupIcon, { backgroundColor: p.soft }]}><Ionicons name={icon} size={17} color={p.accent} /></View>
            <Text style={[s.groupTitle, { color: p.text }]}>{title}</Text></View>
        {children}
    </View>;
}

function SettingRow({ icon, title, subtitle, onPress, external, last }: { icon: Icon; title: string; subtitle: string; onPress: () => void; external?: boolean; last?: boolean }) {
    const p = usePalette();
    return <Pressable accessibilityRole={external ? 'link' : 'button'} accessibilityLabel={title} onPress={onPress}
        style={({ pressed }) => [s.row, { backgroundColor: pressed ? p.soft : 'transparent' }]}>
        <View style={[s.rowIcon, { backgroundColor: p.soft }]}><Ionicons name={icon} size={18} color={p.sub} /></View>
        <View style={s.rowText}><Text style={[s.rowTitle, { color: p.text }]}>{title}</Text><Text style={[s.rowSubtitle, { color: p.faint }]}>{subtitle}</Text></View>
        <Ionicons name={external ? 'arrow-up-right-box-outline' : 'chevron-forward'} size={16} color={p.faint} />
        {!last && <View style={[s.rowRule, { backgroundColor: p.border }]} />}
    </Pressable>;
}

function ThemeOption({ value, selected, onSelect }: { value: ThemeMode; selected: boolean; onSelect: (mode: ThemeMode) => void }) {
    const p = usePalette();
    const dark = value === 'dark';
    const previewBackground = dark ? '#08090D' : '#DAE6F7';
    const previewCard = dark ? '#252D3A' : '#FFFFFF';
    const previewInk = dark ? '#B1C1D8' : '#7C93B3';
    return <Pressable accessibilityRole="radio" accessibilityLabel={`${dark ? 'Dark' : 'Light'} theme`} accessibilityState={{ checked: selected }} aria-checked={selected} onPress={() => onSelect(value)}
        style={({ pressed }) => [s.themeOption, { borderColor: selected ? p.accent : p.border, backgroundColor: selected ? p.soft : 'transparent', opacity: pressed ? 0.8 : 1 }]}>
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[s.themePreview, { backgroundColor: previewBackground }]}>
            <View style={[s.previewSidebar, { backgroundColor: previewCard }]}><View style={[s.previewDot, { backgroundColor: previewInk }]} /><View style={[s.previewLine, { backgroundColor: previewInk }]} /><View style={[s.previewLine, { backgroundColor: previewInk }]} /></View>
            <View style={s.previewBody}><View style={[s.previewHeading, { backgroundColor: previewInk }]} /><View style={s.previewTiles}>{[0, 1, 2].map(i => <View key={i} style={[s.previewTile, { backgroundColor: previewCard }]} />)}</View></View>
        </View>
        <View style={s.themeLabel}><Ionicons name={dark ? 'moon-outline' : 'sunny-outline'} size={15} color={p.text} /><Text style={[s.themeName, { color: p.text }]}>{dark ? 'Dark' : 'Light'}</Text>
            <View style={[s.radio, { borderColor: selected ? p.accent : p.faint }]}>{selected && <View style={[s.radioDot, { backgroundColor: p.accent }]} />}</View></View>
    </Pressable>;
}

const s = StyleSheet.create({
    root: { flex: 1 }, safeArea: { flex: 1 }, shell: { flex: 1, width: '100%', maxWidth: 1040, alignSelf: 'center' },
    toolbar: { minHeight: 70, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 13 },
    back: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    breadcrumb: { flex: 1, fontFamily: 'Outfit_600SemiBold', fontSize: 19, letterSpacing: -0.5 },
    version: { fontFamily: 'Outfit_400Regular', fontSize: 11 },
    scroll: { flex: 1 }, scrollContent: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 },
    intro: { marginBottom: 26 }, eyebrow: { fontFamily: 'Outfit_500Medium', fontSize: 9, letterSpacing: 2, marginBottom: 9 },
    headline: { fontFamily: 'Outfit_500Medium', fontSize: 36, lineHeight: 42, letterSpacing: -1.2 },
    subtitle: { fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 21, marginTop: 8 },
    columns: { flexDirection: 'row', alignItems: 'stretch', gap: 20 },
    mainColumn: { gap: 18, minWidth: 0 }, sideColumn: { gap: 18, minWidth: 0 },
    profileCard: { minHeight: 96, borderRadius: 19, borderWidth: 1, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13 },
    avatar: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    initial: { fontFamily: 'Outfit_500Medium', fontSize: 24 },
    profileText: { flex: 1, minWidth: 0 }, profileName: { fontFamily: 'Outfit_500Medium', fontSize: 20, letterSpacing: -0.5 },
    profileHandle: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 5 },
    profileEdit: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    group: { borderWidth: 1, borderRadius: 19, overflow: 'hidden' },
    groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 17, paddingBottom: 12 },
    groupIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    groupTitle: { fontFamily: 'Outfit_500Medium', fontSize: 15, letterSpacing: -0.2 },
    row: { position: 'relative', minHeight: 68, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
    rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    rowText: { flex: 1, minWidth: 0 }, rowTitle: { fontFamily: 'Outfit_500Medium', fontSize: 14, lineHeight: 19 },
    rowSubtitle: { fontFamily: 'Outfit_400Regular', fontSize: 11, lineHeight: 16, marginTop: 3 },
    rowRule: { position: 'absolute', left: 63, right: 18, bottom: 0, height: 1 },
    appearanceContent: { paddingHorizontal: 18, paddingBottom: 18 }, appearanceHint: { fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 18, marginBottom: 14 },
    themeOptions: { flexDirection: 'row', gap: 10 }, themeOption: { flex: 1, minWidth: 0, padding: 7, borderWidth: 1, borderRadius: 13 },
    themePreview: { height: 78, flexShrink: 0, borderRadius: 8, padding: 9, flexDirection: 'row', gap: 8, overflow: 'hidden' },
    previewSidebar: { width: 16, height: 60, borderRadius: 3, paddingTop: 7, alignItems: 'center', gap: 6 },
    previewDot: { width: 6, height: 6, borderRadius: 2 }, previewLine: { width: 7, height: 2, borderRadius: 1 },
    previewBody: { flex: 1, paddingTop: 7, minWidth: 0 }, previewHeading: { width: '70%', height: 4, borderRadius: 2, marginBottom: 9 },
    previewTiles: { flexDirection: 'row', gap: 4 }, previewTile: { flex: 1, height: 32, borderRadius: 3 },
    themeLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 3, paddingTop: 11, paddingBottom: 5 },
    themeName: { flex: 1, fontFamily: 'Outfit_500Medium', fontSize: 12 },
    radio: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, radioDot: { width: 6, height: 6, borderRadius: 3 },
    themeHint: { fontFamily: 'Outfit_400Regular', fontSize: 10, marginTop: 12 },
    creatorCard: { position: 'relative', borderWidth: 1, borderRadius: 19, overflow: 'hidden', padding: 23, minHeight: 226 },
    orbit: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 13, transform: [{ rotate: '-30deg' }, { scaleX: 1.4 }] },
    creatorIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
    creatorTitle: { fontFamily: 'Outfit_500Medium', fontSize: 24, lineHeight: 29, letterSpacing: -0.6 },
    creatorSubtitle: { fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 19, marginTop: 8, maxWidth: 240 },
    creatorLink: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 23 }, creatorLinkText: { fontFamily: 'Outfit_500Medium', fontSize: 13 },
    footer: { borderTopWidth: 1, marginTop: 26, paddingTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
    logout: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9 }, logoutText: { fontFamily: 'Outfit_500Medium', fontSize: 12 },
    footerText: { flexShrink: 1, fontFamily: 'Outfit_400Regular', fontSize: 11, textAlign: 'right' },
    feedback: { fontSize: 12, marginTop: 20, fontFamily: 'Outfit_400Regular' },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    accountSheet: { width: '100%', maxWidth: 440, borderWidth: 1, borderRadius: 23, padding: 24 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
    sheetTitle: { fontFamily: 'Outfit_500Medium', fontSize: 23, letterSpacing: -0.5 }, sheetClose: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    detailLabel: { fontFamily: 'Outfit_500Medium', fontSize: 9, letterSpacing: 1.4, marginBottom: 9 }, detailValue: { fontFamily: 'Outfit_400Regular', fontSize: 15, lineHeight: 22 },
    emailStatus: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, borderRadius: 8, padding: 8, marginTop: 12 },
    emailStatusText: { fontFamily: 'Outfit_400Regular', fontSize: 11 },
});
