import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface NavVisibilityContextType {
    isNavVisible: boolean;
    setIsNavVisible: (visible: boolean) => void;
    handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const NavVisibilityContext = createContext<NavVisibilityContextType>({
    isNavVisible: true,
    setIsNavVisible: () => {},
    handleScroll: () => {},
});

export const NavVisibilityProvider = ({ children }: { children: React.ReactNode }) => {
    const [isNavVisible, setIsNavVisible] = useState(true);
    const lastY = useRef(0);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = event.nativeEvent.contentOffset.y;
        const diff = y - lastY.current;

        // At the top, always show bars
        if (y <= 30) {
            setIsNavVisible(true);
        } else if (diff > 8 && y > 60) {
            // Scrolling down -> hide bars
            setIsNavVisible(false);
        } else if (diff < -12) {
            // Scrolling up -> reveal bars
            setIsNavVisible(true);
        }
        lastY.current = y;
    }, []);

    return (
        <NavVisibilityContext.Provider value={{ isNavVisible, setIsNavVisible, handleScroll }}>
            {children}
        </NavVisibilityContext.Provider>
    );
};

export const useNavVisibility = () => useContext(NavVisibilityContext);

