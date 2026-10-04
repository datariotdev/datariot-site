import React from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
import { FONT, TypeVariant } from '../../design-system/ui';
import { Txt, Tone } from './Txt';

interface RichTextProps {
    children: string;
    variant?: TypeVariant;
    tone?: Tone;
    style?: StyleProp<TextStyle>;
    /** Colour override for bullets and bold runs (e.g. text on an accent-filled bubble). */
    color?: string;
}

/** **bold** inside a line, and lines that start with -, * or • as bullets. Models write both; Text shows neither. */
function inline(line: string, color: string | undefined) {
    return line.split(/\*\*(.+?)\*\*/g).map((part, i) =>
        i % 2 === 1
            ? <Txt key={i} variant="bodyStrong" style={[{ fontFamily: FONT.semibold }, color ? { color } : null]}>{part}</Txt>
            : part,
    );
}

export function RichText({ children, variant = 'body', tone = 'primary', style, color }: RichTextProps) {
    const lines = (children || '').split('\n').filter((l, i, a) => l.trim() !== '' || (i > 0 && a[i - 1].trim() !== ''));

    return (
        <View style={{ gap: 6 }}>
            {lines.map((raw, i) => {
                const bullet = raw.match(/^\s*([-*•])\s+(.*)$/);
                const body = bullet ? bullet[2] : raw;
                if (!body.trim()) return <View key={i} style={{ height: 2 }} />;
                return (
                    <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                        {bullet ? <Txt variant={variant} tone={tone} style={[{ opacity: 0.6 }, color ? { color } : null]}>•</Txt> : null}
                        <Txt variant={variant} tone={tone} style={[{ flex: 1 }, color ? { color } : null, style]}>{inline(body, color)}</Txt>
                    </View>
                );
            })}
        </View>
    );
}
