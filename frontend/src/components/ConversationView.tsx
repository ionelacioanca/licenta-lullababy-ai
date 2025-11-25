import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getMessagesWithUser,
  sendMessage,
  Message,
} from "../services/messageService";

interface ConversationViewProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onMessageSent?: () => void;
}

export default function ConversationView({
  visible,
  onClose,
  userId,
  userName,
  onMessageSent,
}: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (visible && userId) {
      loadMessages();
    }
  }, [visible, userId]);

  const loadCurrentUser = async () => {
    let userId = await AsyncStorage.getItem("userId");
    if (!userId) {
      userId = await AsyncStorage.getItem("parentId");
    }
    if (userId) {
      console.log("[ConversationView] Current user ID:", userId);
      setCurrentUserId(userId);
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    const result = await getMessagesWithUser(userId);
    if (result.success && result.messages) {
      setMessages(result.messages);
      // Scroll to bottom after loading
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    const result = await sendMessage(userId, messageContent);

    if (result.success && result.data) {
      setMessages((prev) => [...prev, result.data!]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      onMessageSent?.();
    } else {
      setNewMessage(messageContent); // Restore message on error
      alert(result.message || "Failed to send message");
    }

    setSending(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.senderId === currentUserId;
    console.log(`[Message] senderId: ${item.senderId}, currentUserId: ${currentUserId}, isMyMessage: ${isMyMessage}`);
    const showDate =
      index === 0 ||
      new Date(messages[index - 1].createdAt).toDateString() !==
        new Date(item.createdAt).toDateString();

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.theirMessageText,
              ]}
            >
              {item.content}
            </Text>
            <Text
              style={[
                styles.timeText,
                isMyMessage ? styles.myTimeText : styles.theirTimeText,
              ]}
            >
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#444" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.headerTitle}>{userName}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A2E884" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start the conversation with {userName}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#AAA"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#A2E884",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#AAA",
    textAlign: "center",
    marginTop: 8,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: "#999",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: "75%",
  },
  myMessageContainer: {
    alignSelf: "flex-end",
  },
  theirMessageContainer: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: "#D4F1C5",
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: "#FFF3E0",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#333",
  },
  theirMessageText: {
    color: "#333",
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
  },
  myTimeText: {
    color: "#666",
  },
  theirTimeText: {
    color: "#666",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
    maxHeight: 100,
    color: "#444",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#A2E884",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#CCC",
  },
});
