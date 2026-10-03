import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../Theme/ThemeProvider';

/**
 * Injects the web-only keyframes / global chrome the HUD design language needs.
 * Runs once per document — safe to mount from multiple places.
 */
const STYLE_ID = 'datariot-hud-globals';

const CSS = `
@keyframes status-pulse-anim {
    0%   { transform: scale(1);   opacity: 0.55; }
    70%  { transform: scale(2.6); opacity: 0;    }
    100% { transform: scale(2.6); opacity: 0;    }
}
.status-pulse-anim { animation: status-pulse-anim 2s cubic-bezier(0.22, 1, 0.36, 1) infinite; }

/* --- Live ticker marquee ---------------------------------------------- */
@keyframes dr-ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}
.dr-ticker { animation: dr-ticker 34s linear infinite; }
.dr-ticker:hover { animation-play-state: paused; }

/* --- Readout flicker (status text) ------------------------------------ */
@keyframes dr-flicker {
    0%, 92%, 100% { opacity: 1; }
    94%           { opacity: 0.45; }
    96%           { opacity: 1; }
    98%           { opacity: 0.7; }
}
.dr-flicker { animation: dr-flicker 6s steps(1, end) infinite; }

/* --- Shine sweep across a card on hover -------------------------------- */
@keyframes dr-sweep {
    0%   { transform: translateX(-120%) skewX(-18deg); }
    100% { transform: translateX(320%)  skewX(-18deg); }
}
.dr-sweep { animation: dr-sweep 0.9s cubic-bezier(0.22, 1, 0.36, 1); }

/* --- Global chrome ----------------------------------------------------- */
/* Each type face is its own family (that is how expo-font registers them), so
   weight is picked by face. Without this a stray fontWeight: '700' next to a
   Regular face makes the browser fake-bold it on top of itself. */
html, body, #root { font-synthesis: none; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

[data-theme="dark"]  ::selection { background: #DAE6F7; color: #07080C; }
[data-theme="light"] ::selection { background: #07080C; color: #DAE6F7; }

:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }

*::-webkit-scrollbar { width: 9px; height: 9px; }
*::-webkit-scrollbar-track { background: transparent; }
[data-theme="dark"] *::-webkit-scrollbar-thumb {
    background: rgba(218, 230, 247, 0.16);
    border-left: 1px solid rgba(218, 230, 247, 0.24);
}
[data-theme="dark"] *::-webkit-scrollbar-thumb:hover { background: rgba(218, 230, 247, 0.30); }
[data-theme="light"] *::-webkit-scrollbar-thumb {
    background: rgba(7, 8, 12, 0.16);
    border-left: 1px solid rgba(7, 8, 12, 0.26);
}
[data-theme="light"] *::-webkit-scrollbar-thumb:hover { background: rgba(7, 8, 12, 0.32); }

@media (prefers-reduced-motion: reduce) {
    .dr-ticker, .dr-flicker, .status-pulse-anim {
        animation: none !important;
    }
}
`;

export const GlobalWebStyles = () => {
    const { mode } = useTheme();

    useEffect(() => {
        if (Platform.OS !== 'web' || typeof document === 'undefined') return;
        document.documentElement.setAttribute('data-theme', mode);
    }, [mode]);

    useEffect(() => {
        if (Platform.OS !== 'web') return;
        if (typeof document === 'undefined') return;
        if (document.getElementById(STYLE_ID)) return;

        const el = document.createElement('style');
        el.id = STYLE_ID;
        el.textContent = CSS;
        document.head.appendChild(el);
    }, []);

    return null;
};
