import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme as baseTheme, Theme } from '../../design-system/theme';

export type ThemeMode = 'light' | 'dark';

// Define the shape of our context
interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
    setThemeMode: (mode: ThemeMode) => void;
    // We provide the full theme object, but with colors swapped based on mode
    theme: Theme;
}

const THEME_STORAGE_KEY = '@orvelis_theme_mode';

// Default values for context creation
const defaultContext: ThemeContextType = {
    mode: 'light', // Opens light, like info.datariot.xyz; dark is a saved toggle
    toggleTheme: () => { },
    setThemeMode: () => { },
    theme: baseTheme,
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

// --- Theme Palettes ---
// baseTheme.colors is the dark palette; lightColors below is its mirror image.

const darkColors = { ...baseTheme.colors };

// Light is the same two logo colours turned over: ink (#07080C) is the accent
// and ice (#DAE6F7) is the tint, exactly as on info.datariot.xyz.
const lightColors = {
    ...baseTheme.colors,
    primary: {
        DEFAULT: '#07080C',
        light: '#3A4252',
        dark: '#000000',
        ultra: '#DAE6F7',
        brand: '#07080C',
        onPrimary: '#FFFFFF',
        glow: 'rgba(7, 8, 12, 0.12)',
        glowStrong: 'rgba(7, 8, 12, 0.22)',
        glowSubtle: 'rgba(7, 8, 12, 0.05)',
    },
    secondary: {
        DEFAULT: '#3A4252',
        dark: '#07080C',
        light: '#DAE6F7',
        onSecondary: '#FFFFFF',
        glow: 'rgba(58, 66, 82, 0.14)',
    },
    background: {
        primary: '#F1F5FC',
        DEFAULT: '#F1F5FC',
        secondary: '#EAF0FA',
        tertiary: '#DFE8F6',
        web: '#F1F5FC',
        webSecondary: '#FFFFFF',
        paper: '#FFFFFF',
    },
    surface: {
        ...baseTheme.colors.surface,
        DEFAULT: '#FFFFFF',
        light: '#F6F9FE',
        elevated: '#FFFFFF',
        overlay: 'rgba(241, 245, 252, 0.95)',
        card: '#FFFFFF',
        glass: 'rgba(255, 255, 255, 0.72)',
        glassHover: 'rgba(255, 255, 255, 0.90)',
        border: 'rgba(7, 8, 12, 0.10)',
        borderHover: 'rgba(7, 8, 12, 0.22)',
        borderActive: 'rgba(7, 8, 12, 0.55)',
    },
    text: {
        primary: '#191A1E',
        secondary: '#475569',
        muted: '#7C8AA0',
        accent: '#07080C',
    },
};


interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [mode, setModeState] = useState<ThemeMode>('light');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Load saved theme from storage on mount
        const loadTheme = async () => {
            try {
                const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedMode === 'light' || savedMode === 'dark') {
                    setModeState(savedMode as ThemeMode);
                }
            } catch (error) {
                console.error('Failed to load theme preference:', error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadTheme();
    }, []);

    const setThemeMode = async (newMode: ThemeMode) => {
        setModeState(newMode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    const toggleTheme = () => {
        setThemeMode(mode === 'dark' ? 'light' : 'dark');
    };

    // Construct the active theme object
    const activeTheme: Theme = {
        ...baseTheme,
        colors: (mode === 'dark' ? darkColors : lightColors) as typeof baseTheme.colors,
    };

    if (!isLoaded) {
        // You could return null or a splash screen here while loading the preference
        return null;
    }

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme, setThemeMode, theme: activeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
