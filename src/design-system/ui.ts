/**
 * The app's everyday look: quiet, one typeface, one accent.
 *
 * The older screens were built from a HUD vocabulary (Courier labels in
 * [ brackets ], cyan outlines, notched chips, glows). It read as a costume, and
 * it made every screen louder than the video it was meant to frame. This is
 * the replacement: Inter in three weights, sentence case, hairline borders,
 * surfaces that step up in lightness instead of in outline, and the logo's ice
 * as the only colour that means "this is the thing to press".
 *
 * Use through useUI() so light and dark both come out right.
 */
import { useTheme } from '../components/Theme/ThemeProvider';

/** The logo's two colours. */
export const ICE = '#DAE6F7';
export const INK = '#07080C';

export const FONT = {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
} as const;

/** Type scale. Weights come from the family name, not fontWeight (iOS fakes bold on custom fonts). */
export const type = {
    display: { fontFamily: FONT.semibold, fontSize: 30, lineHeight: 36, letterSpacing: -0.7 },
    title: { fontFamily: FONT.semibold, fontSize: 22, lineHeight: 28, letterSpacing: -0.45 },
    headline: { fontFamily: FONT.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.25 },
    body: { fontFamily: FONT.regular, fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
    bodyStrong: { fontFamily: FONT.medium, fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
    callout: { fontFamily: FONT.medium, fontSize: 14, lineHeight: 19, letterSpacing: -0.05 },
    caption: { fontFamily: FONT.medium, fontSize: 12, lineHeight: 16 },
    micro: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.1 },
} as const;

export type TypeVariant = keyof typeof type;

export const RADIUS = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;
export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export interface UIPalette {
    /** screen background */
    bg: string;
    /** cards, inputs, rows */
    surface: string;
    /** raised or pressed surfaces, sheets */
    surfaceHigh: string;
    hairline: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    /** the one colour that means "press this" */
    accent: string;
    onAccent: string;
    like: string;
    danger: string;
    success: string;
    /** glass chips and buttons sitting on top of video */
    glass: string;
    glassStrong: string;
}

const dark: UIPalette = {
    bg: '#08090D',
    surface: '#101217',
    surfaceHigh: '#181B22',
    hairline: 'rgba(255, 255, 255, 0.08)',
    text: '#F3F4F7',
    textSecondary: 'rgba(243, 244, 247, 0.62)',
    textTertiary: 'rgba(243, 244, 247, 0.38)',
    accent: ICE,
    onAccent: INK,
    like: '#FF4D6A',
    danger: '#FF6B6B',
    success: '#34D399',
    glass: 'rgba(20, 22, 28, 0.55)',
    glassStrong: 'rgba(20, 22, 28, 0.78)',
};

const light: UIPalette = {
    bg: '#F6F7F9',
    surface: '#FFFFFF',
    surfaceHigh: '#ECEEF2',
    hairline: 'rgba(7, 8, 12, 0.08)',
    text: '#0B0C10',
    textSecondary: 'rgba(11, 12, 16, 0.62)',
    textTertiary: 'rgba(11, 12, 16, 0.40)',
    accent: INK,
    onAccent: '#FFFFFF',
    like: '#E5304F',
    danger: '#D93636',
    success: '#13946B',
    glass: 'rgba(255, 255, 255, 0.7)',
    glassStrong: 'rgba(255, 255, 255, 0.88)',
};

export const palette = (isDark: boolean): UIPalette => (isDark ? dark : light);

/** White-on-video colours: video is dark in either theme. */
export const ON_VIDEO = {
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.78)',
    textTertiary: 'rgba(255, 255, 255, 0.55)',
    glass: 'rgba(0, 0, 0, 0.32)',
    glassStrong: 'rgba(0, 0, 0, 0.5)',
    track: 'rgba(255, 255, 255, 0.25)',
};

export function useUI() {
    const { mode } = useTheme();
    const isDark = mode === 'dark';
    return { c: palette(isDark), isDark, mode };
}
