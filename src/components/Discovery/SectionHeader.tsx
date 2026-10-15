import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ImageSourcePropType, Platform, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../Theme/ThemeProvider';
import { usePalette } from '../../design-system/palette';
import { SectionRule } from '../UI/SectionRule';

const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    onPressShowAll?: () => void;
    rightImage?: ImageSourcePropType;
    containerStyle?: any;
    /** Ordinal printed in the left gutter, e.g. "02" */
    index?: string;
    /** Right-hand telemetry readout, e.g. "24 SIGNALS" */
    meta?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    subtitle,
    onPressShowAll,
    rightImage,
    containerStyle,
    index,
    meta,
}) => {
    const { theme, mode } = useTheme();
    const p = usePalette();
    const { width } = useWindowDimensions();
    const isDark = mode === 'dark';
    const accent = theme.colors.primary.DEFAULT;
    const rule = isDark ? 'rgba(217, 228, 255, 0.14)' : 'rgba(0, 0, 0, 0.10)';

    // On the phone: a numbered dotted rule, then the title in plain type
    if (Platform.OS !== 'web' || width <= 768) {
        return (
            <View style={[styles.pContainer, containerStyle]}>
                {index || meta ? <SectionRule label={index || ''} right={meta ? meta.toLowerCase() : undefined} /> : null}
                <View style={styles.pTitleRow}>
                    <Text style={[styles.pTitle, { color: p.text, fontFamily: p.fonts.bold }]}>{title}</Text>
                    {rightImage && !onPressShowAll ? <Image source={rightImage} style={styles.farRightImage} resizeMode="contain" /> : null}
                    {onPressShowAll ? (
                        <Pressable onPress={onPressShowAll} style={styles.showAllButton} hitSlop={8}>
                            <Text style={[styles.pAll, { color: p.accent }]}>See all</Text>
                            <Feather name="arrow-up-right" size={14} color={p.accent} />
                        </Pressable>
                    ) : null}
                </View>
                {subtitle ? <Text style={[styles.pSub, { color: p.sub, fontFamily: p.fonts.regular }]}>{subtitle}</Text> : null}
            </View>
        );
    }

    return (
        <View style={[styles.container, containerStyle]}>
            {/* Marker column */}
            <View style={styles.markerCol}>
                <View style={[styles.markerBar, { backgroundColor: accent }]} />
            </View>

            <View style={styles.body}>
                <View style={styles.titleRow}>
                    {index ? (
                        <Text style={[styles.index, { color: accent, fontFamily: MONO }]}>{index}</Text>
                    ) : null}

                    <Text style={[styles.title, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.bold }]}>
                        {title.toUpperCase()}
                    </Text>

                    {/* Hairline that runs out to the edge — reads as an instrument scale */}
                    <View style={[styles.rule, { backgroundColor: rule }]} />

                    {meta ? (
                        <Text style={[styles.meta, { color: theme.colors.text.muted, fontFamily: MONO }]}>{meta}</Text>
                    ) : null}

                    {rightImage && !onPressShowAll && (
                        <Image source={rightImage} style={styles.farRightImage} resizeMode="contain" />
                    )}

                    {onPressShowAll && (
                        <Pressable onPress={onPressShowAll} style={styles.showAllButton}>
                            <Text style={[styles.showAllText, { color: accent, fontFamily: MONO }]}>ALL</Text>
                            <Feather name="arrow-up-right" size={13} color={accent} />
                        </Pressable>
                    )}
                </View>

                {subtitle ? (
                    <Text style={[styles.subtitle, { color: theme.colors.text.muted, fontFamily: MONO }]}>
                        {subtitle.toUpperCase()}
                    </Text>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    pContainer: { paddingHorizontal: 20, paddingTop: 34, paddingBottom: 14 },
    pTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    pTitle: { fontSize: 28, letterSpacing: -0.6 },
    pAll: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
    pSub: { fontSize: 14, marginTop: 3 },
    container: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 36,
        paddingBottom: 16,
        gap: 12,
    },
    markerCol: {
        paddingTop: 4,
    },
    markerBar: {
        width: 3,
        height: 20,
        borderRadius: 2,
    },
    body: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    index: {
        fontSize: 11,
        letterSpacing: 1.5,
        opacity: 0.9,
        flexShrink: 0,
    },
    title: {
        fontSize: 19,
        letterSpacing: 1.2,
        flexShrink: 0,
    },
    rule: {
        flex: 1,
        minWidth: 12,
        height: 1,
        marginHorizontal: 2,
    },
    meta: {
        fontSize: 9.5,
        letterSpacing: 1.4,
        flexShrink: 0,
    },
    farRightImage: {
        width: 26,
        height: 26,
        borderRadius: 13,
    },
    showAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    showAllText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.6,
    },
    subtitle: {
        fontSize: 10,
        marginTop: 6,
        letterSpacing: 1.4,
    },
});
