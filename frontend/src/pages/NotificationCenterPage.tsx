import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { growthNotificationService, GrowthNotification } from '../services/growthNotificationService';
import { useLanguage } from '../contexts/LanguageContext';

const NotificationCenterPage: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<GrowthNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [showUnreadOnly]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await growthNotificationService.getUserNotifications(!showUnreadOnly);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [showUnreadOnly]);

  const handleNotificationPress = async (notification: GrowthNotification) => {
    try {
      // Mark as read if not already read
      if (!notification.read) {
        await growthNotificationService.markAsRead(notification._id);
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Navigate to growth tracking for this baby
      await AsyncStorage.setItem('selectedBabyId', notification.babyId._id);
      router.push('/childProfile');
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const handleMarkAsCompleted = async (notificationId: string) => {
    try {
      await growthNotificationService.markAsCompleted(notificationId);
      Alert.alert('Success', 'Notification marked as completed. Next reminder scheduled!');
      loadNotifications();
    } catch (error) {
      console.error('Error marking as completed:', error);
      Alert.alert('Error', 'Failed to mark as completed');
    }
  };

  const handleDismiss = async (notificationId: string) => {
    Alert.alert(
      'Dismiss Notification',
      'Are you sure you want to dismiss this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: async () => {
            try {
              await growthNotificationService.dismissNotification(notificationId);
              loadNotifications();
            } catch (error) {
              console.error('Error dismissing notification:', error);
              Alert.alert('Error', 'Failed to dismiss notification');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'dismissed': return '#9E9E9E';
      case 'sent': return '#FF9800';
      case 'pending': return '#2196F3';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'dismissed': return 'close-circle';
      case 'sent': return 'notifications';
      case 'pending': return 'time';
      default: return 'notifications-outline';
    }
  };

  const renderNotificationItem = ({ item }: { item: GrowthNotification }) => {
    const isUnread = !item.read;
    const canTakeAction = item.status === 'sent' || item.status === 'pending';

    return (
      <TouchableOpacity
        style={[styles.notificationCard, isUnread && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        {/* Baby Avatar */}
        <View style={[styles.avatar, { backgroundColor: item.babyId.avatarColor || '#00CFFF' }]}>
          <Text style={styles.avatarText}>
            {item.babyId.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Notification Content */}
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.statusBadge}>
              <Ionicons 
                name={getStatusIcon(item.status) as any} 
                size={12} 
                color={getStatusColor(item.status)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {formatDate(item.scheduledDate)}
            </Text>
          </View>

          {/* Action Buttons */}
          {canTakeAction && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleMarkAsCompleted(item._id);
                }}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Record Measurement</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.dismissButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDismiss(item._id);
                }}
              >
                <Ionicons name="close" size={16} color="#666" />
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowUnreadOnly(!showUnreadOnly)}
        >
          <Ionicons
            name={showUnreadOnly ? 'filter' : 'filter-outline'}
            size={24}
            color="#00CFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="notifications" size={20} color="#FF9800" />
          <Text style={styles.unreadBannerText}>
            You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00CFFF']} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              {showUnreadOnly
                ? 'You have no unread notifications'
                : 'Notifications will appear here'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  filterButton: {
    padding: 8,
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  unreadBannerText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#00CFFF',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00CFFF',
    marginLeft: 8,
  },
  body: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    flex: 1,
  },
  completeButton: {
    backgroundColor: '#00CFFF',
  },
  dismissButton: {
    backgroundColor: '#f0f0f0',
    flex: 0.6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  dismissButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});

export default NotificationCenterPage;
