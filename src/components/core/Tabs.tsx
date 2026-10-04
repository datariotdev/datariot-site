import React from 'react';
import { Pressable, View } from 'react-native';
import { useUI } from '../../design-system/ui';
import { Txt } from './Txt';

interface TabsProps<T extends string> {
    tabs: { key: T; label: string }[];
    active: T;
    onChange: (key: T) => void;
}

/** Text tabs with a short underline under the active one. For lists, not for video. */
export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
    const { c } = useUI();
    return (
        <View style={{ flexDirection: 'row', gap: 22, paddingHorizontal: 20 }}>
            {tabs.map(t => {
                const on = t.key === active;
                return (
                    <Pressable key={t.key} onPress={() => onChange(t.key)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={{ paddingVertical: 10 }}>
                        <Txt variant="headline" tone={on ? 'primary' : 'tertiary'}>{t.label}</Txt>
                        <View style={{ height: 2, marginTop: 6, borderRadius: 1, backgroundColor: on ? c.accent : 'transparent' }} />
                    </Pressable>
                );
            })}
        </View>
    );
}
