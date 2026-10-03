import { Platform } from 'react-native';

/**
 * Page-level backgrounds are transparent on web so the aurora in HudBackdrop
 * runs under every screen as a single continuous tone, like the page on
 * info.datariot.xyz. A solid page background on any one screen paints a
 * flat slab over it and brings the seams back.
 *
 * On native the navigator's own scene colour is already themed, so the value
 * passes straight through.
 */
export const pageBg = (solid: string): string => (Platform.OS === 'web' ? 'transparent' : solid);
