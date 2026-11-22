import React from 'react';
import { Redirect } from 'expo-router';

// Keep old links working while Animated Shorts is paused.
export default function AnimatedShortsScreen() {
    return <Redirect href="/(tabs)/discover" />;
}
