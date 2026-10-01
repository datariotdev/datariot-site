import { Platform } from 'react-native';

/**
 * Pixel-notch clip path: the info site's `--px-notch`. One step is cut from
 * every corner and the corner becomes a staircase rather than an arc.
 */
export const pixelNotch = (step: number = 4): string =>
    `polygon(${step}px 0, calc(100% - ${step}px) 0, calc(100% - ${step}px) ${step}px, 100% ${step}px, ` +
    `100% calc(100% - ${step}px), calc(100% - ${step}px) calc(100% - ${step}px), calc(100% - ${step}px) 100%, ` +
    `${step}px 100%, ${step}px calc(100% - ${step}px), 0 calc(100% - ${step}px), 0 ${step}px, ${step}px ${step}px)`;

/**
 * Style fragment that gives a View/Pressable stepped corners.
 *
 * Web uses clip-path. A border drawn on the same element is clipped at the
 * corners, which is the look info.datariot.xyz has on its chips and buttons:
 * the edge runs the full side and the corner is simply cut away. Native has
 * no clip-path, so it falls back to a 2px radius.
 */
export const pixelClip = (step: number = 3): any =>
    Platform.OS === 'web' ? { clipPath: pixelNotch(step), borderRadius: 0 } : { borderRadius: 2 };

/**
 * Fade the right edge of a horizontally scrolling row into whatever is behind
 * it. A mask, not a gradient laid over the content: the page behind is the
 * aurora, so there is no single background colour a gradient could match.
 * Only the right edge — these rows always run off that side, but at scroll 0
 * nothing is hidden on the left and fading it would wash out the first card.
 */
export const fadeRight = (width: number = 40): any =>
    Platform.OS === 'web'
        ? {
              maskImage: `linear-gradient(to right, #000 calc(100% - ${width}px), transparent)`,
              WebkitMaskImage: `linear-gradient(to right, #000 calc(100% - ${width}px), transparent)`,
          }
        : null;
