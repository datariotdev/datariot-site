import React from 'react';
import { View, StyleSheet, Pressable, Switch, ScrollView, Linking } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../components/Theme/ThemeProvider';
import { useAuth } from '../lib/supabase/hooks/useAuth';
import { useFeedPrefs } from '../lib/hooks/useFeedPrefs';
import { RADIUS, useUI } from '../design-system/ui';
import { Txt } from '../components/core/Txt';
import { IconButton } from '../components/core/IconButton';
import { notify, confirmAction } from '../lib/utils/dialogs';

type IconName = keyof typeof Ionicons.glyphMap;

const LINKS = {
    privacy: 'https://info.datariot.xyz/privacy.html',
    terms: 'https://info.datariot.xyz/terms.html',
    help: 'https://docs.datariot.xyz',
    community: 'https://discord.gg/KvBpEVrk2',
};

function Group({ title, children }: { title?: string; children: React.ReactNode }) {
    const { c } = useUI();
    return (
        <View style={{ marginTop: 28 }}>
            {title ? <Txt variant="micro" tone="tertiary" style={styles.groupTitle}>{title.toUpperCase()}</Txt> : null}
            <View style={[styles.group, { backgroundColor: c.surface, borderColor: c.hairline }]}>{children}</View>
        </View>
    );
}

interface RowProps {
    icon: IconName;
    label: string;
    onPress?: () => void;
    /** A switch instead of a chevron. */
    toggle?: { value: boolean; onChange: (v: boolean) => void };
    danger?: boolean;
    last?: boolean;
    detail?: string;
}

function Row({ icon, label, onPress, toggle, danger, last, detail }: RowProps) {
    const { c } = useUI();
    const inner = (
        <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.hairline }]}>
            <Ionicons name={icon} size={20} color={danger ? c.danger : c.textSecondary} />
            <Txt variant="body" tone={danger ? 'danger' : 'primary'} style={{ flex: 1 }}>{label}</Txt>
            {detail ? <Txt variant="callout" tone="tertiary">{detail}</Txt> : null}
            {toggle ? (
                <Switch
                    value={toggle.value}
                    onValueChange={toggle.onChange}
                    trackColor={{ false: c.surfaceHigh, true: c.accent }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={c.surfaceHigh}
                />
            ) : onPress && !danger ? (
                <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
            ) : null}
        </View>
    );

    if (toggle || !onPress) return inner;
    return (
        <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && { backgroundColor: c.surfaceHigh }}>
            {inner}
        </Pressable>
    );
}

export default function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { c, isDark } = useUI();
    const { toggleTheme } = useTheme();
    const { user, signOut } = useAuth();
    const { soundOn, setSoundOn, autoplay, setAutoplay } = useFeedPrefs();

    const open = (url: string) => Linking.openURL(url).catch(() => notify('Could not open the link', url));

    const handleSignOut = async () => {
        const yes = await confirmAction('Log out?', { message: 'You can sign back in any time.', confirmLabel: 'Log out', destructive: true });
        if (!yes) return;
        await signOut();
        router.replace('/auth/login');
    };

    const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
    const version = Constants.expoConfig?.version || '1.0.0';

    return (
        <View style={[styles.root, { backgroundColor: c.bg }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <IconButton name="chevron-back" label="Back" onPress={goBack} />
                <Txt variant="headline">Settings</Txt>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
                {user ? (
                    <Group title="Account">
                        <Row icon="person-outline" label="Edit profile" onPress={() => router.push('/edit-profile')} />
                        <Row icon="bookmark-outline" label="Saved videos" onPress={() => router.push({ pathname: '/profile', params: { tab: 'saved' } })} last />
                    </Group>
                ) : (
                    <Group>
                        <Row icon="log-in-outline" label="Sign in or create an account" onPress={() => router.push('/auth/login')} last />
                    </Group>
                )}

                <Group title="Preferences">
                    <Row icon="moon-outline" label="Dark mode" toggle={{ value: isDark, onChange: () => toggleTheme() }} />
                    <Row icon="play-outline" label="Autoplay videos" toggle={{ value: autoplay, onChange: setAutoplay }} />
                    <Row icon="volume-high-outline" label="Sound on in the feed" toggle={{ value: soundOn, onChange: setSoundOn }} last />
                </Group>

                <Group title="About">
                    <Row icon="help-circle-outline" label="Help and docs" onPress={() => open(LINKS.help)} />
                    <Row icon="people-outline" label="Community on Discord" onPress={() => open(LINKS.community)} />
                    <Row icon="shield-checkmark-outline" label="Privacy policy" onPress={() => open(LINKS.privacy)} />
                    <Row icon="document-text-outline" label="Terms of service" onPress={() => open(LINKS.terms)} last />
                </Group>

                {user ? (
                    <Group>
                        <Row icon="log-out-outline" label="Log out" danger onPress={handleSignOut} last />
                    </Group>
                ) : null}

                <Txt variant="caption" tone="tertiary" style={styles.version}>Datariot {version}</Txt>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 4 },
    groupTitle: { letterSpacing: 1.2, marginLeft: 6, marginBottom: 8 },
    group: { borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, minHeight: 54 },
    version: { textAlign: 'center', marginTop: 28 },
});
