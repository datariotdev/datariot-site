/** @jsxImportSource react */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../Theme/ThemeProvider';
import { OrvelisMark } from '../UI/OrvelisMark';
import { NotificationBellIcon } from '../Notifications/NotificationBell';

export type NavigationDestination =
    | 'feed'
    | 'discover'
    | 'create'
    | 'ai'
    | 'inbox'
    | 'profile'
    | 'notifications'
    | 'settings'
    | 'saved'
    | 'business'
    | 'sun'
    | 'moon';

export const LOGO_ICE_COLOR = '#D9E4FF';
export const LOGO_ICE_GLOW = '#BDEBFF';
export const LOGO_OBSIDIAN = '#07090C';

export function AppNavigationIcon({
    name,
    selected = false,
    color,
    size = 24,
}: {
    name: NavigationDestination;
    selected?: boolean;
    color?: string;
    size?: number;
}) {
    const { theme, mode } = useTheme();
    const ink = color || (selected ? theme.colors.primary.DEFAULT : theme.colors.text.secondary);

    switch (name) {
        case 'feed':
            return (
                <MaterialCommunityIcons
                    name={selected ? 'home-variant' : 'home-variant-outline'}
                    size={size}
                    color={ink}
                />
            );
        case 'discover':
            return (
                <Ionicons
                    name={selected ? 'navigate-circle' : 'navigate-circle-outline'}
                    size={size}
                    color={ink}
                />
            );
        case 'ai':
            return <OrvelisMark size={size} color={ink} coreColor={mode === 'dark' ? '#A5CBF7' : '#487BAE'} />;
        case 'inbox':
            return (
                <Ionicons
                    name={selected ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
                    size={size}
                    color={ink}
                />
            );
        case 'profile':
            return <Feather name="user" size={size} color={ink} />;
        case 'notifications':
            return <NotificationBellIcon color={ink} size={size} />;
        case 'saved':
            return (
                <MaterialCommunityIcons
                    name={selected ? 'bookmark' : 'bookmark-outline'}
                    size={size}
                    color={ink}
                />
            );
        case 'business':
            return <Feather name="trending-up" size={size} color={ink} />;
        case 'settings':
            return <Ionicons name="options-outline" size={size} color={ink} />;
        case 'sun':
            return <Feather name="sun" size={size} color={ink} />;
        case 'moon':
            return <Feather name="moon" size={size} color={ink} />;
        case 'create': {
            const isDark = mode === 'dark';
            return (
                <View style={[s.create, {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: isDark ? '#E1E8F5' : '#111318',
                }]}>
                    <Feather name="plus" size={Math.round(size * 0.525)} color={isDark ? '#293548' : '#F7F9FC'} />
                </View>
            );
        }
    }
}

const s = StyleSheet.create({
    create: {
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#111318',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
});
