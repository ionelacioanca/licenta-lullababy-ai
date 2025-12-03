import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendLinkRequest } from '../services/linkRequestService';
import { useTheme } from '../contexts/ThemeContext';

interface SendLinkRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SendLinkRequestModal({
  visible,
  onClose,
  onSuccess,
}: SendLinkRequestModalProps) {
  const { theme } = useTheme();
  const [parentEmail, setParentEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!parentEmail.trim()) {
      Alert.alert('Error', 'Please enter parent email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await sendLinkRequest(parentEmail.trim(), message.trim() || undefined);
      Alert.alert(
        'Success',
        'Link request sent! The parent will be notified and can accept or decline your request.',
        [
          {
            text: 'OK',
            onPress: () => {
              setParentEmail('');
              setMessage('');
              onClose();
              onSuccess?.();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error sending link request:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send link request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setParentEmail('');
    setMessage('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Request Parent Link</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color={theme.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={[styles.infoBox, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                Send a link request to the parent. They will see a notification in their app and can accept or decline. Once accepted, you'll be able to view and manage their baby's information.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Parent Email Address *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                placeholder="parent@example.com"
                placeholderTextColor={theme.textTertiary}
                value={parentEmail}
                onChangeText={setParentEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Message (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                placeholder="Add a personal message..."
                placeholderTextColor={theme.textTertiary}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
              <Text style={[styles.characterCount, { color: theme.textTertiary }]}>{message.length}/200</Text>
            </View>

            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: theme.primary }, loading && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={20} color="#FFF" />
                  <Text style={styles.sendButtonText}>Send Link Request</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={loading}>
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFF8F0',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FFF0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  sendButton: {
    backgroundColor: '#A2E884',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
