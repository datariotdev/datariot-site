import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Platform, ScrollView, ActivityIndicator, Alert, Pressable
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from '../../components/UI/SafeAreaView';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { pageBg } from '@design-system/surface';
import { Button } from '@components/UI/Button';
import { FONT } from '@design-system/fonts';
import { pixelClip } from '@design-system/pixel';

function ActionCard({
    onPress,
    icon,
    title,
    subtitle,
    isPrimary,
}: {
    onPress: () => void;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    isPrimary: boolean;
}) {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const [hovered, setHovered] = useState(false);

    const accent = theme.colors.primary.DEFAULT;
    const onAccent = theme.colors.primary.onPrimary;
    const hairline = isDark ? 'rgba(218, 230, 247, 0.16)' : 'rgba(7, 8, 12, 0.16)';

    // Primary: the logo colour as a solid slab (the info site's CTA). Secondary: a hairline box.
    const fg = isPrimary ? onAccent : theme.colors.text.primary;
    const sub = isPrimary ? onAccent : theme.colors.text.secondary;
    const tile = isPrimary
        ? onAccent
        : isDark ? 'rgba(218, 230, 247, 0.08)' : 'rgba(7, 8, 12, 0.06)';

    return (
        <Pressable
            onPress={onPress}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            style={[
                styles.card,
                pixelClip(6),
                isPrimary
                    ? { backgroundColor: accent, borderColor: accent, opacity: hovered ? 0.92 : 1 }
                    : {
                        backgroundColor: isDark ? 'rgba(218, 230, 247, 0.04)' : 'rgba(255, 255, 255, 0.6)',
                        borderColor: hovered ? accent : hairline,
                    },
                hovered && { transform: [{ translateY: -3 }] },
            ]}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconTile, pixelClip(4), { backgroundColor: tile }]}>
                    <Ionicons name={icon} size={26} color={isPrimary ? accent : theme.colors.text.primary} />
                </View>
                <Feather name="arrow-up-right" size={20} color={fg} />
            </View>

            <View style={styles.cardFooter}>
                <Text style={[styles.cardTitle, { color: fg, fontFamily: FONT.display }]}>{title.toUpperCase()}</Text>
                <Text style={[styles.cardSubtitle, { color: sub, fontFamily: FONT.tech, opacity: isPrimary ? 0.7 : 1 }]}>
                    {subtitle.toUpperCase()}
                </Text>
            </View>
        </Pressable>
    );
}

export default function CreateScreen() {
    const { user, loading } = useAuth();
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const bg = pageBg(theme.colors.background.primary);
    const fg = theme.colors.text.primary;

    const pickVideo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow access to media library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 1,
        });
        if (!result.canceled && result.assets && result.assets[0]) {
            router.push({ pathname: '/editor', params: { videoUri: result.assets[0].uri } });
        }
    };

    const handleWritePost = () => router.push('/publish');

    if (loading) {
        return (
            <View style={[styles.root, styles.center, { backgroundColor: bg }]}>
                <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
            </View>
        );
    }

    if (!user) {
        return (
            <SafeAreaView style={styles.root}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <View style={[styles.root, styles.center]}>
                    <Ionicons name="lock-closed" size={48} color={fg} style={{ marginBottom: 20 }} />
                    <Text style={[styles.lockTitle, { color: fg, fontFamily: theme.typography.fontFamilies.display }]}>
                        Sign in
                    </Text>
                    <Text style={[styles.lockSub, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamilies.regular }]}>
                        Required to create content
                    </Text>
                    <View style={{ marginTop: 28 }}>
                        <Button title="Sign in" size="large" onPress={() => router.push('/auth/login')} />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.column}>

                {/* HERO */}
                <View style={styles.heroBox}>
                    <View style={[styles.heroLine, { backgroundColor: theme.colors.primary.DEFAULT }]} />
                    <Text style={[styles.heroText, { color: fg, fontFamily: theme.typography.fontFamilies.display }]}>
                        CREATE
                    </Text>
                    <Text style={[styles.heroText, { color: fg, fontFamily: theme.typography.fontFamilies.display }]}>
                        SOMETHING
                    </Text>
                    <Text style={[styles.heroText, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamilies.display }]}>
                        NEW
                    </Text>
                </View>

                {/* CARDS */}
                <View style={styles.cardsContainer}>
                    <ActionCard
                        onPress={pickVideo}
                        icon="videocam"
                        title="Upload Video"
                        subtitle="Vertical 9:16 format"
                        isPrimary={true}
                    />

                    <ActionCard
                        onPress={handleWritePost}
                        icon="chatbubbles-outline"
                        title="Propose Thesis"
                        subtitle="Start a logical debate"
                        isPrimary={false}
                    />
                </View>

                {/* FOOTER TEXT */}
                <View style={styles.footerWrap}>
                    <Text style={[styles.footerText, { color: theme.colors.text.muted, fontFamily: FONT.tech }]}>
                        {`[ DATARIOT ]\n[ ICE / INK ]`}
                    </Text>
                </View>

              </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 60, flexGrow: 1 },
    column: { width: '100%', maxWidth: 720, alignSelf: 'center' },

    // Lock screen
    lockTitle: { fontSize: 24, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5 },
    lockSub: { fontSize: 15, marginTop: 8, textAlign: 'center' },

    // Hero
    heroBox: { marginBottom: 40, marginTop: 10 },
    heroLine: { width: 40, height: 4, backgroundColor: '#DAE6F7', marginBottom: 24 },
    heroText: {
        fontSize: Platform.OS === 'web' ? 48 : 38,
        fontWeight: '400',
        textTransform: 'uppercase',
        letterSpacing: 1,
        lineHeight: Platform.OS === 'web' ? 54 : 44,
    },

    // Cards
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
    },
    card: {
        flexGrow: 1,
        flexBasis: 260,
        maxWidth: 340,
        padding: 22,
        minHeight: 190,
        justifyContent: 'space-between',
        borderWidth: 1,
        // @ts-ignore — web-only
        cursor: 'pointer',
        // @ts-ignore — web-only
        transition: 'transform 0.2s ease, border-color 0.2s ease, opacity 0.2s ease',
    },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    iconTile: {
        width: 54,
        height: 54,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardFooter: { gap: 8, marginTop: 24 },
    cardTitle: { fontSize: 24, letterSpacing: 0.8 },
    cardSubtitle: { fontSize: 10, letterSpacing: 1.6 },

    // Footer
    footerWrap: { marginTop: 40, alignItems: 'flex-start' },
    footerText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
        lineHeight: 16,
        opacity: 0.6,
    },
});
