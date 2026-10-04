import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUI } from '../../design-system/ui';
import { Txt } from './Txt';
import { Button } from './Button';

interface EmptyStateProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    body?: string;
    actionLabel?: string;
    onAction?: () => void;
}

/** One icon, one sentence, at most one button. */
export function EmptyState({ icon, title, body, actionLabel, onAction }: EmptyStateProps) {
    const { c } = useUI();
    return (
        <View style={{ alignItems: 'center', paddingHorizontal: 40, paddingVertical: 48, gap: 6 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.surface, borderWidth: 1, borderColor: c.hairline, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Ionicons name={icon} size={24} color={c.textSecondary} />
            </View>
            <Txt variant="headline" style={{ textAlign: 'center' }}>{title}</Txt>
            {body ? <Txt variant="body" tone="secondary" style={{ textAlign: 'center' }}>{body}</Txt> : null}
            {actionLabel && onAction ? (
                <View style={{ marginTop: 14 }}>
                    <Button label={actionLabel} onPress={onAction} size="sm" />
                </View>
            ) : null}
        </View>
    );
}
