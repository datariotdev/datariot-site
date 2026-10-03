import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';

/**
 * Likes, saves and follows need an account. Signed out they used to do nothing
 * at all, which reads as a broken button. Say why, and offer the way in.
 */
export function promptSignIn(action: string = 'do that') {
    const message = `Sign in to ${action}.`;

    if (Platform.OS === 'web') {
        // react-native-web ships Alert.alert as a no-op, so use the browser's own dialog
        if (typeof window !== 'undefined' && window.confirm(`${message}\n\nGo to sign in?`)) {
            router.push('/auth/login');
        }
        return;
    }

    Alert.alert('Sign in needed', message, [
        { text: 'Not now', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/auth/login') },
    ]);
}
