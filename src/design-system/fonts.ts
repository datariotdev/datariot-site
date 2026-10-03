/**
 * Datariot type system — the same four voices info.datariot.xyz speaks in.
 *
 *   display  Pixelify Sans   headings, titles, the wordmark. Regular weight:
 *                            it is drawn on a pixel grid and gets muddy bold.
 *   tech     JetBrains Mono  bracket labels, chips, readouts, anything HUD.
 *   lcd      Doto            dot-matrix counters and timecodes only.
 *   sans     Manrope         interface and body copy.
 *
 * Every face is its own family name (that is how expo-font registers them), so
 * weight is chosen by picking the face — not with `fontWeight`. GlobalWebStyles
 * switches off font-synthesis so a stray `fontWeight: '700'` next to one of
 * these cannot fake-bold a face on top of itself.
 *
 * Pixelify draws 5 as S and 0 as O, so numerals stay out of `display`:
 * figures belong in `tech` or `lcd`.
 */
export const FONT = {
    display: 'PixelifySans_400Regular',
    displayMedium: 'PixelifySans_500Medium',
    displayBold: 'PixelifySans_700Bold',

    tech: 'JetBrainsMono_600SemiBold',
    techRegular: 'JetBrainsMono_400Regular',
    techMedium: 'JetBrainsMono_500Medium',
    techBold: 'JetBrainsMono_700Bold',

    lcd: 'Doto_700Bold',
    lcdBlack: 'Doto_900Black',
    lcdRegular: 'Doto_400Regular',

    sansLight: 'Manrope_300Light',
    sans: 'Manrope_400Regular',
    sansMedium: 'Manrope_500Medium',
    sansSemibold: 'Manrope_600SemiBold',
    sansBold: 'Manrope_700Bold',
    sansExtrabold: 'Manrope_800ExtraBold',
} as const;


export const TECH_FONT = FONT.tech;
