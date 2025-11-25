import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getPendingLinkRequests,
  acceptLinkRequest,
  declineLinkRequest,
  LinkRequest,
} from '../services/linkRequestService';

interface LinkRequestNotificationsProps {
  visible: boolean;
  onClose: () => void;
  onRequestProcessed?: () => void;
}

export default function LinkRequestNotifications({
  visible,
  onClose,
  onRequestProcessed,
}: LinkRequestNotificationsProps) {
  const [requests, setRequests] = useState<LinkRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadRequests();
    }
  }, [visible]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getPendingLinkRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading link requests:', error);
      Alert.alert('Error', 'Failed to load link requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string, requesterName: string) => {
    Alert.alert(
      'Accept Link Request',
      `Accept link request from ${requesterName}? They will be able to view and manage your baby's information.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setProcessing(requestId);
            try {
              await acceptLinkRequest(requestId);
              Alert.alert('Success', `${requesterName} is now linked to your account`);
              loadRequests();
              onRequestProcessed?.();
            } catch (error) {
              console.error('Error accepting request:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to accept request');
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const handleDecline = async (requestId: string, requesterName: string) => {
    Alert.alert(
      'Decline Link Request',
      `Decline link request from ${requesterName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessing(requestId);
            try {
              await declineLinkRequest(requestId);
              Alert.alert('Success', 'Link request declined');
              loadRequests();
              onRequestProcessed?.();
            } catch (error) {
              console.error('Error declining request:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to decline request');
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Link Requests</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#A2E884" />
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No pending link requests</Text>
            </View>
          ) : (
            <ScrollView style={styles.requestsList}>
              {requests.map((request) => (
                <View key={request._id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="person-outline" size={24} color="#A2E884" />
                    </View>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requesterName}>{request.requesterName}</Text>
                      <Text style={styles.requesterRole}>{request.requesterRole}</Text>
                      <Text style={styles.requestTime}>{formatDate(request.createdAt)}</Text>
                    </View>
                  </View>

                  {request.message && (
                    <View style={styles.messageContainer}>
                      <Text style={styles.messageLabel}>Message:</Text>
                      <Text style={styles.messageText}>{request.message}</Text>
                    </View>
                  )}

                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={[styles.button, styles.declineButton]}
                      onPress={() => handleDecline(request._id, request.requesterName)}
                      disabled={processing === request._id}
                    >
                      {processing === request._id ? (
                        <ActivityIndicator size="small" color="#FF6B6B" />
                      ) : (
                        <>
                          <Ionicons name="close-circle-outline" size={20} color="#FF6B6B" />
                          <Text style={styles.declineButtonText}>Decline</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, styles.acceptButton]}
                      onPress={() => handleAccept(request._id, request.requesterName)}
                      disabled={processing === request._id}
                    >
                      {processing === request._id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                          <Text style={styles.acceptButtonText}>Accept</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF8F0',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  requestsList: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FFF0',
    borderWidth: 2,
    borderColor: '#A2E884',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requesterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  requesterRole: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  requestTime: {
    fontSize: 12,
    color: '#999',
  },
  messageContainer: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  messageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#A2E884',
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  declineButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
});
