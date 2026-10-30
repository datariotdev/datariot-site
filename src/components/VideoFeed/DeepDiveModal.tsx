import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, Pressable, FlatList, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../Theme/ThemeProvider';
import { generateDeepDive, chatWithVideo, getAIErrorMessage, DeepDiveData, DeepDiveMessage, VideoContext } from '../../lib/ai/client';

type TabType = 'summary' | 'resources' | 'chat';
interface DeepDiveModalProps {
    visible: boolean;
    video: (Partial<VideoContext> & { id?: string }) | null;
    onClose: () => void;
}
const QUESTIONS = ['Explain it simply', 'Give a real-world example', 'What is the strongest counterargument?'];

export function DeepDiveModal({ visible, video, onClose }: DeepDiveModalProps) {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabType>('summary');
    const [loading, setLoading] = useState(false);
    const [deepDiveData, setDeepDiveData] = useState<DeepDiveData | null>(null);
    const [loadError, setLoadError] = useState('');
    const [chatError, setChatError] = useState('');
    const [retry, setRetry] = useState(0);
    const [chatHistory, setChatHistory] = useState<DeepDiveMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatListRef = useRef<FlatList>(null);
    const chatRequest = useRef<AbortController | null>(null);
    const version = useRef(0);
    const context = useMemo(() => ({ title: video?.title || '', description: video?.description || '', transcript: video?.transcript || '' }), [video?.title, video?.description, video?.transcript]);

    useEffect(() => {
        version.current += 1;
        chatRequest.current?.abort();
        chatRequest.current = null;
        setChatLoading(false);
        setChatHistory([]);
        setInputText('');
        setChatError('');
        setActiveTab('summary');
        return () => { version.current += 1; chatRequest.current?.abort(); };
    }, [visible, video?.id, context]);

    useEffect(() => {
        if (!visible || !video) return;
        let active = true;
        const controller = new AbortController();
        setLoading(true);
        setLoadError('');
        setDeepDiveData(null);
        generateDeepDive(context, controller.signal).then(data => {
            if (active) setDeepDiveData(data);
        }).catch(error => {
            if (active) setLoadError(getAIErrorMessage(error));
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; controller.abort(); };
    }, [visible, video?.id, context, retry]);

    const handleSendMessage = async (suggestion?: string) => {
        const question = (suggestion || inputText).trim();
        if (!question || !video || !visible || chatRequest.current) return;
        const controller = new AbortController();
        chatRequest.current = controller;
        const currentVersion = version.current;
        setActiveTab('chat');
        setChatError('');
        setChatLoading(true);
        setInputText('');
        setChatHistory(previous => [...previous, { role: 'user', content: question }]);
        try {
            const response = await chatWithVideo(context, question, chatHistory, controller.signal);
            if (version.current === currentVersion) setChatHistory(previous => [...previous, { role: 'assistant', content: response }]);
        } catch (error) {
            if (version.current === currentVersion) {
                setChatError(getAIErrorMessage(error));
                setInputText(current => current || question);
                setChatHistory(previous => previous.slice(0, -1));
            }
        } finally {
            if (version.current === currentVersion) { setChatLoading(false); chatRequest.current = null; }
        }
    };
    const textColor = theme.colors.text.primary;
    const secondary = theme.colors.text.secondary;
    const accent = theme.colors.primary.DEFAULT;
    const card = { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' };
    const sourceNote = context.transcript ? 'Based on supplied transcript; audio and visuals are not reviewed.'
        : context.description ? 'Based on the title and description; the full video has not been reviewed.'
        : 'Only the title is available. Add details for a more useful discussion.';
    const questions = deepDiveData?.followUpQuestions.length ? deepDiveData.followUpQuestions : QUESTIONS;
    const questionButton = (question: string) => (
        <Pressable key={question} accessibilityRole="button" disabled={chatLoading} onPress={() => void handleSendMessage(question)} style={[styles.termCard, card, { borderLeftColor: accent, opacity: chatLoading ? 0.5 : 1 }]}>
            <Text style={{ color: textColor }}>{question} →</Text>
        </Pressable>
    );
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalContainer}>
                <Pressable accessibilityLabel="Close Orvelis" style={styles.backdrop} onPress={onClose} />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.sheet, { backgroundColor: isDark ? '#000814' : '#FFFFFF' }]}>
                    <View style={[styles.handle, { backgroundColor: secondary }]} />
                    <View style={styles.sheetHeader}>
                        <View style={styles.headerInfo}>
                            <MaterialCommunityIcons name="brain" size={22} color={accent} />
                            <View style={styles.headerTitles}>
                                <Text style={[styles.sheetTitle, { color: textColor }]}>ORVELIS DEEP DIVE</Text>
                                <Text numberOfLines={1} style={[styles.videoTitle, { color: secondary }]}>{video?.title || 'Explore this topic'}</Text>
                            </View>
                        </View>
                        <Pressable accessibilityRole="button" accessibilityLabel="Close Orvelis" hitSlop={12} onPress={onClose}><Ionicons name="close" size={24} color={textColor} /></Pressable>
                    </View>
                    <Text style={{ color: secondary, paddingHorizontal: 24, paddingBottom: 12, fontSize: 12 }}>{sourceNote}</Text>
                    <View style={styles.tabsRow}>
                        {(['summary', 'resources', 'chat'] as TabType[]).map(tab => (
                            <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab }} onPress={() => setActiveTab(tab)} style={[styles.tabButton, activeTab === tab && { borderBottomColor: accent }]}>
                                <Text style={[styles.tabLabel, { color: activeTab === tab ? accent : secondary }]}>{tab === 'summary' ? 'Understand' : tab === 'resources' ? 'Explore next' : 'Ask Orvelis'}</Text>
                            </Pressable>
                        ))}
                    </View>
                    <View style={styles.contentWrapper}>
                        {activeTab !== 'chat' && (loading ? (
                            <View style={styles.loaderContainer}><ActivityIndicator color={accent} size="large" /><Text style={[styles.loaderText, { color: secondary }]}>Preparing your brief…</Text></View>
                        ) : loadError ? (
                            <View style={styles.loaderContainer}>
                                <Text accessibilityRole="alert" style={[styles.summaryText, { color: textColor }]}>{loadError}</Text>
                                <Pressable accessibilityRole="button" onPress={() => setRetry(n => n + 1)} style={[styles.termCard, card, { marginTop: 16 }]}><Text style={{ color: accent }}>Try again</Text></Pressable>
                            </View>
                        ) : deepDiveData && (
                            <ScrollView contentContainerStyle={styles.scrollContent}>
                                {activeTab === 'summary' ? <>
                                    <Text style={[styles.sectionTitle, { color: accent }]}>THE MAIN IDEA</Text>
                                    <Text style={[styles.summaryText, { color: textColor }]}>{deepDiveData.summary}</Text>
                                    {deepDiveData.keyTerms.length > 0 && <Text style={[styles.sectionTitle, { color: accent, marginTop: 24 }]}>USEFUL TERMS</Text>}
                                    {deepDiveData.keyTerms.map(term => <View key={term.term} style={[styles.termCard, card, { borderLeftColor: accent }]}><Text style={[styles.termName, { color: textColor }]}>{term.term}</Text><Text style={[styles.termDef, { color: secondary }]}>{term.definition}</Text></View>)}
                                    <Text style={[styles.sectionTitle, { color: accent, marginTop: 24 }]}>WHAT STILL NEEDS CONTEXT</Text>
                                    <Text style={[styles.summaryText, { color: secondary }]}>{deepDiveData.contextNotes}</Text>
                                    <Text style={[styles.sectionTitle, { color: accent, marginTop: 24 }]}>TAKE IT FURTHER</Text>
                                    {QUESTIONS.map(questionButton)}
                                </> : <>
                                    <Text style={[styles.sectionTitle, { color: accent }]}>RELATED TOPICS</Text>
                                    <Text style={[styles.termDef, { color: secondary, marginBottom: 16 }]}>Suggested directions to discuss with Orvelis. These are not verified sources.</Text>
                                    {deepDiveData.recommendations.map(rec => <Pressable key={rec.id} accessibilityRole="button" disabled={chatLoading} onPress={() => void handleSendMessage(`Explain ${rec.title} and how it connects to this topic.`)} style={[styles.resourceCard, card]}><Text style={[styles.resourceTitle, { color: textColor }]}>{rec.title} →</Text><Text style={[styles.resourceReason, { color: secondary }]}>{rec.reason}</Text></Pressable>)}
                                    {questions.map(questionButton)}
                                </>}
                            </ScrollView>
                        ))}
                        {activeTab === 'chat' && <View style={styles.chatWrapper}>
                            <FlatList ref={chatListRef} data={chatHistory} keyExtractor={(_, i) => String(i)} contentContainerStyle={styles.chatListContent}
                                onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
                                ListEmptyComponent={<View><Text style={[styles.summaryText, { color: secondary, marginBottom: 16 }]}>Ask about the idea, compare arguments, or try an example.</Text>{questions.map(questionButton)}</View>}
                                ListFooterComponent={chatLoading ? <ActivityIndicator color={accent} style={{ padding: 16 }} /> : null}
                                renderItem={({ item }) => <View style={item.role === 'user' ? styles.userBubbleContainer : styles.aiBubbleContainer}><View style={[styles.chatBubble, card, item.role === 'user' && { backgroundColor: accent }]}><Text selectable style={[styles.chatText, { color: item.role === 'user' ? '#FFF' : textColor }]}>{item.content}</Text></View></View>} />
                            {!!chatError && <Text accessibilityRole="alert" style={{ color: secondary, paddingHorizontal: 20, paddingBottom: 8 }}>{chatError}</Text>}
                            <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
                                <TextInput accessibilityLabel="Question for Orvelis" value={inputText} onChangeText={setInputText} maxLength={6000} placeholder="Ask about this topic…" placeholderTextColor={secondary} style={[styles.input, card, { color: textColor }]} onSubmitEditing={() => void handleSendMessage()} returnKeyType="send" />
                                <Pressable accessibilityRole="button" accessibilityLabel="Send question" disabled={chatLoading || !inputText.trim()} onPress={() => void handleSendMessage()} style={[styles.sendBtn, { backgroundColor: accent, opacity: chatLoading || !inputText.trim() ? 0.4 : 1 }]}><Ionicons name="arrow-up" size={18} color="#FFF" /></Pressable>
                            </View>
                        </View>}
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        height: '75%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    headerIconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitles: {
        flex: 1,
    },
    sheetTitle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
    },
    videoTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
    // Tabs
    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        borderBottomWidth: 1,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Content wrapper
    contentWrapper: {
        flex: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 12,
    },
    loaderText: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 12,
    },
    cardContainer: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
    },
    summaryText: {
        fontSize: 14,
        lineHeight: 22,
    },
    termCard: {
        borderLeftWidth: 3,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    termName: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    termDef: {
        fontSize: 13,
        lineHeight: 18,
    },
    // Resources
    resourceCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
    },
    resourceHeader: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 10,
    },
    resourceIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resourceMeta: {
        flex: 1,
        justifyContent: 'center',
    },
    resourceTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    typeBadge: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    timeBadge: {
        fontSize: 11,
        color: 'rgba(150,150,160,0.8)',
        fontWeight: '600',
    },
    resourceReason: {
        fontSize: 13,
        lineHeight: 18,
    },
    // Chat Screen
    chatWrapper: {
        flex: 1,
    },
    chatListContent: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
    },
    userBubbleContainer: {
        alignSelf: 'flex-end',
        maxWidth: '85%',
    },
    aiBubbleContainer: {
        flexDirection: 'row',
        gap: 8,
        alignSelf: 'flex-start',
        maxWidth: '85%',
    },
    aiAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    chatBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
    },
    userBubble: {
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        borderBottomLeftRadius: 4,
    },
    chatText: {
        fontSize: 14,
        lineHeight: 20,
    },
    typingContainer: {
        alignSelf: 'flex-start',
        paddingLeft: 32,
        paddingVertical: 4,
    },
    typingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(56, 189, 248, 0.8)',
        marginHorizontal: 1.5,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    input: {
        flex: 1,
        borderRadius: 22,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        maxHeight: 44,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
});
