import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, KeyboardAvoidingView, Platform, FlatList, Modal, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, Easing } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { generateVideoAnalysis, chatWithAI, generateDailyInsight, VideoAnalysis, DailyInsight } from '../../lib/ai/client';

const { width } = Dimensions.get('window');

type ToolType = 'chat' | 'insight' | 'analyze';

interface Message {
    id: string;
    role: 'user' | 'system' | 'assistant';
    content: string;
    type?: 'text' | 'analysis' | 'insight';
    data?: any;
}

// Generate unique IDs
let _msgIdCounter = 0;
const uniqueId = () => `msg_${Date.now()}_${++_msgIdCounter}`;

// Example prompts for first-time users
const EXAMPLE_PROMPTS = [
    { iconType: 'material', iconName: 'lightning-bolt', color: '#A5C6FF', text: 'Daily insight', tool: 'insight' as ToolType, desc: 'Focus reading' },
    { iconType: 'material', iconName: 'microscope', color: '#10B981', text: 'Analyze content', tool: 'analyze' as ToolType, desc: 'Truth scan' },
    { iconType: 'material', iconName: 'brain', color: '#8B5CF6', text: 'What can you do?', tool: 'chat' as ToolType, desc: 'Capabilities' },
    { iconType: 'feather', iconName: 'lightbulb', color: '#EC4899', text: 'Tell me something interesting', tool: 'chat' as ToolType, desc: 'Random insight' },
];

// Animated typing dots component
const TypingIndicator = () => {
    const dot1 = useSharedValue(0.3);
    const dot2 = useSharedValue(0.3);
    const dot3 = useSharedValue(0.3);

    useEffect(() => {
        dot1.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 400 }),
                withTiming(0.3, { duration: 400 })
            ), -1, false
        );
        dot2.value = withRepeat(
            withSequence(
                withDelay(150, withTiming(1, { duration: 400 })),
                withTiming(0.3, { duration: 400 })
            ), -1, false
        );
        dot3.value = withRepeat(
            withSequence(
                withDelay(300, withTiming(1, { duration: 400 })),
                withTiming(0.3, { duration: 400 })
            ), -1, false
        );
    }, []);

    const style1 = useAnimatedStyle(() => ({ opacity: dot1.value, transform: [{ scale: 0.8 + dot1.value * 0.4 }] }));
    const style2 = useAnimatedStyle(() => ({ opacity: dot2.value, transform: [{ scale: 0.8 + dot2.value * 0.4 }] }));
    const style3 = useAnimatedStyle(() => ({ opacity: dot3.value, transform: [{ scale: 0.8 + dot3.value * 0.4 }] }));

    return (
        <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
                <MaterialCommunityIcons name="robot-excited-outline" size={14} color="rgba(255,255,255,0.4)" style={{ marginRight: 8 }} />
                <Animated.View style={[styles.typingDot, style1]} />
                <Animated.View style={[styles.typingDot, style2]} />
                <Animated.View style={[styles.typingDot, style3]} />
            </View>
        </View>
    );
};

// Glow pulse for the header icon
const PulseGlow = () => {
    const pulse = useSharedValue(0.4);

    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ), -1, false
        );
    }, []);

    const glowStyle = useAnimatedStyle(() => ({
        opacity: pulse.value * 0.6,
        transform: [{ scale: 0.9 + pulse.value * 0.2 }],
    }));

    return (
        <Animated.View style={[styles.headerGlow, glowStyle]}>
            <LinearGradient
                colors={['rgba(217, 228, 255, 0.3)', 'rgba(217, 228, 255, 0.08)', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />
        </Animated.View>
    );
};

const SuggestionChip = ({ prompt, isDark, theme, onPress }: { prompt: any, isDark: boolean, theme: any, onPress: () => void }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Pressable
            style={({ pressed }: any) => [
                styles.suggestionChip,
                {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.65)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                },
                isHovered && {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)',
                    borderColor: prompt.color,
                    transform: [{ scale: 1.02 }],
                    shadowColor: prompt.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.2 : 0.08,
                    shadowRadius: 12,
                },
                pressed && {
                    opacity: 0.7,
                }
            ]}
            onPress={onPress}
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
        >
            <View style={[
                styles.suggestionIconContainer,
                {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                },
                isHovered && {
                    backgroundColor: `${prompt.color}15`,
                    borderColor: `${prompt.color}35`,
                }
            ]}>
                {prompt.iconType === 'feather' ? (
                    <Feather name={prompt.iconName as any} size={15} color={prompt.color} />
                ) : prompt.iconType === 'ionicon' ? (
                    <Ionicons name={prompt.iconName as any} size={15} color={prompt.color} />
                ) : (
                    <MaterialCommunityIcons name={prompt.iconName as any} size={17} color={prompt.color} />
                )}
            </View>
            <View style={styles.suggestionTextWrap}>
                <Text style={[styles.suggestionText, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.bold }]}>{prompt.text}</Text>
                <Text style={[styles.suggestionDesc, { color: theme.colors.text.muted, fontFamily: theme.typography.fontFamilies.regular }]}>{prompt.desc}</Text>
            </View>
        </Pressable>
    );
};

const AIIntroCard = ({ theme, isDark }: { theme: any, isDark: boolean }) => {
    return (
        <Animated.View 
            entering={FadeInDown.duration(400).springify()}
            style={[
                styles.introCard,
                {
                    backgroundColor: isDark ? 'rgba(14, 16, 23, 0.4)' : 'rgba(255, 255, 255, 0.45)',
                    borderColor: isDark ? 'rgba(217, 228, 255, 0.08)' : 'rgba(107, 127, 204, 0.12)',
                }
            ]}
        >
            {/* Ambient subtle flare background */}
            <LinearGradient
                colors={isDark ? ['rgba(217, 228, 255, 0.01)', 'transparent'] : ['rgba(107, 127, 204, 0.01)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.introHeader}>
                <View style={[
                    styles.introIconContainer,
                    {
                        backgroundColor: isDark ? 'rgba(217, 228, 255, 0.01)' : 'rgba(107, 127, 204, 0.02)',
                        borderColor: isDark ? 'rgba(217, 228, 255, 0.05)' : 'rgba(107, 127, 204, 0.08)',
                    }
                ]}>
                    <MaterialCommunityIcons name="brain" size={22} color={theme.colors.primary.DEFAULT} />
                </View>
                <View style={styles.introHeaderText}>
                    <Text style={[styles.introTitle, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.bold }]}>
                        ORVELIS COGNITIVE CORE
                    </Text>
                    <Text style={[styles.introSubtitle, { color: theme.colors.text.muted, fontFamily: theme.typography.fontFamilies.tech }]}>
                        SECURE SYNAPSE NODE // V1.0.0
                    </Text>
                </View>
            </View>

            <Text style={[styles.introDesc, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamilies.regular }]}>
                Engineered at the intersection of media forensics and high-fidelity intelligence synthesis. Orvelis is designed to stress-test concepts through strategic dialogue, analyze narrative parameters, and generate deep cognitive focus insight readings in real-time.
            </Text>

            <View style={[styles.introDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]} />

            <View style={styles.introMetaRow}>
                <View style={styles.introMetaCol}>
                    <Text style={[styles.introMetaLabel, { color: theme.colors.text.muted, fontFamily: theme.typography.fontFamilies.tech }]}>
                        STRATEGIC DEPTH
                    </Text>
                    <Text style={[styles.introMetaVal, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.semibold }]}>
                        SYNTHETIC COGNITION
                    </Text>
                </View>
                <View style={styles.introMetaCol}>
                    <Text style={[styles.introMetaLabel, { color: theme.colors.text.muted, fontFamily: theme.typography.fontFamilies.tech }]}>
                        SYNC STATUS
                    </Text>
                    <Text style={[styles.introMetaVal, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.semibold }]}>
                        ⚡ REAL-TIME LATENCY
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
};

export default function AIScreen() {
    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedTool, setSelectedTool] = useState<ToolType>('chat');

    // Onboarding State
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    // Refs
    const flatListRef = useRef<FlatList>(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 150);
    }, []);

    const handleExamplePrompt = (prompt: typeof EXAMPLE_PROMPTS[0]) => {
        setShowSuggestions(false);
        setSelectedTool(prompt.tool);

        if (prompt.tool === 'chat') {
            // Immediately send as a message
            const userMsg: Message = { id: uniqueId(), role: 'user', content: prompt.text, type: 'text' };
            setMessages(prev => [...prev, userMsg]);
            setLoading(true);
            scrollToBottom();

            const history = messages.map(m => ({ role: m.role, content: m.content }));
            chatWithAI(prompt.text, history).then(response => {
                setMessages(prev => [...prev, {
                    id: uniqueId(),
                    role: 'assistant',
                    content: response,
                    type: 'text'
                }]);
            }).catch(console.error).finally(() => {
                setLoading(false);
                scrollToBottom();
            });
        } else {
            handleToolSelect(prompt.tool);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        // Hide suggestions after first message
        setShowSuggestions(false);

        const userMsg: Message = { id: uniqueId(), role: 'user', content: inputText, type: 'text' };
        setMessages(prev => [...prev, userMsg]);
        const textToSend = inputText;
        setInputText('');
        setLoading(true);
        scrollToBottom();

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const response = await chatWithAI(textToSend, history);

            setMessages(prev => [...prev, {
                id: uniqueId(),
                role: 'assistant',
                content: response,
                type: 'text'
            }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, {
                id: uniqueId(),
                role: 'assistant',
                content: "Connection disrupted. I'm operating in local mode — try again or ask me something I can handle offline.",
                type: 'text'
            }]);
        } finally {
            setLoading(false);
            scrollToBottom();
        }
    };

    const handleToolSelect = async (tool: ToolType) => {
        setSelectedTool(tool);
        setShowSuggestions(false);

        if (tool === 'insight') {
            setLoading(true);
            scrollToBottom();
            try {
                const insight = await generateDailyInsight();
                setMessages(prev => [...prev, {
                    id: uniqueId(),
                    role: 'assistant',
                    content: 'Daily Insight Generated',
                    type: 'insight',
                    data: insight
                }]);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
                scrollToBottom();
            }
        } else if (tool === 'analyze') {
            setLoading(true);
            scrollToBottom();
            try {
                const analysis = await generateVideoAnalysis();
                setMessages(prev => [...prev, {
                    id: uniqueId(),
                    role: 'assistant',
                    content: 'Analysis Complete',
                    type: 'analysis',
                    data: analysis
                }]);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
                scrollToBottom();
            }
        }
        // For 'chat', just switch tool — don't trigger anything
    };

    const renderMessage = ({ item }: { item: Message }) => {
        if (item.type === 'insight') {
            const insight = item.data as DailyInsight;
            return (
                <Animated.View entering={FadeInUp.springify()} style={[styles.messageBubble, styles.aiBubble, styles.cardBubble, {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0,0,0,0.005)',
                    borderColor: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(14, 165, 233, 0.05)'
                }]}>
                    {/* Subtle gradient overlay */}
                    <LinearGradient
                        colors={isDark ? ['rgba(56, 189, 248, 0.02)', 'transparent'] : ['rgba(14, 165, 233, 0.01)', 'transparent']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                    />
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderIcon}>
                            <MaterialCommunityIcons name="lightning-bolt" size={16} color={theme.colors.primary.DEFAULT} />
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>DAILY INSIGHT</Text>
                    </View>
                    <Text style={[styles.insightScore, { color: theme.colors.text.primary }]}>{insight.score}</Text>
                    <View style={styles.insightStatusRow}>
                        <Text style={[styles.insightStatus, { color: theme.colors.primary.DEFAULT }]}>{insight.status}</Text>
                        <View style={[styles.trendBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
                            <Ionicons name="trending-up" size={12} color="#10B981" />
                            <Text style={styles.trendText}>{insight.trend}</Text>
                        </View>
                    </View>
                    <Text style={[styles.cardText, { color: theme.colors.text.secondary }]}>{insight.message}</Text>
                </Animated.View>
            );
        }

        if (item.type === 'analysis') {
            const analysis = item.data as VideoAnalysis;
            return (
                <Animated.View entering={FadeInUp.springify()} style={[styles.messageBubble, styles.aiBubble, styles.cardBubble, {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0,0,0,0.005)',
                    borderColor: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(14, 165, 233, 0.05)'
                }]}>
                    <LinearGradient
                        colors={isDark ? ['rgba(139, 92, 246, 0.02)', 'transparent'] : ['rgba(139, 92, 246, 0.01)', 'transparent']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                    />
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardHeaderIcon, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.02)' }]}>
                            <Feather name="eye" size={14} color="#8B5CF6" />
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>TRUTH ANALYSIS</Text>
                    </View>

                    <View style={styles.analysisSection}>
                        <View style={[styles.analysisLabelBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.02)' }]}>
                            <Text style={[styles.analysisLabel, { color: '#10B981' }]}>ESSENCE</Text>
                        </View>
                        <Text style={[styles.cardText, { color: theme.colors.text.secondary }]}>{analysis.essence}</Text>
                    </View>
                    <View style={styles.analysisSection}>
                        <View style={[styles.analysisLabelBadge, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)' }]}>
                            <Text style={[styles.analysisLabel, { color: '#EF4444' }]}>MANIPULATION</Text>
                        </View>
                        <Text style={[styles.cardText, { color: theme.colors.text.secondary }]}>{analysis.manipulation}</Text>
                    </View>
                    <View style={styles.analysisSection}>
                        <View style={[styles.analysisLabelBadge, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(56, 189, 248, 0.02)' }]}>
                            <Text style={[styles.analysisLabel, { color: '#38BDF8' }]}>REAL VALUE</Text>
                        </View>
                        <Text style={[styles.cardText, { color: theme.colors.text.secondary }]}>{analysis.realValue}</Text>
                    </View>
                </Animated.View>
            );
        }

        // Regular text messages
        const isUser = item.role === 'user';
        return (
            <Animated.View entering={FadeIn.duration(300)}>
                <View style={[
                    styles.messageBubble,
                    isUser
                        ? [styles.userBubble, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]
                        : styles.aiBubble
                ]}>
                    {!isUser && (
                        <View style={styles.aiMessageHeader}>
                            <View style={[styles.aiMessageDot, { backgroundColor: theme.colors.primary.DEFAULT }]} />
                            <Text style={[styles.aiMessageLabel, { color: theme.colors.text.muted }]}>ORVELIS</Text>
                        </View>
                    )}
                    <Text style={[
                        styles.messageText,
                        { color: isUser ? theme.colors.text.primary : theme.colors.text.secondary }
                    ]}>{item.content}</Text>
                </View>
            </Animated.View>
        );
    };

    const getPlaceholder = () => {
        switch (selectedTool) {
            case 'insight': return "Ask about your insight...";
            case 'analyze': return "Ask about the analysis...";
            default: return "Ask Orvelis anything...";
        }
    };

    const starterActions = [
        { icon: 'play-circle' as const, title: 'Analyze a video', subtitle: 'Go beyond the clip', prompt: 'Help me analyze a video. What should I look for?' },
        { icon: 'shield' as const, title: 'Check a claim', subtitle: 'Evidence over opinion', prompt: 'Help me fact-check a claim and evaluate the evidence.' },
        { icon: 'zap' as const, title: 'Explore an idea', subtitle: 'Understand it deeply', prompt: 'Help me explore an interesting idea in depth.' },
        { icon: 'message-circle' as const, title: 'Challenge my thinking', subtitle: 'Another perspective', prompt: 'Challenge my assumptions and offer a different perspective.' },
    ];
    const startPrompt = (prompt: string) => {
        setInputText(prompt);
        setSelectedTool('chat');
    };
    const startNewChat = () => {
        setMessages([]);
        setInputText('');
        setShowSuggestions(true);
        setShowHistory(false);
        setSelectedTool('chat');
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View style={fresh.header}>
                    <View style={fresh.brand}>
                        <View style={fresh.brandIcon}><MaterialCommunityIcons name="brain" size={24} color="#4C76C7" /></View>
                        <View>
                            <Text style={fresh.brandName}>orvelis</Text>
                            <Text style={fresh.brandCaption}>by Datariot</Text>
                        </View>
                    </View>
                    <View style={fresh.headerActions}>
                        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Conversation history" onPress={() => setShowHistory(true)} style={fresh.iconButton}><Feather name="clock" size={22} color="#161B26" /></TouchableOpacity>
                        <TouchableOpacity accessibilityRole="button" accessibilityLabel="New conversation" onPress={startNewChat} style={fresh.iconButton}><Feather name="edit" size={22} color="#161B26" /></TouchableOpacity>
                    </View>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={fresh.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={messages.length === 0 ? (
                        <View style={fresh.welcome}>
                            <View style={fresh.orb}><MaterialCommunityIcons name="brain" size={48} color="#83A6EA" /></View>
                            <Text style={fresh.welcomeTitle}>What are we exploring?</Text>
                            <Text style={fresh.welcomeSubtitle}>Ask a question. Challenge an idea. Go deeper.</Text>
                            <Text style={fresh.sectionLabel}>START WITH AN IDEA</Text>
                            <View style={fresh.starterGrid}>
                                {starterActions.map(action => (
                                    <TouchableOpacity key={action.title} onPress={() => startPrompt(action.prompt)} style={fresh.starterCard} accessibilityRole="button">
                                        <Feather name={action.icon} size={23} color="#7399DD" />
                                        <Text style={fresh.starterTitle}>{action.title}</Text>
                                        <Text style={fresh.starterSubtitle}>{action.subtitle}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ) : null}
                    ListFooterComponent={loading ? <TypingIndicator /> : null}
                />

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={fresh.composerArea}>
                    <View style={fresh.composer}>
                        <TextInput
                            style={fresh.textInput}
                            placeholder="Ask Orvelis anything..."
                            placeholderTextColor="#8B93A3"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={4000}
                            accessibilityLabel="Message Orvelis"
                        />
                        <View style={fresh.composerActions}>
                            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose analysis mode" onPress={() => setSelectedTool(selectedTool === 'chat' ? 'analyze' : 'chat')} style={fresh.modeButton}>
                                <Feather name="sliders" size={16} color="#2A3447" />
                                <Text style={fresh.modeText}>{selectedTool === 'chat' ? 'Deep Think' : 'Analyze'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSendMessage} disabled={!inputText.trim() || loading} accessibilityRole="button" accessibilityLabel="Send message" style={[fresh.sendButton, (!inputText.trim() || loading) && { opacity: 0.5 }]}>
                                <Feather name="arrow-up" size={22} color="#18243A" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
                <Modal visible={showHistory} transparent animationType="fade" onRequestClose={() => setShowHistory(false)}>
                    <Pressable style={fresh.modalBackdrop} onPress={() => setShowHistory(false)}>
                        <View style={fresh.historySheet}>
                            <Text style={fresh.historyTitle}>Conversation</Text>
                            <Text style={fresh.historyText}>Your current conversation is available here. Saved chat history is not yet supported.</Text>
                            <TouchableOpacity onPress={startNewChat} style={fresh.newChatButton}><Text style={fresh.newChatText}>Start new chat</Text></TouchableOpacity>
                        </View>
                    </Pressable>
                </Modal>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    // ===== HEADER =====
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 8 : 16,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    headerGlow: {
        position: 'absolute',
        top: -40,
        left: '30%',
        width: 200,
        height: 120,
        borderRadius: 100,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginTop: 1,
        textTransform: 'uppercase',
    },
    headerStatusWrapper: {
        width: 14,
        height: 14,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginRight: 4,
    },
    headerStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        zIndex: 2,
    },
    // ===== INTRO CARD =====
    introCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 24,
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
    },
    introHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    introIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    introHeaderText: {
        flex: 1,
    },
    introTitle: {
        fontSize: 12,
        letterSpacing: 2,
    },
    introSubtitle: {
        fontSize: 8,
        letterSpacing: 1.5,
        marginTop: 3,
    },
    introDesc: {
        fontSize: 13,
        lineHeight: 20,
        letterSpacing: 0.2,
    },
    introDivider: {
        height: 1,
        marginVertical: 18,
    },
    introMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    introMetaCol: {
        flex: 1,
    },
    introMetaLabel: {
        fontSize: 8,
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    introMetaVal: {
        fontSize: 10,
        letterSpacing: 0.5,
    },
    // ===== CHAT LIST =====
    chatList: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 16,
    },
    messageBubble: {
        padding: 14,
        borderRadius: 20,
        marginBottom: 12,
        maxWidth: '88%',
    },
    userBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 6,
    },
    aiBubble: {
        backgroundColor: 'transparent',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 6,
        paddingHorizontal: 4,
    },
    aiMessageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    aiMessageDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    aiMessageLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    cardBubble: {
        width: '95%',
        maxWidth: '100%',
        borderWidth: 1,
        borderRadius: 20,
        padding: 20,
        overflow: 'hidden',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    // ===== KEYBOARD AREA =====
    keyboardArea: {
        width: '100%',
    },
    // ===== TYPING INDICATOR =====
    typingContainer: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    typingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    typingDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: 'rgba(56, 189, 248, 0.8)',
        marginHorizontal: 2,
    },
    // ===== TOOL SELECTOR =====
    toolSelector: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    toolButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.04)',
        gap: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    toolButtonActive: {
        // Dynamic styles applied inline
    },
    toolText: {
        color: 'rgba(255, 255, 255, 0.45)',
        fontSize: 13,
        fontWeight: '600',
    },
    // ===== INPUT =====
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
        gap: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    inputWrapper: {
        flex: 1,
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
    },
    input: {
        paddingHorizontal: 18,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        fontSize: 15,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ===== CARD STYLES =====
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    cardHeaderIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
    },
    insightScore: {
        fontSize: 56,
        fontWeight: '800',
        marginBottom: 2,
        letterSpacing: -2,
    },
    insightStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    insightStatus: {
        fontSize: 16,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    trendText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '700',
    },
    cardText: {
        fontSize: 14,
        lineHeight: 21,
    },
    analysisSection: {
        marginBottom: 14,
    },
    analysisLabelBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginBottom: 6,
    },
    analysisLabel: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    // ===== SUGGESTION CHIPS =====
    suggestionsContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    suggestionsTitle: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 10,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    suggestionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 18,
        borderWidth: 1,
        gap: 12,
        width: '48%',
        // @ts-ignore
        transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
    },
    suggestionIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        // @ts-ignore
        transition: 'all 0.2s ease',
    },
    suggestionTextWrap: {
        flex: 1,
    },
    suggestionText: {
        fontSize: 13,
        fontWeight: '700',
    },
    suggestionDesc: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 1,
    },
});

const fresh = StyleSheet.create({
    header: { height: 76, paddingHorizontal: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    brandIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#F1F5FF', alignItems: 'center', justifyContent: 'center' },
    brandName: { fontSize: 27, fontWeight: '700', letterSpacing: -1.1, color: '#111827' },
    brandCaption: { fontSize: 11, color: '#8B93A3', marginTop: -2 },
    headerActions: { flexDirection: 'row', gap: 9 },
    iconButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#EDF0F5', alignItems: 'center', justifyContent: 'center' },
    listContent: { paddingHorizontal: 22, paddingBottom: 30, flexGrow: 1 },
    welcome: { flex: 1, justifyContent: 'center', paddingTop: 36, paddingBottom: 16 },
    orb: { alignSelf: 'center', width: 116, height: 116, borderRadius: 58, backgroundColor: '#F1F5FF', borderWidth: 1, borderColor: '#D9E4FF', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
    welcomeTitle: { textAlign: 'center', fontSize: 27, fontWeight: '800', letterSpacing: -0.9, color: '#121827' },
    welcomeSubtitle: { textAlign: 'center', fontSize: 14, color: '#727B8B', marginTop: 10, marginBottom: 38 },
    sectionLabel: { color: '#8790A0', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 14 },
    starterGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
    starterCard: { width: '48%', minHeight: 120, borderWidth: 1, borderColor: '#E6EBF5', backgroundColor: '#FAFBFF', borderRadius: 19, padding: 15, justifyContent: 'space-between' },
    starterTitle: { fontSize: 14, fontWeight: '700', color: '#192033', marginTop: 11 },
    starterSubtitle: { fontSize: 11, color: '#858E9E', marginTop: 3 },
    composerArea: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, backgroundColor: '#FFFFFF' },
    composer: { borderRadius: 25, borderWidth: 1, borderColor: '#DDE5F5', backgroundColor: '#FFFFFF', padding: 13, shadowColor: '#182C5B', shadowOpacity: 0.06, shadowRadius: 14, elevation: 2 },
    textInput: { color: '#161B26', fontSize: 16, minHeight: 45, maxHeight: 120, textAlignVertical: 'top', padding: 7 },
    composerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modeButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#F3F6FC', borderRadius: 22, paddingHorizontal: 13, paddingVertical: 10 },
    modeText: { color: '#2A3447', fontSize: 12, fontWeight: '600' },
    sendButton: { backgroundColor: '#D9E4FF', width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
    historySheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 50 },
    historyTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
    historyText: { fontSize: 14, color: '#6B7280', lineHeight: 21, marginTop: 12, marginBottom: 24 },
    newChatButton: { backgroundColor: '#D9E4FF', padding: 16, borderRadius: 15, alignItems: 'center' },
    newChatText: { color: '#17243C', fontWeight: '700' },
});
