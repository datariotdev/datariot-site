import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePalette } from '../../design-system/palette';
import { SectionRule } from '../UI/SectionRule';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    onPressShowAll?: () => void;
    rightImage?: ImageSourcePropType;
    containerStyle?: StyleProp<ViewStyle>;
    index?: string;
    meta?: string;
}

export const SectionHeader = ({ title, subtitle, onPressShowAll, rightImage, containerStyle, index, meta }: SectionHeaderProps) => {
    const p = usePalette();
    return (
        <View style={[styles.container, containerStyle]}>
            {index || meta ? <SectionRule label={index || ''} right={meta?.toLowerCase()} /> : null}
            <View style={styles.titleRow}>
                <Text style={[styles.title, { color: p.text, fontFamily: p.fonts.bold }]}>{title}</Text>
                {rightImage && !onPressShowAll ? <Image source={rightImage} style={styles.image} resizeMode="contain" /> : null}
                {onPressShowAll ? (
                    <Pressable accessibilityRole="button" accessibilityLabel={`See all ${title}`} onPress={onPressShowAll} style={styles.showAll} hitSlop={8}>
                        <Text style={[styles.allText, { color: p.accent }]}>See all</Text>
                        <Feather name="arrow-up-right" size={14} color={p.accent} />
                    </Pressable>
                ) : null}
            </View>
            {subtitle ? <Text style={[styles.subtitle, { color: p.sub, fontFamily: p.fonts.regular }]}>{subtitle}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, paddingTop: 34, paddingBottom: 14 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 12 },
    title: { fontSize: 28, letterSpacing: -0.6, flexShrink: 1 },
    subtitle: { fontSize: 14, marginTop: 3 },
    image: { width: 26, height: 26, borderRadius: 13 },
    showAll: { flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 36 },
    allText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
});
