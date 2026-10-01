import React from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { useTheme } from '../Theme/ThemeProvider';
import { pageBg } from '@design-system/surface';
import { FONT } from '@design-system/fonts';

interface AuthShellProps {
    /** Mono caption above the title, printed as [ SIGN IN ]. */
    kicker: string;
    title: string;
    subtitle: string;
    onBack: () => void;
    children: React.ReactNode;
}

/**
 * Frame shared by the sign-in and sign-up forms: a back link, the pixel
 * display title and a single column no wider than the info site's cards.
 */
export function AuthShell({ kicker, title, subtitle, onBack, children }: AuthShellProps) {
    const { theme } = useTheme();

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: pageBg(theme.colors.background.primary) }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
                    <Feather name="arrow-left" size={16} color={theme.colors.text.secondary} />
                    <Text style={[styles.backText, { color: theme.colors.text.secondary }]}>BACK</Text>
                </Pressable>

                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.column}>
                        <Text style={[styles.kicker, { color: theme.colors.text.muted }]}>[ {kicker.toUpperCase()} ]</Text>
                        <Text style={[styles.title, { color: theme.colors.text.primary }]}>{title.toUpperCase()}</Text>
                        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>{subtitle}</Text>

                        <View style={styles.form}>{children}</View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    back: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 18,
        alignSelf: 'flex-start',
    },
    backText: {
        fontFamily: FONT.tech,
        fontSize: 11,
        letterSpacing: 1.8,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 48,
    },
    column: {
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
    },
    kicker: {
        fontFamily: FONT.tech,
        fontSize: 11,
        letterSpacing: 2.4,
        marginBottom: 14,
    },
    title: {
        fontFamily: FONT.display,
        fontSize: 44,
        letterSpacing: 1.5,
        lineHeight: 50,
    },
    subtitle: {
        fontFamily: FONT.sans,
        fontSize: 16,
        marginTop: 10,
    },
    form: {
        gap: 18,
        marginTop: 36,
    },
});
