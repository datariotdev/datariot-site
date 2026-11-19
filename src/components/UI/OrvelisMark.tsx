import React from 'react';
import { Platform, View, StyleProp, ViewStyle } from 'react-native';

type Props = { size?: number; color?: string; style?: StyleProp<ViewStyle> };

/** Orvelis' orbital O. It inherits the caller's existing icon color. */
export function OrvelisMark({ size = 24, color = '#D9E4FF', style }: Props) {
    const stroke = Math.max(1, size * 1.65 / 24);
    return (
        <View accessible={false} style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }, style]}>
            {Platform.OS === 'web' ? React.createElement('svg', {
                width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
                stroke: color, strokeWidth: 1.65, strokeLinecap: 'round',
                strokeLinejoin: 'round', 'aria-hidden': true, focusable: false,
            },
                React.createElement('path', { d: 'M16.5 5.4a8 8 0 1 0 3.2 8.8' }),
                React.createElement('ellipse', { cx: 12, cy: 12, rx: 10, ry: 3.8, transform: 'rotate(-42 12 12)' }),
                React.createElement('circle', { cx: 19.5, cy: 6.5, r: 1.8, fill: color, stroke: 'none' }),
            ) : (
                <>
                    <View style={{ position: 'absolute', width: size * 2 / 3, height: size * 2 / 3, borderRadius: size, borderWidth: stroke, borderColor: color }} />
                    <View style={{ position: 'absolute', width: size * 5 / 6, height: size * 7.6 / 24, borderRadius: size, borderWidth: stroke, borderColor: color, transform: [{ rotate: '-42deg' }] }} />
                    <View style={{ position: 'absolute', width: size * .15, height: size * .15, borderRadius: size, backgroundColor: color, left: size * .7375, top: size * .1958 }} />
                </>
            )}
        </View>
    );
}
