import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { useTabBarHeight } from '../../lib/hooks/useTabBarHeight';
import { RADIUS, useUI } from '../../design-system/ui';
import { Txt } from '../../components/core/Txt';
import { EmptyState } from '../../components/core/EmptyState';
import { notify } from '../../lib/utils/dialogs';

type IconName = keyof typeof Ionicons.glyphMap;

interface OptionProps {
    icon: IconName;
    title: string;
    subtitle: string;
    onPress: () => void;
    primary?: boolean;
}

/** One way to start something: an icon, what it does, and where it goes. */
function Option({ icon, title, subtitle, onPress, primary }: OptionProps) {
    const { c } = useUI();
    const fg = primary ? c.onAccent : c.text;
    const sub = primary ? c.onAccent : c.textSecondary;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={({ pressed }) => [
                styles.option,
                primary ? { backgroundColor: c.accent } : { backgroundColor: c.surface, borderWidth: 1, borderColor: c.hairline },
                pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
            ]}
        >
            <View style={[styles.optionIcon, { backgroundColor: primary ? 'rgba(0,0,0,0.08)' : c.surfaceHigh }]}>
                <Ionicons name={icon} size={24} color={fg} />
            </View>
            <View style={{ flex: 1 }}>
                <Txt variant="headline" style={{ color: fg }}>{title}</Txt>
                <Txt variant="callout" style={{ color: sub, opacity: primary ? 0.7 : 1, marginTop: 2 }}>{subtitle}</Txt>
            </View>
            <Ionicons name="chevron-forward" size={20} color={primary ? c.onAccent : c.textTertiary} />
        </Pressable>
    );
}

const TIPS = [
    'One idea per clip. If you can say it in a sentence, it fits.',
    'Say the point in the first few seconds, then show why.',
    'Under a minute. People can always go deeper with a Deep Dive.',
];

export default function CreateScreen() {
    const { user, loading } = useAuth();
    const { c, isDark } = useUI();
    const insets = useSafeAreaInsets();
    const tabBarHeight = useTabBarHeight();

    // Set when someone taps "Video FOR / AGAINST" on a debate: the clip answers that debate
    const { debateId, side } = useLocalSearchParams<{ debateId?: string; side?: string }>();
    const replying = !!debateId;
    const stance = side === 'AGAINST' ? 'Against' : 'For';

    const toEditor = (videoUri: string) => {
        router.push({ pathname: '/editor', params: { videoUri, ...(replying ? { debateId, side } : {}) } });
        // The tab stays mounted, so forget the debate once the clip is on its way
        if (replying) router.setParams({ debateId: undefined, side: undefined });
    };

    const record = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            notify('Camera access needed', 'Allow camera access in Settings to record a video.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            videoMaxDuration: 90,
            allowsEditing: true,
            quality: 1,
        });
        if (!result.canceled && result.assets?.[0]) toEditor(result.assets[0].uri);
    };

    const upload = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            notify('Photos access needed', 'Allow access to your library in Settings to upload a video.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 1,
        });
        if (!result.canceled && result.assets?.[0]) toEditor(result.assets[0].uri);
    };

    if (loading) {
        return (
            <View style={[styles.root, styles.center, { backgroundColor: c.bg }]}>
                <ActivityIndicator color={c.textSecondary} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.root, styles.center, { backgroundColor: c.bg }]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <EmptyState
                    icon="lock-closed-outline"
                    title="Sign in to create"
                    body="Post a video or start a debate with an account."
                    actionLabel="Sign in"
                    onAction={() => router.push('/auth/login')}
                />
            </View>
        );
    }

    return (
        <View style={[styles.root, { backgroundColor: c.bg }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: tabBarHeight + 32, paddingHorizontal: 20 }}
                showsVerticalScrollIndicator={false}
            >
                <Txt variant="display">{replying ? 'Answer on camera' : 'Create'}</Txt>
                <Txt variant="body" tone="secondary" style={{ marginTop: 6, marginBottom: 28 }}>
                    {replying ? 'Make your case in a clip. It lands in the debate.' : 'Make a point in a minute, or start a debate.'}
                </Txt>

                {replying ? (
                    <View style={[styles.reply, { backgroundColor: c.surface, borderColor: c.hairline }]}>
                        <Ionicons name="chatbubbles-outline" size={18} color={c.textSecondary} />
                        <Txt variant="callout" style={{ flex: 1 }}>Answering a debate · {stance}</Txt>
                        <Pressable
                            onPress={() => router.setParams({ debateId: undefined, side: undefined })}
                            hitSlop={12}
                            accessibilityRole="button"
                            accessibilityLabel="Stop answering this debate"
                        >
                            <Ionicons name="close" size={18} color={c.textTertiary} />
                        </Pressable>
                    </View>
                ) : null}

                <View style={{ gap: 12 }}>
                    <Option primary icon="videocam" title="Record a video" subtitle="Say it on camera, up to 90 seconds" onPress={record} />
                    <Option icon="images-outline" title="Upload a video" subtitle="Vertical works best" onPress={upload} />
                    {replying ? null : (
                        <Option icon="chatbubbles-outline" title="Propose a thesis" subtitle="Put an argument out, let people pick a side" onPress={() => router.push('/publish')} />
                    )}
                </View>

                <View style={[styles.tips, { borderColor: c.hairline }]}>
                    <Txt variant="micro" tone="tertiary" style={{ letterSpacing: 1.2, marginBottom: 12 }}>MAKE IT COUNT</Txt>
                    {TIPS.map((tip, i) => (
                        <View key={i} style={styles.tip}>
                            <Txt variant="callout" tone="tertiary" style={{ width: 18 }}>{i + 1}</Txt>
                            <Txt variant="callout" tone="secondary" style={{ flex: 1 }}>{tip}</Txt>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    center: { alignItems: 'center', justifyContent: 'center' },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        minHeight: 84,
        borderRadius: RADIUS.lg,
    },
    optionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    reply: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 48, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: 14 },
    tips: { marginTop: 32, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth },
    tip: { flexDirection: 'row', gap: 6, marginBottom: 10 },
});
