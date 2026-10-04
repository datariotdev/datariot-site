import { Alert, Platform } from 'react-native';

/**
 * react-native-web ships Alert.alert as a no-op, so on the web every "are you sure"
 * and every error message silently vanished. These two use the system alert on a
 * phone and the browser's own dialogs on the web.
 */

/** A message with one OK button. */
export function notify(title: string, message?: string) {
    if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert(message ? `${title}\n\n${message}` : title);
        return;
    }
    Alert.alert(title, message);
}

interface ConfirmOptions {
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Paints the confirm button red on iOS: for deletes and log outs. */
    destructive?: boolean;
}

/** Resolves true when the person confirms, false when they back out. */
export function confirmAction(title: string, { message, confirmLabel = 'OK', cancelLabel = 'Cancel', destructive }: ConfirmOptions = {}): Promise<boolean> {
    if (Platform.OS === 'web') {
        const text = message ? `${title}\n\n${message}` : title;
        return Promise.resolve(typeof window !== 'undefined' && window.confirm(text));
    }
    return new Promise(resolve => {
        Alert.alert(
            title,
            message,
            [
                { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
                { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
            ],
            { cancelable: true, onDismiss: () => resolve(false) },
        );
    });
}
