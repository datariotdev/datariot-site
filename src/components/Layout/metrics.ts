/**
 * One set of numbers for the desktop home layout, so the top bar, the filter
 * row, the section headers and the cards all sit on the same column, and the
 * dock's header lines up with the bar beside it.
 */

/** Widest the content ever gets, gutters excluded. */
export const DECK_MAX = 1120;
export const DECK_GUTTER = 32;

/** Height of the bar over the deck, and of the matching header band in the dock. */
export const TOPBAR_HEIGHT = 56;

/** The instrument dock, pinned to the window's right edge. */
export const DOCK_WIDTH = 320;
export const DOCK_PAD = 24;

/**
 * Style fragment for the centred column. Apply it to the element that holds the
 * content, not to the scroll container: the scroller stays full width so the
 * mouse wheel works over the margins too.
 */
export const deckColumn: any = {
    width: '100%',
    maxWidth: DECK_MAX + DECK_GUTTER * 2,
    alignSelf: 'center',
    paddingHorizontal: DECK_GUTTER,
};
