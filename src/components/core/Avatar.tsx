import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { FONT, useUI } from '../../design-system/ui';

interface AvatarProps {
    uri?: string | null;
    name?: string;
    size?: number;
    ring?: string;
    style?: ViewStyle;
}

/** A round photo, or the first letter on a quiet disc when there is no photo (or it fails). */
export function Avatar({ uri, name = '', size = 40, ring, style }: AvatarProps) {
    const { c } = useUI();
    const [failed, setFailed] = useState(false);
    const showImage = !!uri && !failed;
    const letter = (name.trim()[0] || '?').toUpperCase();

    return (
        <View
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: c.surfaceHigh,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                },
                ring ? { borderWidth: 1.5, borderColor: ring } : null,
                style,
            ]}
        >
            {showImage ? (
                <Image
                    source={{ uri: uri as string }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                    onError={() => setFailed(true)}
                />
            ) : (
                <Text style={{ fontFamily: FONT.semibold, fontSize: size * 0.4, color: c.textSecondary }}>{letter}</Text>
            )}
        </View>
    );
}
