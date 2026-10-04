import React, { useState } from 'react';
import { Pressable, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, NO_OUTLINE, RADIUS, useUI } from '../../design-system/ui';
import { Txt } from './Txt';

interface FieldProps extends TextInputProps {
    label: string;
    /** Shows an eye to reveal what was typed. */
    secret?: boolean;
    /** A quiet line under the input: a rule, a count. */
    hint?: string;
}

/** A labelled text input: the label stays above it, the border lights up while you type. */
export const Field = React.forwardRef<TextInput, FieldProps>(function Field({ label, secret, hint, style, ...props }, ref) {
    const { c } = useUI();
    const [focused, setFocused] = useState(false);
    const [shown, setShown] = useState(false);
    const multiline = !!props.multiline;

    return (
        <View style={{ gap: 8 }}>
            <Txt variant="callout" tone="secondary">{label}</Txt>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: multiline ? 'flex-start' : 'center',
                    minHeight: multiline ? 104 : 52,
                    borderRadius: RADIUS.md,
                    borderWidth: 1,
                    borderColor: focused ? c.textTertiary : c.hairline,
                    backgroundColor: c.surface,
                    paddingHorizontal: 16,
                    paddingVertical: multiline ? 14 : 0,
                }}
            >
                <TextInput
                    ref={ref}
                    {...props}
                    secureTextEntry={secret && !shown}
                    onFocus={e => { setFocused(true); props.onFocus?.(e); }}
                    onBlur={e => { setFocused(false); props.onBlur?.(e); }}
                    placeholderTextColor={c.textTertiary}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    style={[
                        { flex: 1, color: c.text, fontFamily: FONT.regular, fontSize: 16, padding: 0 },
                        multiline ? { minHeight: 76 } : { height: 52 },
                        NO_OUTLINE,
                        style,
                    ]}
                />
                {secret ? (
                    <Pressable onPress={() => setShown(s => !s)} hitSlop={12} accessibilityRole="button" accessibilityLabel={shown ? 'Hide password' : 'Show password'}>
                        <Ionicons name={shown ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.textTertiary} />
                    </Pressable>
                ) : null}
            </View>
            {hint ? <Txt variant="caption" tone="tertiary" style={{ marginTop: -2 }}>{hint}</Txt> : null}
        </View>
    );
});
