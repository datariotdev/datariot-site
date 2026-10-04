import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUI, ON_VIDEO } from '../../design-system/ui';

interface IconButtonProps {
    name: keyof typeof Ionicons.glyphMap;
    onPress?: () => void;
    size?: number;
    /** glass: translucent disc for sitting on video; soft: surface disc; plain: just the icon */
    variant?: 'glass' | 'soft' | 'plain';
    color?: string;
    label: string;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
}

/** 44pt touch target around any icon, with a label for screen readers. */
export function IconButton({ name, onPress, size = 22, variant = 'plain', color, label, disabled, style }: IconButtonProps) {
    const { c } = useUI();
    const bg = variant === 'glass' ? ON_VIDEO.glass : variant === 'soft' ? c.surface : 'transparent';
    const fg = color ?? (variant === 'glass' ? ON_VIDEO.text : c.text);

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={6}
            style={({ pressed }) => [
                { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
                style,
            ]}
        >
            <View
                style={{
                    width: variant === 'plain' ? 44 : 40,
                    height: variant === 'plain' ? 44 : 40,
                    borderRadius: 22,
                    backgroundColor: bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: variant === 'soft' ? 1 : 0,
                    borderColor: c.hairline,
                }}
            >
                <Ionicons name={name} size={size} color={fg} />
            </View>
        </Pressable>
    );
}
