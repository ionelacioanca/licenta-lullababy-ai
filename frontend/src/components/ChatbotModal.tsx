import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, View, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { sendChatMessage } from '../services/chatbotService';
import { Colors } from '../../constants/Colors';

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

const INITIAL_SUGGESTIONS = [
  'Baby crying a lot',
  'Sleep routine help',
  'Signs of fever',
  'Teething pain tips',
];

export const ChatbotModal: React.FC<ChatbotModalProps> = ({ visible, onClose }) => {
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
          text: 'Hi! I am BabyCareBuddy. Ask me anything about sleep, crying, fever, teething or emotional support.',
          ts: Date.now(),
        },
      ]);
    }
  }, [visible]);

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
    <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.botBubble]}>
      <ThemedText style={styles.bubbleText}>{item.text}</ThemedText>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>BabyCareBuddy</ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <ThemedText style={styles.closeText}>×</ThemedText>
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
                <TouchableOpacity key={s} style={styles.suggestion} onPress={() => pickSuggestion(s)}>
                  <ThemedText style={styles.suggestionText}>{s}</ThemedText>
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
              <ActivityIndicator color={Colors.light.tint} />
              <ThemedText style={styles.loadingText}>Thinking…</ThemedText>
            </View>
          )}
          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ask something about your baby…"
              value={input}
              onChangeText={setInput}
              placeholderTextColor="#999"
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} disabled={!input.trim() || loading} onPress={send}>
              <ThemedText style={styles.sendText}>{loading ? '...' : 'Send'}</ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#FFFDF9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#FFE9D6',
    borderBottomWidth: 1,
    borderBottomColor: '#F5D5BE',
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
    backgroundColor: '#0a7ea4',
    marginLeft: 'auto',
  },
  botBubble: {
    backgroundColor: '#FFD9B5',
    marginRight: 'auto',
  },
  bubbleText: { color: '#222' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  loadingText: { marginLeft: 8 },
  error: { color: 'red', paddingHorizontal: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: '#FFE9D6',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5D5BE',
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
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { color: 'white', fontWeight: '600' },
  suggestionsWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginTop: 12 },
  suggestion: { backgroundColor: '#FFE1C4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  suggestionText: { fontSize: 12 },
});

export default ChatbotModal;
