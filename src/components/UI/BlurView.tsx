import React from 'react';
import { Platform, View } from 'react-native';
import { BlurView as NativeBlurView, type BlurViewProps } from 'expo-blur';

/**
 * Drop-in for expo-blur's BlurView.
 *
 * On web expo-blur is a CSS `backdrop-filter`, which the browser has to redo
 * on every frame in which anything behind it moves: scrolling, a playing video.
 * It is the most expensive CSS in the app, and the surfaces that use it are
 * already translucent over a calm backdrop, so it buys almost nothing there.
 * Web therefore gets a plain view with a faint veil of the tint; the style the
 * caller passes (usually its own translucent fill) wins over the veil.
 * Native keeps the real blur.
 */
export const BlurView = (props: BlurViewProps) => {
    if (Platform.OS !== 'web') return <NativeBlurView {...props} />;

    const { intensity = 50, tint = 'default', style, children, ...rest } = props;
    const alpha = Math.min(0.3, intensity / 400);
    const veil = tint === 'dark' || tint === 'systemMaterialDark'
        ? `rgba(8, 9, 13, ${alpha})`
        : `rgba(250, 252, 255, ${alpha})`;

    return (
        <View {...(rest as any)} style={[{ backgroundColor: veil }, style]}>
            {children}
        </View>
    );
};
