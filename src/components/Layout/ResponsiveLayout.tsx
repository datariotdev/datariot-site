import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { usePathname } from 'expo-router';
import { WebSidebar } from '../Web/WebSidebar';
import { GlobalWebStyles } from '../UI/GlobalWebStyles';
import { useTheme } from '../Theme/ThemeProvider';

export const ResponsiveLayout = ({ children }: { children: React.ReactNode }) => {
    const { width } = useWindowDimensions();
    const pathname = usePathname();
    const { theme } = useTheme();
    const isDesktop = Platform.OS === 'web' && width > 768;
    const cleanPath = (pathname || '').replace(/^\/+|\/+$/g, '').replace(/^\(tabs\)\/?/, '');
    const isFeed = !cleanPath || cleanPath === 'index';
    const maxWidth = isFeed ? 1350 : cleanPath === 'inbox' ? 1216 : cleanPath === 'discover' || cleanPath === 'notifications' || cleanPath === 'ai' ? 960 : 640;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <GlobalWebStyles />
            <View style={[styles.shell, isDesktop && styles.desktopShell]}>
                {isDesktop && <WebSidebar compact={width < 1100} />}
                <View style={styles.content}>
                    <View style={[styles.page, isDesktop && { maxWidth }]}>
                        {children}
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, minHeight: 0, overflow: 'hidden' },
    shell: { flex: 1, minHeight: 0, width: '100%' },
    desktopShell: { flexDirection: 'row', maxWidth: 1640, alignSelf: 'center' },
    content: { flex: 1, minWidth: 0, minHeight: 0 },
    page: { flex: 1, minHeight: 0, width: '100%', alignSelf: 'center' },
});
