import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface HudBackdropProps {
    isDark: boolean;
}

/**
 * The surface behind the app — info.datariot.xyz's "page-fx", one continuous
 * tone with the logo's ice laid over it as light: a few soft glows, two aurora
 * ribbons down the edges of the viewport, and a grain tile so the surface is
 * not a plastic sheet. No lines, no cells, no bands.
 *
 * It is deliberately still. The ribbons used to sway and the grain used a
 * blend mode; both force the browser to re-composite the whole page behind
 * everything every frame, and halved the frame rate on machines without a
 * strong GPU. A static backdrop is painted once.
 *
 * Web only gets the full treatment (raw divs, so we can use layered radial
 * gradients); native falls back to a gradient wash.
 */

const ICE = '218, 230, 247';

const GRAIN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E" +
    "%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E" +
    "%3CfeColorMatrix type='saturate' values='0'/%3E" +
    "%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

export const HudBackdrop = ({ isDark }: HudBackdropProps) => {
    if (Platform.OS !== 'web') {
        return (
            <LinearGradient
                colors={isDark
                    ? [`rgba(${ICE}, 0.10)`, `rgba(${ICE}, 0.02)`, 'transparent']
                    : [`rgba(${ICE}, 0.85)`, `rgba(${ICE}, 0.35)`, 'transparent']}
                style={styles.nativeWash}
                pointerEvents="none"
            />
        );
    }

    // Brightness of the ice laid over the surface: strong on the pale page, a
    // whisper on the black one.
    const a = isDark
        ? { hi: 0.17, mid: 0.13, lo: 0.10, ribbonA: 0.16, ribbonB: 0.06 }
        : { hi: 0.70, mid: 0.50, lo: 0.40, ribbonA: 0.77, ribbonB: 0.32 };

    const glow = [
        `radial-gradient(1100px 620px at 88% 2%, rgba(${ICE}, ${a.hi}), transparent 58%)`,
        `radial-gradient(900px 560px at -6% 22%, rgba(${ICE}, ${a.mid}), transparent 60%)`,
        `radial-gradient(1000px 600px at 80% 58%, rgba(${ICE}, ${a.mid}), transparent 60%)`,
        `radial-gradient(900px 540px at 12% 96%, rgba(${ICE}, ${a.lo}), transparent 60%)`,
        isDark
            ? 'linear-gradient(180deg, #0A0C12 0%, #080B12 35%, #0B0E16 65%, #0A0D14 100%)'
            : 'linear-gradient(180deg, #FAFCFF 0%, #EAF1FB 38%, #F4F8FD 68%, #E9F0FB 100%)',
    ].join(',');

    const ribbon = (side: 'l' | 'r') => ({
        position: 'absolute' as const,
        top: side === 'l' ? '-16vh' : '-8vh',
        [side === 'l' ? 'left' : 'right']: '-20vw',
        width: '46vw',
        height: '132vh',
        borderRadius: '50%',
        background: `radial-gradient(closest-side, rgba(${ICE}, ${side === 'l' ? a.ribbonA : a.ribbonA * 0.9}), rgba(${ICE}, ${a.ribbonB}) 52%, transparent)`,
    });

    return (
        <View style={styles.root} pointerEvents="none">
            {/* surface + glows */}
            {/* @ts-ignore web-only element */}
            <div style={{ position: 'absolute', inset: 0, background: glow }} />

            {/* aurora ribbons */}
            {/* @ts-ignore web-only element */}
            <div style={ribbon('l')} />
            {/* @ts-ignore web-only element */}
            <div style={ribbon('r')} />

            {/* grain */}
            {/* @ts-ignore web-only element */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: GRAIN,
                    backgroundSize: '160px 160px',
                    opacity: isDark ? 0.045 : 0.035,
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: 'hidden',
    },
    nativeWash: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 700,
        zIndex: 0,
    },
});
