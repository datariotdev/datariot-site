/**
 * Datariot Theme — the logo's two colours.
 *
 * The logo is ice (#DAE6F7) on black (#07080C) and nothing else, and
 * info.datariot.xyz is built the same way: on a dark surface the accent is the
 * ice, on a light one it is the black. This file holds the DARK palette (the
 * app's default); ThemeProvider holds the light one, from the same two colours.
 *
 * Status colours — live, like, error, up/down — are the only hues outside the
 * logo, kept because they carry meaning rather than decoration.
 */
import { FONT } from './fonts';

/** The logo's two colours, for surfaces that do not follow the theme (video scrims, always-dark screens). */
export const ICE = '#DAE6F7';
export const INK = '#07080C';

export const colors = {
    // Primary — the logo's ice
    primary: {
        DEFAULT: '#DAE6F7',
        light: '#EEF2FA',
        dark: '#B7C2D6',
        ultra: '#FFFFFF',
        brand: '#DAE6F7',
        onPrimary: '#07080C',
        glow: 'rgba(218, 230, 247, 0.22)',
        glowStrong: 'rgba(218, 230, 247, 0.40)',
        glowSubtle: 'rgba(218, 230, 247, 0.08)',
    },

    // Secondary — the dim and faint steps between the two logo colours
    secondary: {
        DEFAULT: '#9AA7BD',
        dark: '#5F6B82',
        light: '#EEF2FA',
        onSecondary: '#07080C',
        glow: 'rgba(154, 167, 189, 0.20)',
    },

    // Backgrounds — the logo's black, in layers
    background: {
        primary: '#08090D',
        DEFAULT: '#08090D',
        paper: '#0C0D12',
        secondary: '#0E1017',
        tertiary: '#13151D',
        web: '#08090D',
        webSecondary: '#0C0D12',
    },

    // Surfaces
    surface: {
        DEFAULT: '#0E1017',
        light: '#13151D',
        elevated: '#181B25',
        overlay: 'rgba(7, 8, 12, 0.88)',
        card: '#0F1118',
        glass: 'rgba(218, 230, 247, 0.04)',
        glassHover: 'rgba(218, 230, 247, 0.08)',
        border: 'rgba(218, 230, 247, 0.10)',
        borderHover: 'rgba(218, 230, 247, 0.22)',
        borderActive: 'rgba(218, 230, 247, 0.42)',
    },

    // Text
    text: {
        primary: '#EEF2FA',
        secondary: '#9AA7BD',
        muted: '#5F6B82',
        accent: '#DAE6F7',
    },

    // Status — meaning, not decoration
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',

    // Special
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
} as const;

export const gradients = {
    primary: ['#DAE6F7', '#B7C2D6', '#9AA7BD'] as const,
    primarySoft: ['rgba(218, 230, 247, 0.20)', 'rgba(218, 230, 247, 0.02)'] as const,
    ambient: ['rgba(218, 230, 247, 0.08)', 'rgba(218, 230, 247, 0.01)', 'transparent'] as const,
    surface: ['rgba(218, 230, 247, 0.06)', 'rgba(218, 230, 247, 0.01)'] as const,
    surfaceHover: ['rgba(218, 230, 247, 0.10)', 'rgba(218, 230, 247, 0.03)'] as const,
    aurora: ['#DAE6F7', '#EEF2FA', '#FFFFFF'] as const,
    auroraAmbient: ['rgba(218, 230, 247, 0.12)', 'rgba(218, 230, 247, 0.05)', 'transparent'] as const,
    cardShine: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.00)'] as const,
    darkFade: ['rgba(8, 9, 13, 0)', 'rgba(8, 9, 13, 0.8)', '#08090D'] as const,
} as const;

export const typography = {
    // Same keys the app has always used; the faces behind them are now
    // Manrope for text, with the info site's other three voices added.
    fontFamilies: {
        light: FONT.sansLight,
        regular: FONT.sans,
        medium: FONT.sansMedium,
        semibold: FONT.sansSemibold,
        bold: FONT.sansBold,
        extrabold: FONT.sansExtrabold,
        black: FONT.sansExtrabold,
        tech: FONT.tech,
        brand: FONT.techBold,
        mono: FONT.techMedium,
        display: FONT.display,
        lcd: FONT.lcd,
    },

    sizes: {
        xs: 11,
        sm: 13,
        base: 15,
        lg: 17,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
    },

    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
} as const;

export const borderRadius = {
    none: 0,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12,
    '2xl': 14,
    '3xl': 18,
    full: 9999,
} as const;

export const shadows = {
    sm: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
    },
    glow: {
        shadowColor: '#DAE6F7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    glowSubtle: {
        shadowColor: '#DAE6F7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
} as const;

export const animation = {
    duration: {
        fast: 120,
        normal: 220,
        slow: 350,
        dramatic: 500,
    },
    easing: {
        default: 'ease-in-out',
        elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
} as const;

export const theme = {
    colors,
    gradients,
    typography,
    spacing,
    borderRadius,
    shadows,
    animation,
} as const;

export type Theme = typeof theme;
