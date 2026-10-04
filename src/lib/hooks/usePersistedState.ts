import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * useState that survives restarts. Renders with `initial` first, then swaps in the
 * stored value once it has been read (a few ms), so nothing blocks on storage.
 */
export function usePersistedState<T>(key: string, initial: T): [T, (next: T) => void, boolean] {
    const [value, setValue] = useState<T>(initial);
    const [ready, setReady] = useState(false);
    const touched = useRef(false);

    useEffect(() => {
        let alive = true;
        AsyncStorage.getItem(key)
            .then(raw => {
                if (!alive || touched.current || raw == null) return;
                try {
                    setValue(JSON.parse(raw) as T);
                } catch {
                    /* a corrupt value: keep the default */
                }
            })
            .catch(() => { })
            .finally(() => { if (alive) setReady(true); });
        return () => { alive = false; };
    }, [key]);

    const set = useCallback((next: T) => {
        touched.current = true;
        setValue(next);
        AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => { });
    }, [key]);

    return [value, set, ready];
}
