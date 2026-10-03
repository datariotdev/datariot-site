import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { WebSidebar, RAIL_WIDTH } from '../Web/WebSidebar';
import { WebRightPanel } from '../Web/WebRightPanel';
import { GlobalWebStyles } from '../UI/GlobalWebStyles';
import { usePathname } from 'expo-router';
import { useTheme } from '../Theme/ThemeProvider';
import { DOCK_WIDTH } from './metrics';

interface ResponsiveLayoutProps {
    children: React.ReactNode;
}

/** Below this the right dock folds away and the deck takes the full width. */
const DOCK_BREAKPOINT = 1280;

export const ResponsiveLayout = ({ children }: ResponsiveLayoutProps) => {
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web' && width > 768;
    const pathname = usePathname();
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    if (!isWeb) {
        // A phone browser still needs the web chrome (theme attribute, font
        // synthesis off); on native the component renders nothing.
        return (
            <View style={{ flex: 1 }}>
                <GlobalWebStyles />
                {children}
            </View>
        );
    }

    // Routes that keep the nav rail
    const showSidebar = [
        '/',
        '/index',
        '/discover',
        '/ai',
        '/inbox',
        '/profile',
        '/settings',
        '/create',
    ].includes(pathname);

    // The right dock is a home-feed instrument only, and only when there's room
    const showRightPanel = (pathname === '/' || pathname === '/index') && width >= DOCK_BREAKPOINT;

    if (!showSidebar) {
        return (
            <View style={styles.container}>
                <GlobalWebStyles />
                <View style={[styles.content, { maxWidth: '100%', paddingHorizontal: 24 }]}>
                    <View style={styles.fullWidthColumn}>{children}</View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <GlobalWebStyles />

            {/* The rail floats above everything; this column just reserves its gutter */}
            <WebSidebar />

            <View style={[styles.content, { paddingLeft: RAIL_WIDTH }]}>
                {/* Deck — the main working surface. With the dock it simply fills
                    what the rail and the dock leave, and the screen centres its own
                    column inside that; without it, pages are capped and centred. */}
                <View style={[styles.deckColumn, !showRightPanel && styles.deckCapped]}>
                    <View style={styles.deckInner}>{children}</View>
                </View>

                {/* Instrument dock: flush with the window's right edge */}
                {showRightPanel && (
                    <View
                        style={[
                            styles.dockColumn,
                            {
                                width: DOCK_WIDTH,
                                borderLeftColor: isDark ? 'rgba(218, 230, 247, 0.07)' : 'rgba(0, 0, 0, 0.06)',
                            },
                        ]}
                    >
                        <WebRightPanel />
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        zIndex: 1,
    },
    fullWidthColumn: {
        flex: 1,
        width: '100%',
        maxWidth: 1300,
        alignSelf: 'center',
    },
    deckColumn: {
        flex: 1,
        position: 'relative',
        // @ts-ignore — web-only
        overflowY: 'auto',
    },
    deckCapped: {
        maxWidth: 1180,
    },
    deckInner: {
        flex: 1,
        minHeight: '100%',
    },
    dockColumn: {
        borderLeftWidth: 1,
        // @ts-ignore — web-only
        overflowY: 'auto',
    },
});
