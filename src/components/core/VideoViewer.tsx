import React from 'react';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { IconButton } from './IconButton';

interface VideoViewerProps {
    url: string;
    onClose: () => void;
}

/** Full-screen playback for one clip, with the system controls. Mount it only while it should be open. */
export function VideoViewer({ url, onClose }: VideoViewerProps) {
    const insets = useSafeAreaInsets();
    const player = useVideoPlayer(url, p => {
        p.loop = false;
        p.play();
    });

    return (
        <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
                <VideoView player={player} style={{ flex: 1, width: '100%', height: '100%' }} contentFit="contain" nativeControls />
                <View style={{ position: 'absolute', top: insets.top + 4, left: 6 }}>
                    <IconButton variant="glass" name="close" label="Close video" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
}
