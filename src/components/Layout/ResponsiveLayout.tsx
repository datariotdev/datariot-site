import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, Animated } from 'react-native';
import { WebSidebar } from '../Web/WebSidebar';
import { WebRightPanel } from '../Web/WebRightPanel';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname } from 'expo-router';
import { useTheme } from '../Theme/ThemeProvider';

interface ResponsiveLayoutProps {
    children: React.ReactNode;
}

export const ResponsiveLayout = ({ children }: ResponsiveLayoutProps) => {
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web' && width > 768;
    const pathname = usePathname();
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    if (!isWeb) {
        return <View style={{ flex: 1 }}>{children}</View>;
    }

    // Multi-layer ambient aurora glow
    const ambientAurora = isDark ? (
        <>
            {/* Primary Ice Blue glow — top left */}
            <LinearGradient
                colors={['rgba(217, 228, 255, 0.07)', 'rgba(217, 228, 255, 0.02)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.6, y: 0.5 }}
                style={[styles.ambientGlow, { height: 700 }]}
            />
            {/* Secondary cyan glow — top right */}
            <LinearGradient
                colors={['rgba(189, 235, 255, 0.04)', 'transparent']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0.3, y: 0.6 }}
                style={[styles.ambientGlow, { height: 600 }]}
            />
            {/* Subtle warm accent for depth — bottom */}
            <LinearGradient
                colors={['transparent', 'rgba(217, 228, 255, 0.015)']}
                start={{ x: 0.5, y: 0.7 }}
                end={{ x: 0.5, y: 1 }}
                style={[styles.ambientGlowBottom]}
            />
        </>
    ) : (
        <LinearGradient
            colors={['rgba(217, 228, 255, 0.08)', 'rgba(217, 228, 255, 0.02)', 'transparent']}
            style={[styles.ambientGlow, { height: 400 }]}
        />
    );

    // Check if the current route should display the left sidebar
    const showSidebar = [
        '/',
        '/index',
        '/discover',
        '/ai',
        '/inbox',
        '/profile',
        '/settings',
        '/create'
    ].includes(pathname);

    // Only show the right panel on the home feed
    const showRightPanel = pathname === '/' || pathname === '/index';

    // If not a sidebar page, use full screen layout (no sidebars)
    if (!showSidebar) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
                {ambientAurora}
                <View style={[styles.content, { maxWidth: '100%', paddingHorizontal: 24 }]}>
                    <View style={styles.fullWidthColumn}>
                        {children}
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            {ambientAurora}

            <View style={styles.content}>
                {/* Left Sidebar */}
                <View style={styles.leftColumn}>
                    <WebSidebar />
                </View>

                {/* Subtle left divider line */}
                {isDark && (
                    <LinearGradient
                        colors={['transparent', 'rgba(217, 228, 255, 0.04)', 'transparent']}
                        style={styles.columnDivider}
                    />
                )}

                {/* Main Content (Feed, Discover, AI, etc.) */}
                <View style={[styles.centerColumn, { backgroundColor: 'transparent' }]}>
                    {/* Left Side Glow */}
                    <View style={styles.sideGlowLeft} pointerEvents="none">
                        <LinearGradient
                            colors={isDark
                                ? ['rgba(165, 198, 255, 0.0)', 'rgba(165, 198, 255, 0.06)', 'rgba(217, 228, 255, 0.12)', 'rgba(165, 198, 255, 0.06)', 'rgba(165, 198, 255, 0.0)']
                                : ['rgba(107, 127, 204, 0.0)', 'rgba(107, 127, 204, 0.04)', 'rgba(107, 127, 204, 0.08)', 'rgba(107, 127, 204, 0.04)', 'rgba(107, 127, 204, 0.0)']
                            }
                            start={{ x: 0, y: 0.3 }}
                            end={{ x: 1, y: 0.7 }}
                            style={StyleSheet.absoluteFillObject}
                        />
                        {/* Inner radial glow spot */}
                        <LinearGradient
                            colors={isDark
                                ? ['rgba(217, 228, 255, 0.18)', 'transparent']
                                : ['rgba(107, 127, 204, 0.12)', 'transparent']
                            }
                            start={{ x: 1, y: 0.5 }}
                            end={{ x: 0, y: 0.5 }}
                            style={StyleSheet.absoluteFillObject}
                        />
                    </View>

                    <View style={styles.centerScrollInner}>
                        {children}
                    </View>

                    {/* Right Side Glow */}
                    <View style={styles.sideGlowRight} pointerEvents="none">
                        <LinearGradient
                            colors={isDark
                                ? ['rgba(165, 198, 255, 0.0)', 'rgba(165, 198, 255, 0.06)', 'rgba(217, 228, 255, 0.12)', 'rgba(165, 198, 255, 0.06)', 'rgba(165, 198, 255, 0.0)']
                                : ['rgba(107, 127, 204, 0.0)', 'rgba(107, 127, 204, 0.04)', 'rgba(107, 127, 204, 0.08)', 'rgba(107, 127, 204, 0.04)', 'rgba(107, 127, 204, 0.0)']
                            }
                            start={{ x: 1, y: 0.3 }}
                            end={{ x: 0, y: 0.7 }}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <LinearGradient
                            colors={isDark
                                ? ['rgba(217, 228, 255, 0.18)', 'transparent']
                                : ['rgba(107, 127, 204, 0.12)', 'transparent']
                            }
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={StyleSheet.absoluteFillObject}
                        />
                    </View>
                </View>

                {/* Subtle right divider line */}
                {isDark && showRightPanel && (
                    <LinearGradient
                        colors={['transparent', 'rgba(217, 228, 255, 0.04)', 'transparent']}
                        style={styles.columnDivider}
                    />
                )}

                {/* Right Panel */}
                {showRightPanel && (
                    <View style={styles.rightColumn}>
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
        overflow: 'visible',
    },
    ambientGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 700,
        opacity: 1,
        zIndex: 0,
    },
    ambientGlowBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 300,
        opacity: 1,
        zIndex: 0,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        paddingTop: 0,
        // The left sidebar is position:fixed at x=0, so this row has to start
        // at x=0 too. Capping it at 1700 and centring it left the reserved
        // left column ~120px to the right of the sidebar actually painted
        // there, which is where the dead band next to the menu came from.
        width: '100%',
        zIndex: 1,
    },
    fullWidthColumn: {
        flex: 1,
        width: '100%',
        maxWidth: 1300,
        alignSelf: 'center',
    },
    leftColumn: {
        width: 260,
        display: 'flex',
        paddingTop: 0,
    },
    centerColumn: {
        flex: 1,
        // 780 wasted roughly 400px of a 1850px screen and chopped every
        // horizontal row — pills, carousels and the live ticker — at its
        // edge. The vertical feed items cap themselves at 700 and centre,
        // so a wider column only benefits the rows that scroll sideways.
        maxWidth: 1200,
        minWidth: 0,
        position: 'relative',
        // @ts-ignore — web-only
        overflowY: 'auto',
        overflow: 'visible',
    },
    centerScrollInner: {
        flex: 1,
        minHeight: '100%',
    },
    sideGlowLeft: {
        position: 'absolute',
        top: 0,
        left: -60,
        width: 60,
        // @ts-ignore
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
    },
    sideGlowRight: {
        position: 'absolute',
        top: 0,
        right: -60,
        width: 60,
        // @ts-ignore
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
    },
    rightColumn: {
        width: 360,
        display: 'flex',
        paddingTop: 32,
        paddingLeft: 32,
        // keeps the panel against the right edge once the centre column
        // stops growing on very wide screens
        marginLeft: 'auto',
    },
    columnDivider: {
        width: 1,
        // @ts-ignore
        height: '100%',
    },
});
