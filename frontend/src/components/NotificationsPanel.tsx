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
  Alert as RNAlert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { growthNotificationService, GrowthNotification } from '../services/growthNotificationService';
import { useRouter } from 'expo-router';

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'alerts' | 'growth'>('alerts');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [growthNotifications, setGrowthNotifications] = useState<GrowthNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible && babyId) {
      loadAlerts();
      loadGrowthNotifications();
    }
  }, [visible, babyId]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        `http://192.168.1.21:5000/api/alerts/baby/${babyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
        
        // Update count with fresh data
        const alertsUnread = data.filter((a: Alert) => !a.isRead).length;
        const growthUnread = growthNotifications.filter((g) => !g.read && g.status === 'sent').length;
        const totalUnread = alertsUnread + growthUnread;
        
        if (onNotificationCountChange) {
          onNotificationCountChange(totalUnread);
        }
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadGrowthNotifications = async () => {
    try {
      console.log('📊 Loading growth notifications...');
      const data = await growthNotificationService.getUserNotifications(true);
      console.log('📊 Growth notifications response:', data);
      console.log('📊 Number of notifications:', data.notifications.length);
      setGrowthNotifications(data.notifications);
      
      // Update count immediately with the fresh data
      const alertsUnread = alerts.filter((a: Alert) => !a.isRead).length;
      const growthUnread = data.notifications.filter((g) => !g.read && g.status === 'sent').length;
      const totalUnread = alertsUnread + growthUnread;
      
      if (onNotificationCountChange) {
        onNotificationCountChange(totalUnread);
      }
    } catch (error) {
      console.error('❌ Error loading growth notifications:', error);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        `http://192.168.1.21:5000/api/alerts/${alertId}/read`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setAlerts(prev => {
          const updated = prev.map(alert =>
            alert._id === alertId ? { ...alert, isRead: true } : alert
          );
          
          // Update count with fresh data
          const alertsUnread = updated.filter(a => !a.isRead).length;
          const growthUnread = growthNotifications.filter((g) => !g.read && g.status === 'sent').length;
          const totalUnread = alertsUnread + growthUnread;
          
          if (onNotificationCountChange) {
            onNotificationCountChange(totalUnread);
          }
          
          return updated;
        });
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        `http://192.168.1.21:5000/api/alerts/baby/${babyId}/read-all`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
        
        // Update count - alerts are all read, but growth notifications may still be unread
        const growthUnread = growthNotifications.filter((g) => !g.read && g.status === 'sent').length;
        
        if (onNotificationCountChange) {
          onNotificationCountChange(growthUnread);
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
        `http://192.168.1.21:5000/api/alerts/${alertId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setAlerts(prev => {
          const updated = prev.filter(alert => alert._id !== alertId);
          
          // Update count with fresh data
          const alertsUnread = updated.filter(a => !a.isRead).length;
          const growthUnread = growthNotifications.filter((g) => !g.read && g.status === 'sent').length;
          const totalUnread = alertsUnread + growthUnread;
          
          if (onNotificationCountChange) {
            onNotificationCountChange(totalUnread);
          }
          
          return updated;
        });
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
    if (activeTab === 'alerts') {
      loadAlerts();
    } else {
      loadGrowthNotifications().finally(() => setRefreshing(false));
    }
  };

  // Growth notification handlers
  const handleGrowthNotificationPress = async (notification: GrowthNotification) => {
    try {
      // Mark as read and navigate to growth tracking
      if (!notification.read) {
        await growthNotificationService.markAsRead(notification._id);
        setGrowthNotifications(prev => {
          const updated = prev.map(n => n._id === notification._id ? { ...n, read: true } : n);
          
          // Update count with fresh data
          const alertsUnread = alerts.filter((a: Alert) => !a.isRead).length;
          const growthUnread = updated.filter((g) => !g.read && g.status === 'sent').length;
          const totalUnread = alertsUnread + growthUnread;
          
          if (onNotificationCountChange) {
            onNotificationCountChange(totalUnread);
          }
          
          return updated;
        });
      }
      
      // Set flag to open growth tracking modal on dashboard
      await AsyncStorage.setItem('selectedBabyId', notification.babyId._id);
      await AsyncStorage.setItem('openGrowthTracking', 'true');
      onClose();
      router.push('/dashboard');
    } catch (error) {
      console.error('Error handling growth notification:', error);
    }
  };

  const handleRecordGrowth = async (notification: GrowthNotification) => {
    try {
      // Mark as read (not completed, just read)
      if (!notification.read) {
        await growthNotificationService.markAsRead(notification._id);
      }
      
      // Navigate to growth tracking to record measurement
      await AsyncStorage.setItem('selectedBabyId', notification.babyId._id);
      onClose();
      router.push('/childProfile?tab=growth');
    } catch (error) {
      console.error('Error navigating to growth tracking:', error);
      RNAlert.alert('Error', 'Failed to open growth tracking');
    }
  };

  const handleDismissGrowth = async (notificationId: string, e: any) => {
    e.stopPropagation();
    try {
      await growthNotificationService.dismissNotification(notificationId);
      loadGrowthNotifications();
    } catch (error) {
      console.error('Error dismissing growth notification:', error);
      RNAlert.alert('Error', 'Failed to dismiss notification');
    }
  };

  const formatGrowthDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Future dates
    if (diffDays > 0) {
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays < 7) return `In ${diffDays} days`;
      if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
    
    // Past dates
    const daysPast = Math.abs(diffDays);
    if (daysPast === 0) return 'Today';
    if (daysPast === 1) return 'Yesterday';
    if (daysPast < 7) return `${daysPast} days ago`;
    if (daysPast < 30) return `${Math.floor(daysPast / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
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
              {activeTab === 'alerts' && alerts.some(a => !a.isRead) && (
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

          {/* Tabs */}
          <View style={[styles.tabsContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'alerts' && styles.activeTab,
                activeTab === 'alerts' && { borderBottomColor: theme.primary }
              ]}
              onPress={() => setActiveTab('alerts')}
            >
              <Ionicons 
                name="information-circle-outline" 
                size={20} 
                color={activeTab === 'alerts' ? theme.primary : theme.textSecondary} 
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'alerts' ? theme.primary : theme.textSecondary }
                ]}
              >
                Alerts
              </Text>
              {alerts.filter(a => !a.isRead).length > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.badgeText}>
                    {alerts.filter(a => !a.isRead).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'growth' && styles.activeTab,
                activeTab === 'growth' && { borderBottomColor: theme.primary }
              ]}
              onPress={() => setActiveTab('growth')}
            >
              <Ionicons 
                name="trending-up" 
                size={20} 
                color={activeTab === 'growth' ? theme.primary : theme.textSecondary} 
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'growth' ? theme.primary : theme.textSecondary }
                ]}
              >
                Growth
              </Text>
              {growthNotifications.filter(g => !g.read && g.status === 'sent').length > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.badgeText}>
                    {growthNotifications.filter(g => !g.read && g.status === 'sent').length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Content */}
          {activeTab === 'alerts' ? (
            // Alerts Tab
            loading && alerts.length === 0 ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : alerts.length === 0 ? (
              <View style={styles.centered}>
                <Ionicons name="notifications-off-outline" size={64} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No alerts
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
          )
        ) : (
          // Growth Tab
          loading && growthNotifications.length === 0 ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : growthNotifications.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="trending-up-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No growth reminders
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.alertsList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {growthNotifications.map((notification) => {
                const isUnread = !notification.read;
                const canTakeAction = notification.status === 'sent' || notification.status === 'pending';

                return (
                  <TouchableOpacity
                    key={notification._id}
                    style={[
                      styles.alertItem,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      isUnread && { backgroundColor: theme.surface, borderLeftWidth: 4, borderLeftColor: theme.primary }
                    ]}
                    onPress={() => handleGrowthNotificationPress(notification)}
                  >
                    {/* Baby Avatar */}
                    <View style={[styles.growthAvatar, { backgroundColor: notification.babyId.avatarColor || theme.primary }]}>
                      <Text style={styles.growthAvatarText}>
                        {notification.babyId.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    {/* Content */}
                    <View style={styles.alertContent}>
                      <Text style={[styles.alertTitle, { color: theme.text }]}>
                        {notification.title}
                      </Text>
                      <Text
                        style={[styles.alertMessage, { color: theme.textSecondary }]}
                      >
                        {notification.body}
                      </Text>
                      
                      <Text style={[styles.alertTime, { color: theme.textSecondary, marginTop: 4 }]}>
                        {formatGrowthDate(notification.scheduledDate)}
                      </Text>
                    </View>

                    {/* Delete icon */}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(e) => handleDismissGrowth(notification._id, e)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>

                    {isUnread && (
                      <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00CFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  growthAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  growthAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
