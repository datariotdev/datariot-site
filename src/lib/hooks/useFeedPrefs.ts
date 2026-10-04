import { useState } from 'react';
import { Platform } from 'react-native';
import { usePersistedState } from './usePersistedState';

/**
 * How the video feed behaves, shared by the feed and Settings.
 *
 * Sound: on by default on a phone (people talk in these clips), and remembered
 * once changed. In a browser it always starts muted, whatever was saved: browsers
 * refuse to autoplay video that has sound until the page has been tapped, and a
 * feed that cannot start is worse than a silent one.
 */
export function useFeedPrefs() {
    const [storedSound, setStoredSound] = usePersistedState<boolean>('@datariot_pref_sound', true);
    const [webSound, setWebSound] = useState(false);
    const [autoplay, setAutoplay] = usePersistedState<boolean>('@datariot_pref_autoplay', true);

    const isWeb = Platform.OS === 'web';
    const soundOn = isWeb ? webSound : storedSound;
    const setSoundOn = isWeb ? setWebSound : setStoredSound;

    return { soundOn, setSoundOn, muted: !soundOn, autoplay, setAutoplay };
}
