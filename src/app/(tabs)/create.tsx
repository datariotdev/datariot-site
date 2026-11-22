/** @jsxImportSource react */
import React, { useRef, useState } from 'react';
import { View, ActivityIndicator, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from '../../components/UI/SafeAreaView';
import { usePalette } from '../../design-system/palette';
import { CreateStudio } from '../../components/Create/CreateStudio';

export default function CreateScreen() {
    const { user, loading } = useAuth();
    const p = usePalette();
    const insets = useSafeAreaInsets();
    const [picking, setPicking] = useState(false);
    const pickingRef = useRef(false);
    const background = p.isDark ? '#08090D' : '#F7F8FA';

    const pickVideo = async () => {
        if (!user) { router.push('/auth/login'); return; }
        if (pickingRef.current) return;
        pickingRef.current = true;
        setPicking(true);
        try {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Allow access to your videos to choose a clip.');
                    return;
                }
            }
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], allowsEditing: true, quality: 1 });
            if (!result.canceled && result.assets?.[0]) {
                router.push({ pathname: '/editor', params: { videoUri: result.assets[0].uri } });
            }
        } catch {
            Alert.alert('Couldn’t open your videos', 'Please try again.');
        } finally {
            pickingRef.current = false;
            setPicking(false);
        }
    };

    return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: background }}>
        <StatusBar style={p.isDark ? 'light' : 'dark'} />
        {loading ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={p.accent} /></View>
            : <CreateStudio onVideo={pickVideo} onThesis={() => router.push(user ? '/publish' : '/auth/login')}
                busy={picking} bottomInset={insets.bottom} signedIn={!!user} />}
    </SafeAreaView>;
}
