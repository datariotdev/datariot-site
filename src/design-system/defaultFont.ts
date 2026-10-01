import React from 'react';
import { Text, TextInput } from 'react-native';
import { FONT } from './fonts';

/**
 * React Native has no global "default font". Any <Text> that does not name a
 * family renders in the system face — on web that is Arial — so a screen whose
 * author never thought about type (login, settings, most modals) sits in a
 * different typeface from the rest of the app.
 *
 * This puts Manrope underneath every Text and TextInput. It goes FIRST in the
 * style array, so any explicit fontFamily still wins; passing it as a prop
 * rather than patching the rendered element matters on web, where the
 * element's style is already compiled and an inline fontFamily would beat the
 * atomic classes that carry explicit ones.
 */
let patched = false;

const patch = (Component: any) => {
    const render = Component?.render;
    if (typeof render !== 'function') return;
    Component.render = function (props: any, ref: any) {
        return render.call(this, { ...props, style: [{ fontFamily: FONT.sans }, props.style] }, ref);
    };
};

export const applyDefaultFont = () => {
    if (patched) return;
    patched = true;
    patch(Text);
    patch(TextInput);
};

// Side-effect import: `import '@design-system/defaultFont'` is enough.
applyDefaultFont();
void React;
