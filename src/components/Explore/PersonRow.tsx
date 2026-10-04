import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { PersonResult } from '../../lib/supabase/hooks/useSearchProfiles';
import { Avatar } from '../core/Avatar';
import { Button } from '../core/Button';
import { Txt } from '../core/Txt';

interface PersonRowProps {
    person: PersonResult;
    onPress: () => void;
    onToggleFollow: () => void;
}

export function PersonRow({ person, onPress, onToggleFollow }: PersonRowProps) {
    return (
        <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
            <Avatar uri={person.avatarUrl} name={person.displayName} size={52} />
            <View style={styles.text}>
                <Txt variant="bodyStrong" numberOfLines={1}>{person.displayName}</Txt>
                <Txt variant="caption" tone="secondary" numberOfLines={1}>@{person.username}</Txt>
                {person.bio ? <Txt variant="caption" tone="tertiary" numberOfLines={1} style={{ marginTop: 2 }}>{person.bio}</Txt> : null}
            </View>
            <Button
                label={person.isFollowing ? 'Following' : 'Follow'}
                variant={person.isFollowing ? 'secondary' : 'primary'}
                size="sm"
                onPress={onToggleFollow}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 10 },
    text: { flex: 1, gap: 1 },
});
