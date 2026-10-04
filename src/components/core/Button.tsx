import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, useUI } from '../../design-system/ui';
import { Txt } from './Txt';

interface ButtonProps {
    label: string;
    onPress?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    icon?: keyof typeof Ionicons.glyphMap;
    loading?: boolean;
    disabled?: boolean;
    size?: 'md' | 'sm';
    fullWidth?: boolean;
    style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, size = 'md', fullWidth, style }: ButtonProps) {
    const { c } = useUI();
    const primary = variant === 'primary';
    const fg = primary ? c.onAccent : c.text;
    const height = size === 'sm' ? 36 : 50;

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => [
                {
                    height,
                    paddingHorizontal: size === 'sm' ? 16 : 22,
                    borderRadius: RADIUS.pill,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: primary ? c.accent : variant === 'secondary' ? c.surface : 'transparent',
                    borderWidth: variant === 'secondary' ? 1 : 0,
                    borderColor: c.hairline,
                    opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
                    alignSelf: fullWidth ? 'stretch' : 'auto',
                },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color={fg} />
            ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={fg} /> : null}
                    <Txt variant={size === 'sm' ? 'callout' : 'bodyStrong'} style={{ color: fg }}>{label}</Txt>
                </View>
            )}
        </Pressable>
    );
}
