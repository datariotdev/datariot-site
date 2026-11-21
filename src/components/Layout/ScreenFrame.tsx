/** @jsxImportSource react */
import React, { type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../Theme/ThemeProvider';

export const MOBILE_CONTENT_WIDTH = 640;

export function ScreenFrame({ children, fullWidth = false }: { children: ReactNode; fullWidth?: boolean }) {
    const { theme } = useTheme();
    if (Platform.OS !== 'web' || fullWidth) return <>{children}</>;
    return <View style={[s.outer, { backgroundColor: theme.colors.background.primary }]}>
        <View style={s.content}>{children}</View>
    </View>;
}
const s = StyleSheet.create({
    outer: { flex: 1, minHeight: 0, alignItems: 'center' },
    content: { flex: 1, minHeight: 0, width: '100%', maxWidth: MOBILE_CONTENT_WIDTH },
});
