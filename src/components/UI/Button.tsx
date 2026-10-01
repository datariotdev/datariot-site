import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps, View } from 'react-native';
import { useTheme } from '../Theme/ThemeProvider';
import { FONT } from '@design-system/fonts';
import { pixelClip } from '@design-system/pixel';

interface ButtonProps extends Omit<PressableProps, 'children'> {
    title: string;
    /**
     * primary   — solid: ink on a light page, ice on a dark one (the info site's CTA)
     * secondary — outlined, translucent fill
     * ghost     — text only
     */
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    /** Rendered before the label (an icon). */
    leading?: React.ReactNode;
    /** Rendered after the label (usually an arrow). */
    trailing?: React.ReactNode;
}

export function Button({
    title,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    fullWidth = false,
    leading,
    trailing,
    style,
    ...props
}: ButtonProps) {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const [hovered, setHovered] = useState(false);

    const accent = theme.colors.primary.DEFAULT;
    const onAccent = theme.colors.primary.onPrimary;
    const kind = variant === 'outline' ? 'secondary' : variant;

    const fill =
        kind === 'primary'
            ? accent
            : kind === 'secondary'
                ? hovered
                    ? (isDark ? 'rgba(218, 230, 247, 0.12)' : 'rgba(7, 8, 12, 0.07)')
                    : (isDark ? 'rgba(218, 230, 247, 0.04)' : 'rgba(255, 255, 255, 0.62)')
                : 'transparent';

    const labelColor = kind === 'primary' ? onAccent : theme.colors.text.primary;
    const borderColor = kind === 'secondary' ? (hovered ? accent : theme.colors.surface.borderHover) : 'transparent';

    return (
        <Pressable
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            disabled={disabled || loading}
            style={(state) => [
                styles.base,
                pixelClip(4),
                styles[size],
                { backgroundColor: fill, borderColor, borderWidth: kind === 'secondary' ? 1.5 : 0 },
                kind === 'primary' && hovered && { opacity: 0.88 },
                fullWidth && styles.fullWidth,
                (disabled || loading) && styles.disabled,
                state.pressed && styles.pressed,
                typeof style === 'function' ? style(state) : style,
            ]}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={labelColor} />
            ) : (
                <View style={styles.row}>
                    {leading}
                    <Text style={[styles.text, styles[`${size}Text`], { color: labelColor }]}>{title}</Text>
                    {trailing}
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        alignItems: 'center',
        justifyContent: 'center',
        // @ts-ignore — web-only
        cursor: 'pointer',
        // @ts-ignore — web-only
        transition: 'background-color 0.18s ease, border-color 0.18s ease, opacity 0.18s ease',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    fullWidth: {
        width: '100%',
    },

    small: { paddingHorizontal: 14, minHeight: 36 },
    medium: { paddingHorizontal: 22, minHeight: 48 },
    large: { paddingHorizontal: 28, minHeight: 58 },

    // The info site sets its buttons in JetBrains Mono, sentence case.
    text: {
        fontFamily: FONT.techMedium,
        letterSpacing: 0.4,
    },
    smallText: { fontSize: 12 },
    mediumText: { fontSize: 15 },
    largeText: { fontSize: 17 },

    pressed: { opacity: 0.82, transform: [{ translateY: 1 }] },
    disabled: { opacity: 0.45 },
});
