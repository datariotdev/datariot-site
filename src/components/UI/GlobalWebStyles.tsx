import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Shared web focus, scrolling and animation primitives.
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

/* --- Ambient aurora blobs: slow, non-repeating drift ------------------- */
@keyframes dr-drift-a {
    0%   { transform: translate3d(0, 0, 0) scale(1); }
    33%  { transform: translate3d(6vw, 4vh, 0) scale(1.12); }
    66%  { transform: translate3d(-3vw, 7vh, 0) scale(0.94); }
    100% { transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes dr-drift-b {
    0%   { transform: translate3d(0, 0, 0) scale(1.05); }
    40%  { transform: translate3d(-7vw, 5vh, 0) scale(0.9); }
    75%  { transform: translate3d(4vw, -4vh, 0) scale(1.18); }
    100% { transform: translate3d(0, 0, 0) scale(1.05); }
}
.dr-drift-a { animation: dr-drift-a 38s ease-in-out infinite; }
.dr-drift-b { animation: dr-drift-b 52s ease-in-out infinite; }

/* --- Scanline sweep down the viewport --------------------------------- */
@keyframes dr-scan {
    0%   { transform: translateY(-20vh); opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { transform: translateY(120vh); opacity: 0; }
}
.dr-scan { animation: dr-scan 11s linear infinite; }

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

[data-testid="feed-preview-image"] { transition: transform 180ms ease-out; }

/* --- Global chrome ----------------------------------------------------- */
::selection { background: rgba(107, 127, 204, 0.35); }
[role="button"]:focus-visible, [role="link"]:focus-visible, [role="tab"]:focus-visible {
    outline: 2px solid #6B7FCC;
    outline-offset: 3px;
}
[role="button"]:hover, [role="link"]:hover, [role="tab"]:hover { filter: brightness(0.94); }

*::-webkit-scrollbar { width: 9px; height: 9px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb {
    background: rgba(125, 140, 170, 0.32);
    border-radius: 8px;
}
*::-webkit-scrollbar-thumb:hover { background: rgba(125, 140, 170, 0.5); }

@media (prefers-reduced-motion: reduce) {
    [data-testid="feed-preview-image"] { transition: none !important; transform: none !important; }
    .dr-drift-a, .dr-drift-b, .dr-scan, .dr-ticker, .dr-flicker, .status-pulse-anim {
        animation: none !important;
    }
}
`;

export const GlobalWebStyles = () => {
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
