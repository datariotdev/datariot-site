import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_BASE } from '../constants/layout';

/**
 * Total height of the floating tab bar: the icon row plus the home-indicator
 * inset. It floats over every screen (so the home feed can run edge to edge),
 * which means anything tappable or readable at a screen's bottom edge pads by
 * this. On a phone without a home indicator it is just the 52pt icon row.
 */
export function useTabBarHeight() {
    const insets = useSafeAreaInsets();
    const bottom = Platform.OS === 'web' ? 0 : insets.bottom;
    return TAB_BAR_BASE + bottom;
}
