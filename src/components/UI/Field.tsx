import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../Theme/ThemeProvider';
import { FONT } from '@design-system/fonts';
import { pixelClip } from '@design-system/pixel';

interface FieldProps extends TextInputProps {
    /** Caption set above the input in mono, e.g. "EMAIL". Printed as [ EMAIL ]. */
    label?: string;
}

/**
 * Text input in the info site's idiom: a mono caption, a hairline box with
 * stepped corners, and the accent colour on the edge while it has focus.
 */
export function Field({ label, style, onFocus, onBlur, ...props }: FieldProps) {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const [focused, setFocused] = useState(false);

    return (
        <View style={styles.wrap}>
            {label ? (
                <Text style={[styles.label, { color: focused ? theme.colors.text.primary : theme.colors.text.muted }]}>
                    [ {label.toUpperCase()} ]
                </Text>
            ) : null}
            <TextInput
                placeholderTextColor={theme.colors.text.muted}
                selectionColor={theme.colors.primary.DEFAULT}
                onFocus={(e) => {
                    setFocused(true);
                    onFocus?.(e);
                }}
                onBlur={(e) => {
                    setFocused(false);
                    onBlur?.(e);
                }}
                style={[
                    styles.input,
                    pixelClip(4),
                    {
                        color: theme.colors.text.primary,
                        backgroundColor: isDark ? 'rgba(218, 230, 247, 0.04)' : 'rgba(255, 255, 255, 0.7)',
                        borderColor: focused
                            ? theme.colors.primary.DEFAULT
                            : isDark ? 'rgba(218, 230, 247, 0.16)' : 'rgba(7, 8, 12, 0.18)',
                    },
                    // @ts-ignore — web-only: the border is the focus ring
                    { outlineStyle: 'none' },
                    style,
                ]}
                {...props}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        gap: 8,
    },
    label: {
        fontFamily: FONT.tech,
        fontSize: 10,
        letterSpacing: 1.8,
    },
    input: {
        fontFamily: FONT.sans,
        fontSize: 16,
        minHeight: 52,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1.5,
        // @ts-ignore — web-only
        transition: 'border-color 0.18s ease',
    },
});
