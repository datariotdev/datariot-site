import React from 'react';
import { Text, TextInput } from 'react-native';
import { FONT } from './fonts';

/**
 * Native twin of defaultFont.web.ts: Manrope underneath every Text and
 * TextInput, first in the style array so an explicit fontFamily still wins,
 * and nested <Text> inherits its parent's family instead of resetting it.
 */
let patched = false;

let TextAncestor: any = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native/Libraries/Text/TextAncestor');
    TextAncestor = mod?.default ?? mod;
} catch {
    TextAncestor = null;
}

const patch = (Component: any, skipNested: boolean) => {
    const render = Component?.render;
    if (typeof render !== 'function') return;
    Component.render = function (props: any, ref: any) {
        const nested = skipNested && TextAncestor ? React.useContext(TextAncestor) : false;
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
