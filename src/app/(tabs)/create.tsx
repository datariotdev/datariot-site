import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from '../../components/UI/SafeAreaView';
import { useTheme } from '../../components/Theme/ThemeProvider';

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

    const bg = '#151922';
    const borderCol = 'rgba(211,224,243,0.15)';

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={[
                styles.card,
                isPrimary
                    ? { backgroundColor: '#252E3E', borderColor: 'rgba(213,226,247,0.26)', borderWidth: 1, shadowColor: '#AABAD1', shadowOpacity: 0.12 }
                    : { backgroundColor: bg, borderColor: borderCol, borderWidth: 1 }
            ]}
        >
            <View style={styles.cardHeader}>
                <View style={[
                    styles.iconCircle,
                    isPrimary
                        ? { backgroundColor: '#DCE6F5' }
                        : { backgroundColor: 'rgba(214,227,247,0.09)' }
                ]}>
                    <Ionicons
                        name={icon}
                        size={28}
                        color={isPrimary ? '#101722' : '#E5ECF8'}
                    />
                </View>
                <View style={[
                    styles.arrowCircle,
                    isPrimary
                        ? { backgroundColor: 'rgba(221,231,247,0.13)' }
                        : { backgroundColor: 'rgba(221,231,247,0.08)' }
                ]}>
                    <Feather
                        name="arrow-up-right"
                        size={18}
                        color={isPrimary ? '#E5ECF8' : '#E5ECF8'}
                    />
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={[
                    styles.cardTitle,
                    { fontFamily: theme.typography.fontFamilies.bold },
                    { color: '#F1F4FA' }
                ]}>
                    {title}
                </Text>
                <Text style={[
                    styles.cardSubtitle,
                    { fontFamily: theme.typography.fontFamilies.regular },
                    { color: '#AAB7CC' }
                ]}>
                    {subtitle}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

export default function CreateScreen() {
    const { user, loading } = useAuth();
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const bg = '#090B10';
    const fg = '#F2F5FB';

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
            <SafeAreaView style={[styles.root, { backgroundColor: bg }]}>
                <StatusBar style="light" />
                <View style={[styles.root, styles.center]}>
                    <Ionicons name="lock-closed" size={48} color={fg} style={{ marginBottom: 20 }} />
                    <Text style={[styles.lockTitle, { color: fg, fontFamily: theme.typography.fontFamilies.brand }]}>
                        Sign in
                    </Text>
                    <Text style={[styles.lockSub, { color: '#AAB7CC', fontFamily: theme.typography.fontFamilies.regular }]}>
                        Required to create content
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* HERO */}
                <View style={styles.heroBox}>
                    <View style={styles.heroLine} />
                    <Text style={[styles.heroText, { color: fg, fontFamily: theme.typography.fontFamilies.brand }]}>
                        CREATE
                    </Text>
                    <Text style={[styles.heroText, { color: fg, fontFamily: theme.typography.fontFamilies.brand }]}>
                        SOMETHING
                    </Text>
                    <Text style={[styles.heroText, { color: isDark ? '#D9E4FF' : theme.colors.primary.DEFAULT, fontFamily: theme.typography.fontFamilies.brand }]}>
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
                    <Text style={[styles.footerText, { color: '#9EACC2', fontFamily: theme.typography.fontFamilies.mono }]}>
                        {`DESIGN SYSTEM\nB/W/BLU`}
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 60, flexGrow: 1 },

    // Lock screen
    lockTitle: { fontSize: 24, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5 },
    lockSub: { fontSize: 15, marginTop: 8, textAlign: 'center' },

    // Hero
    heroBox: { marginBottom: 40, marginTop: 10 },
    heroLine: { width: 40, height: 4, backgroundColor: '#D9E4FF', marginBottom: 24 },
    heroText: {
        fontSize: Platform.OS === 'web' ? 44 : 38,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: -1,
        lineHeight: Platform.OS === 'web' ? 50 : 44,
    },

    // Cards
    cardsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 24,
    },
    card: {
        width: '45%',
        maxWidth: 300,
        borderRadius: 24,
        padding: 24,
        minHeight: 180,
        justifyContent: 'space-between',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
    },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardFooter: { gap: 6, marginTop: 20 },
    cardTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    cardSubtitle: { fontSize: 14, fontWeight: '500' },

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
