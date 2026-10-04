import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePalette } from '../../design-system/palette';

interface AvatarProps {
    uri?: string | null;
    name?: string;
    size?: number;
}

/** A round photo, or the first letter on a soft brand tile when there is none (or it fails to load). */
export function Avatar({ uri, name = '', size = 48 }: AvatarProps) {
    const p = usePalette();
    const [failed, setFailed] = useState(false);
    const letter = (name.trim()[0] || '?').toUpperCase();

    return (
        <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
            {uri && !failed ? (
                <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFailed(true)} />
            ) : (
                <LinearGradient
                    colors={p.isDark ? ['#2B3350', '#161A2A'] : ['#FFFFFF', '#BFD1EE']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
                >
                    <Text style={{ fontFamily: p.fonts.bold, fontSize: size * 0.4, color: p.isDark ? '#D9E4FF' : '#1E2A55' }}>{letter}</Text>
                </LinearGradient>
            )}
        </View>
    );
}
