import React from 'react';
import { Text, TextProps } from 'react-native';
import { type, TypeVariant, ON_VIDEO, useUI } from '../../design-system/ui';

export type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'onAccent' | 'danger' | 'onVideo' | 'onVideoDim';

interface TxtProps extends TextProps {
    variant?: TypeVariant;
    tone?: Tone;
}

/** The one text component: a type-scale step and a tone, nothing else to remember. */
export function Txt({ variant = 'body', tone = 'primary', style, ...props }: TxtProps) {
    const { c } = useUI();
    const color = {
        primary: c.text,
        secondary: c.textSecondary,
        tertiary: c.textTertiary,
        accent: c.accent,
        onAccent: c.onAccent,
        danger: c.danger,
        onVideo: ON_VIDEO.text,
        onVideoDim: ON_VIDEO.textSecondary,
    }[tone];

    return <Text {...props} style={[type[variant], { color }, style]} />;
}
