import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, View, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { sendChatMessage } from '../services/chatbotService';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const TypingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);
  }, []);

  const dotStyle = (dot: Animated.Value) => ({
    opacity: dot,
    transform: [
      {
        translateY: dot.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
    ],
  });

  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
      <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
      <Animated.View style={[styles.typingDot, dotStyle(dot3)]} />
    </View>
  );
};

interface ChatbotModalProps {
  visible: boolean;
  onClose: () => void;
}

interface MessageItem {
  id: string;
  role: 'user' | 'bot';
  text: string;
  ts: number;
}

export const ChatbotModal: React.FC<ChatbotModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const INITIAL_SUGGESTIONS = [
    t('chat.suggestion1'),
    t('chat.suggestion2'),
    t('chat.suggestion3'),
    t('chat.suggestion4'),
  ];
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<MessageItem>>(null);

  useEffect(() => {
    if (visible && messages.length === 0) {
      // Welcome message
      setMessages([
        {
          id: 'welcome',
          role: 'bot',
          text: t('chat.welcome'),
          ts: Date.now(),
        },
      ]);
    }
  }, [visible, t]);

  const scrollToEnd = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  useEffect(scrollToEnd, [messages]);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setError(null);

    const userMsg: MessageItem = { id: `u-${Date.now()}`, role: 'user', text: userText, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    scrollToEnd();

    setLoading(true);
    const reply = await sendChatMessage(userText);
    setLoading(false);

    const botMsg: MessageItem = { id: `b-${Date.now()}`, role: 'bot', text: reply, ts: Date.now() };
    setMessages((prev) => [...prev, botMsg].slice(-30)); // keep last 30
  }, [input, loading]);

  const pickSuggestion = (s: string) => {
    setInput(s);
  };

  const renderItem = ({ item }: { item: MessageItem }) => (
    <View style={[styles.bubble, item.role === 'user' ? { backgroundColor: theme.userBubble } : { backgroundColor: theme.otherBubble }]}>
      <ThemedText style={[styles.bubbleText, { color: theme.text }]}>{item.text}</ThemedText>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <ThemedText type="title" style={[styles.headerTitle, { color: theme.text }]}>{t('chat.title')}</ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <ThemedText style={[styles.closeText, { color: theme.text }]}>×</ThemedText>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          style={styles.flex} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {messages.length === 1 && (
            <View style={styles.suggestionsWrap}>
              {INITIAL_SUGGESTIONS.map((s) => (
                <TouchableOpacity key={s} style={[styles.suggestion, { backgroundColor: theme.primaryLight }]} onPress={() => pickSuggestion(s)}>
                  <ThemedText style={[styles.suggestionText, { color: theme.text }]}>{s}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
          />

          {loading && (
            <View style={styles.loadingRow}>
              <View style={[styles.typingContainer, { backgroundColor: theme.otherBubble }]}>
                <View style={[styles.typingDot, { backgroundColor: theme.primary }]} />
                <View style={[styles.typingDot, { backgroundColor: theme.primary }]} />
                <View style={[styles.typingDot, { backgroundColor: theme.primary }]} />
              </View>
            </View>
          )}
          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          <View style={[styles.inputRow, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
              placeholder={t('chat.placeholder')}
              value={input}
              onChangeText={setInput}
              placeholderTextColor={theme.textTertiary}
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.primary }, !input.trim() && styles.sendBtnDisabled]} disabled={!input.trim() || loading} onPress={send}>
              <ThemedText style={styles.sendText}>{loading ? '...' : t('chat.send')}</ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#FFF8F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
  },
  headerTitle: { fontSize: 22 },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 28, fontWeight: '600' },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 20 },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#D4F1C5',
    marginLeft: 'auto',
  },
  botBubble: {
    backgroundColor: '#FFF3E0',
    marginRight: 'auto',
  },
  bubbleText: { color: '#333' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    maxWidth: 60,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A2E884',
  },
  error: { color: 'red', paddingHorizontal: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: '#FFF8F0',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E0D5',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 16,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: '#A2E884',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { color: 'white', fontWeight: '600' },
  suggestionsWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginTop: 12 },
  suggestion: { backgroundColor: '#E8F5E0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  suggestionText: { fontSize: 12 },
});

export default ChatbotModal;
