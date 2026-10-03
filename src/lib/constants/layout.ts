import { Platform } from 'react-native';

/**
 * Height of the bottom tab bar on phones. The bar floats over the scene
 * (position: absolute) so the home feed can run edge to edge; every screen that
 * has something to tap or read at its bottom edge pads by this much.
 */
export const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 64;
