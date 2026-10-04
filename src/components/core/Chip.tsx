import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, useUI } from '../../design-system/ui';
import { Txt } from './Txt';

interface ChipProps {
    label: string;
    active?: boolean;
    onPress?: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    style?: StyleProp<ViewStyle>;
}

/** Filter pill. Active = filled with the accent; idle = a surface with a hairline. */
export function Chip({ label, active = false, onPress, icon, style }: ChipProps) {
    const { c } = useUI();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
                {
                    height: 36,
                    paddingHorizontal: 14,
                    borderRadius: RADIUS.pill,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: active ? c.accent : c.surface,
                    borderWidth: active ? 0 : 1,
                    borderColor: c.hairline,
                    opacity: pressed ? 0.7 : 1,
                },
                style,
            ]}
        >
            {icon ? <Ionicons name={icon} size={15} color={active ? c.onAccent : c.textSecondary} /> : null}
            <Txt variant="callout" tone={active ? 'onAccent' : 'secondary'}>{label}</Txt>
        </Pressable>
    );
}
