import React from 'react';
import { Text, TextInput } from 'react-native';
// @ts-ignore — deep import; the context is not part of react-native-web's public typings
import TextAncestorContext from 'react-native-web/dist/exports/Text/TextAncestorContext';
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
 *
 * A <Text> nested inside another <Text> is left alone: it inherits the
 * parent's family, which is the whole point of nesting (a Pixelify headline
 * with one differently-coloured word must stay Pixelify).
 */
let patched = false;

const patch = (Component: any, skipNested: boolean) => {
    const render = Component?.render;
    if (typeof render !== 'function') return;
    Component.render = function (props: any, ref: any) {
        const nested = skipNested ? React.useContext(TextAncestorContext) : false;
        return render.call(this, nested ? props : { ...props, style: [{ fontFamily: FONT.sans }, props.style] }, ref);
    };
};

export const applyDefaultFont = () => {
    if (patched) return;
    patched = true;
    patch(Text, true);
    patch(TextInput, false);
};

// Side-effect import: `import '@design-system/defaultFont'` is enough.
applyDefaultFont();
