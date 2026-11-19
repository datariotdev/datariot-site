import React from 'react';
import { Redirect } from 'expo-router';

// Keep old bookmarks working after retiring business promotion.
export default function BusinessScreen() {
    return <Redirect href="/settings" />;
}
