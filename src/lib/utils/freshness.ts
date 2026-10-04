/**
 * Tabs stay mounted, so a page that was open before you posted does not know
 * something new exists. Publishing stamps this; pages that list your content
 * compare the stamp when they come back into view and reload if it moved.
 */
let stamp = 0;

export const markContentChanged = () => {
    stamp = Date.now();
};

export const contentStamp = () => stamp;
