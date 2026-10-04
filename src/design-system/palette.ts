import { useTheme } from '../components/Theme/ThemeProvider';

/**
 * Colours for the newer screens, taken from the website: black or the logo's ice
 * as the ground, the logo's ice (dark) or ink (light) as the one accent.
 */
export function usePalette() {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    return {
        isDark,
        fonts: theme.typography.fontFamilies,
        bg: theme.colors.background.primary as string,
        card: isDark ? '#0E1017' : '#FFFFFF',
        cardHigh: isDark ? '#171A23' : '#EEF3FC',
        border: isDark ? 'rgba(217, 228, 255, 0.09)' : 'rgba(7, 8, 12, 0.07)',
        text: isDark ? '#F1F2F5' : '#07080C',
        sub: isDark ? 'rgba(241, 242, 245, 0.62)' : 'rgba(7, 8, 12, 0.62)',
        faint: isDark ? 'rgba(241, 242, 245, 0.38)' : 'rgba(7, 8, 12, 0.42)',
        accent: isDark ? '#D9E4FF' : '#07080C',
        onAccent: isDark ? '#07080C' : '#DAE6F7',
        soft: isDark ? 'rgba(217, 228, 255, 0.10)' : 'rgba(7, 8, 12, 0.06)',
        danger: '#F0616D',
    };
}
