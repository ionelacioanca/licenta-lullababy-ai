import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Alert = {
  _id: string;
  type: 'vital' | 'calendar' | 'system';
  title?: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  calendarEventId?: {
    title: string;
    date: string;
    time?: string;
    type: string;
  };
};

type NotificationsPanelProps = {
  visible: boolean;
  onClose: () => void;
  babyId: string;
  onNotificationCountChange?: (count: number) => void;
};

export default function NotificationsPanel({
  visible,
  onClose,
  babyId,
  onNotificationCountChange,
}: NotificationsPanelProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible && babyId) {
      loadAlerts();
    }
  }, [visible, babyId]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        `http://192.168.1.11:5000/api/alerts/baby/${babyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
        
        // Update unread count
        const unreadCount = data.filter((a: Alert) => !a.isRead).length;
        if (onNotificationCountChange) {
          onNotificationCountChange(unreadCount);
        }
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        `http://192.168.1.11:5000/api/alerts/${alertId}/read`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setAlerts(prev =>
          prev.map(alert =>
            alert._id === alertId ? { ...alert, isRead: true } : alert
          )
        );
        
        // Update unread count
        const unreadCount = alerts.filter(a => !a.isRead && a._id !== alertId).length;
        if (onNotificationCountChange) {
          onNotificationCountChange(unreadCount);
        }
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        `http://192.168.1.11:5000/api/alerts/baby/${babyId}/read-all`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
        if (onNotificationCountChange) {
          onNotificationCountChange(0);
        }
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        `http://192.168.1.11:5000/api/alerts/${alertId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const wasUnread = alerts.find(a => a._id === alertId)?.isRead === false;
        setAlerts(prev => prev.filter(alert => alert._id !== alertId));
        
        if (wasUnread && onNotificationCountChange) {
          const unreadCount = alerts.filter(a => !a.isRead && a._id !== alertId).length;
          onNotificationCountChange(unreadCount);
        }
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'calendar':
        return 'calendar';
      case 'vital':
        return 'heart';
      case 'system':
        return 'information-circle';
      default:
        return 'notifications';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="notifications" size={24} color={theme.primary} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Notifications
              </Text>
            </View>
            <View style={styles.headerRight}>
              {alerts.some(a => !a.isRead) && (
                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                  <Text style={[styles.markAllText, { color: theme.primary }]}>
                    Mark all read
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color={theme.icon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          {loading && alerts.length === 0 ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : alerts.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="notifications-off-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No notifications
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.alertsList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {alerts.map((alert) => (
                <TouchableOpacity
                  key={alert._id}
                  style={[
                    styles.alertItem,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    !alert.isRead && { backgroundColor: theme.surface }
                  ]}
                  onPress={() => !alert.isRead && markAsRead(alert._id)}
                >
                  <View style={styles.alertIconContainer}>
                    <Ionicons
                      name={getAlertIcon(alert.type)}
                      size={24}
                      color={alert.type === 'calendar' ? theme.primary : '#FF6B6B'}
                    />
                  </View>
                  
                  <View style={styles.alertContent}>
                    {alert.title && (
                      <Text style={[styles.alertTitle, { color: theme.text }]}>
                        {alert.title}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.alertMessage,
                        { color: theme.textSecondary }
                      ]}
                      numberOfLines={2}
                    >
                      {alert.message}
                    </Text>
                    <Text style={[styles.alertTime, { color: theme.textSecondary }]}>
                      {formatTimestamp(alert.timestamp)}
                    </Text>
                  </View>

                  {!alert.isRead && (
                    <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                  )}

                  <TouchableOpacity
                    onPress={() => deleteAlert(alert._id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  markAllButton: {
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  alertsList: {
    flex: 1,
  },
  alertItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  alertIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 6,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
});
