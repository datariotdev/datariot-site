import React from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChatThread } from '../../components/Chat/ChatThread';

export default function ChatScreen() {
    const { id, name, userId } = useLocalSearchParams<{ id: string; name?: string; userId?: string }>();
    const router = useRouter();

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ChatThread key={`${userId ? 'recipient' : 'chat'}:${id}`} id={id} name={name} userId={userId}
                onBack={() => router.canGoBack() ? router.back() : router.replace('/inbox')} />
        </>
    );
}
