import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ImageSourcePropType, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../Theme/ThemeProvider';
import { TECH_FONT, FONT } from '@design-system/fonts';

const MONO = TECH_FONT;

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
    const isDark = mode === 'dark';
    const accent = theme.colors.primary.DEFAULT;
    const rule = isDark ? 'rgba(218, 230, 247, 0.16)' : 'rgba(7, 8, 12, 0.16)';

    return (
        <View style={[styles.container, containerStyle]}>
            {/* Marker column */}
            <View style={styles.markerCol}>
                <View style={[styles.markerBar, { backgroundColor: accent }]} />
            </View>

            <View style={styles.body}>
                <View style={styles.titleRow}>
                    {index ? (
                        <Text style={[styles.index, { color: accent, fontFamily: FONT.lcd }]}>{index}</Text>
                    ) : null}

                    <Text style={[styles.title, { color: theme.colors.text.primary, fontFamily: FONT.display }]}>
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
        width: 4,
        height: 22,
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
        fontSize: 15,
        letterSpacing: 0.5,
        flexShrink: 0,
    },
    title: {
        fontSize: 24,
        letterSpacing: 0.8,
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
        letterSpacing: 1.6,
    },
    subtitle: {
        fontSize: 10,
        marginTop: 6,
        letterSpacing: 1.4,
    },
});
