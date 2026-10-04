import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Modal,
    View,
    StyleSheet,
    TextInput,
    Pressable,
    FlatList,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useComments, Comment } from '@lib/supabase/hooks/useComments';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { FONT, RADIUS, useUI } from '../../design-system/ui';
import { Txt } from '../core/Txt';
import { Avatar } from '../core/Avatar';
import { Button } from '../core/Button';

interface CommentsModalProps {
    visible: boolean;
    videoId: string | null;
    onClose: () => void;
}

function CommentRow({
    comment,
    isOwn,
    onLike,
    onReply,
    onDelete,
}: {
    comment: Comment;
    isOwn: boolean;
    onLike: (id: string) => void;
    onReply: (id: string, name: string) => void;
    onDelete: (id: string) => void;
}) {
    const { c } = useUI();
    const heartScale = useRef(new Animated.Value(1)).current;

    const handleLike = () => {
        Animated.sequence([
            Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 60, bounciness: 12 }),
            Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 60, bounciness: 8 }),
        ]).start();
        onLike(comment.id);
    };

    const handleDelete = () => {
        Alert.alert('Delete comment', 'This can\'t be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(comment.id) },
        ]);
    };

    return (
        <View style={styles.row}>
            <Avatar uri={comment.authorAvatar} name={comment.authorName} size={34} />
            <View style={styles.rowBody}>
                <View style={styles.rowHead}>
                    <Txt variant="callout" tone="secondary">{comment.authorName}</Txt>
                    <Txt variant="caption" tone="tertiary">{comment.timestamp}</Txt>
                </View>
                <Txt variant="body">{comment.content}</Txt>

                <View style={styles.rowActions}>
                    <Pressable onPress={() => onReply(comment.id, comment.authorName)} hitSlop={10}>
                        <Txt variant="caption" tone="secondary">Reply</Txt>
                    </Pressable>
                    {isOwn ? (
                        <Pressable onPress={handleDelete} hitSlop={10}>
                            <Txt variant="caption" tone="secondary">Delete</Txt>
                        </Pressable>
                    ) : null}
                </View>

                {comment.replies && comment.replies.length > 0 ? (
                    <View style={styles.replies}>
                        {comment.replies.map(reply => (
                            <View key={reply.id} style={styles.reply}>
                                <Avatar uri={reply.authorAvatar} name={reply.authorName} size={24} />
                                <View style={{ flex: 1 }}>
                                    <Txt variant="callout" tone="secondary">{reply.authorName}</Txt>
                                    <Txt variant="body">{reply.content}</Txt>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : null}
            </View>

            <Pressable onPress={handleLike} hitSlop={12} style={styles.like} accessibilityRole="button" accessibilityLabel={comment.isLiked ? 'Unlike comment' : 'Like comment'}>
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                    <Ionicons
                        name={comment.isLiked ? 'heart' : 'heart-outline'}
                        size={19}
                        color={comment.isLiked ? c.like : c.textTertiary}
                    />
                </Animated.View>
                {comment.likes > 0 ? <Txt variant="micro" tone="secondary" style={{ marginTop: 2 }}>{comment.likes}</Txt> : null}
            </Pressable>
        </View>
    );
}

export function CommentsModal({ visible, videoId, onClose }: CommentsModalProps) {
    const { c } = useUI();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { comments, loading, posting, fetchComments, postComment, toggleLikeComment, deleteComment } = useComments(videoId);
    const [text, setText] = useState('');
    const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (visible && videoId) {
            fetchComments();
        } else {
            setText('');
            setReplyTo(null);
        }
    }, [visible, videoId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleReply = useCallback((id: string, name: string) => {
        setReplyTo({ id, name });
        inputRef.current?.focus();
    }, []);

    const handleSend = async () => {
        if (!text.trim() || !user) return;
        await postComment(text, replyTo?.id);
        setText('');
        setReplyTo(null);
    };

    const signIn = () => {
        onClose();
        setTimeout(() => router.push('/auth/login'), 250);
    };

    const canSend = !!text.trim() && !!user && !posting;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modal}>
                <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close comments" />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={[styles.sheet, { backgroundColor: c.surface }]}
                >
                    <View style={[styles.handle, { backgroundColor: c.hairline }]} />

                    <View style={styles.header}>
                        <Txt variant="headline">
                            Comments{comments.length > 0 ? <Txt variant="headline" tone="tertiary">  {comments.length}</Txt> : null}
                        </Txt>
                        <Pressable onPress={onClose} hitSlop={14} accessibilityRole="button" accessibilityLabel="Close">
                            <Ionicons name="close" size={22} color={c.textSecondary} />
                        </Pressable>
                    </View>

                    <View style={[styles.divider, { backgroundColor: c.hairline }]} />

                    <View style={styles.list}>
                        {loading ? (
                            <View style={styles.center}>
                                <ActivityIndicator color={c.textSecondary} />
                            </View>
                        ) : comments.length === 0 ? (
                            <View style={styles.center}>
                                <Ionicons name="chatbubble-ellipses-outline" size={30} color={c.textTertiary} />
                                <Txt variant="headline" style={{ marginTop: 12 }}>No comments yet</Txt>
                                <Txt variant="body" tone="secondary" style={{ marginTop: 4 }}>Start the conversation.</Txt>
                            </View>
                        ) : (
                            <FlatList
                                data={comments}
                                keyExtractor={cm => cm.id}
                                renderItem={({ item }) => (
                                    <CommentRow
                                        comment={item}
                                        isOwn={item.authorId === user?.id}
                                        onLike={toggleLikeComment}
                                        onReply={handleReply}
                                        onDelete={deleteComment}
                                    />
                                )}
                                contentContainerStyle={styles.listContent}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            />
                        )}
                    </View>

                    {replyTo ? (
                        <View style={[styles.replying, { backgroundColor: c.surfaceHigh }]}>
                            <Txt variant="caption" tone="secondary">Replying to @{replyTo.name}</Txt>
                            <Pressable onPress={() => setReplyTo(null)} hitSlop={10}>
                                <Ionicons name="close" size={16} color={c.textSecondary} />
                            </Pressable>
                        </View>
                    ) : null}

                    <View style={[styles.composer, { borderTopColor: c.hairline, paddingBottom: Math.max(insets.bottom, 10) }]}>
                        {user ? (
                            <>
                                <TextInput
                                    ref={inputRef}
                                    value={text}
                                    onChangeText={setText}
                                    placeholder="Add a comment…"
                                    placeholderTextColor={c.textTertiary}
                                    style={[styles.input, { backgroundColor: c.surfaceHigh, color: c.text }]}
                                    multiline
                                    maxLength={500}
                                    returnKeyType="send"
                                    onSubmitEditing={handleSend}
                                />
                                <Pressable
                                    onPress={handleSend}
                                    disabled={!canSend}
                                    accessibilityRole="button"
                                    accessibilityLabel="Send comment"
                                    style={[styles.send, { backgroundColor: canSend ? c.accent : c.surfaceHigh }]}
                                >
                                    {posting ? (
                                        <ActivityIndicator size="small" color={c.onAccent} />
                                    ) : (
                                        <Ionicons name="arrow-up" size={19} color={canSend ? c.onAccent : c.textTertiary} />
                                    )}
                                </Pressable>
                            </>
                        ) : (
                            <Button label="Sign in to comment" onPress={signIn} fullWidth />
                        )}
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modal: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: { height: '72%', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, overflow: 'hidden' },
    handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 },
    divider: { height: StyleSheet.hairlineWidth },
    list: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    listContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 18 },
    row: { flexDirection: 'row', gap: 12 },
    rowBody: { flex: 1, gap: 2 },
    rowHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    rowActions: { flexDirection: 'row', gap: 18, marginTop: 6 },
    replies: { marginTop: 12, gap: 12 },
    reply: { flexDirection: 'row', gap: 10 },
    like: { width: 34, alignItems: 'center', paddingTop: 2 },
    replying: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
    composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
    input: {
        flex: 1,
        minHeight: 42,
        maxHeight: 110,
        borderRadius: 21,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 11 : 9,
        paddingBottom: Platform.OS === 'ios' ? 11 : 9,
        fontFamily: FONT.regular,
        fontSize: 15,
    },
    send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
