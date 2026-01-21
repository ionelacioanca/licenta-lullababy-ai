import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getSleepEventsByDateRange, SleepEvent } from "../services/sleepEventService";

type SleepHistoryModalProps = {
  visible: boolean;
  onClose: () => void;
};

interface SleepHistoryEntry {
  date: string;
  day: string;
  sleepTime: string;
  wakeTime: string;
  duration: string;
  rawDate: Date;
}

const SleepHistoryModal: React.FC<SleepHistoryModalProps> = ({
  visible,
  onClose,
}) => {
  const [sleepHistory, setSleepHistory] = useState<SleepHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSleepHistory();
    }
  }, [visible]);

  const loadSleepHistory = async () => {
    setLoading(true);
    try {
      const deviceId = "lullababypi_01";
      
      // Get last 7 days - use UTC time to avoid timezone issues
      const now = Date.now(); // Current time in milliseconds since epoch
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
      
      const startISO = new Date(sevenDaysAgo).toISOString();
      const endISO = new Date(now + (24 * 60 * 60 * 1000)).toISOString(); // Add 1 day buffer to include today's events
      
      console.log("Fetching sleep events from:", startISO, "to:", endISO);
      
      const events = await getSleepEventsByDateRange(
        deviceId,
        startISO,
        endISO
      );
      
      console.log("Sleep events fetched:", events.length, events);
      
      // Filter only completed sleep sessions
      const completedSessions = events.filter(
        (event: SleepEvent) => 
          (event.status === "Somn Incheiat" || event.status === "Finalizat") && 
          event.duration_minutes > 0
      );
      
      console.log("Completed sessions:", completedSessions.length, completedSessions);
      
      // Format data for display
      const formattedHistory: SleepHistoryEntry[] = completedSessions.map((event: SleepEvent) => {
        const startDate = new Date(event.start_time);
        const endDate = new Date(event.end_time);
        
        return {
          date: getRelativeDate(startDate),
          day: formatDate(startDate),
          sleepTime: formatTime(startDate),
          wakeTime: formatTime(endDate),
          duration: formatDuration(event.duration_minutes),
          rawDate: startDate,
        };
      });
      
      // Sort by date (newest first)
      formattedHistory.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
      
      setSleepHistory(formattedHistory);
    } catch (error) {
      console.error("Error loading sleep history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeDate = (date: Date): string => {
    const today = new Date();
    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    
    const dateUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    
    const diffDays = Math.floor((todayUTC - dateUTC) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getUTCDay()];
    }
  };

  const formatDate = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
  };

  const formatTime = (date: Date): string => {
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="moon" size={24} color="#A2E884" />
              <Text style={styles.title}>Sleep History</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.subtitle}>Last 7 Days</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#A2E884" />
                <Text style={styles.loadingText}>Loading sleep history...</Text>
              </View>
            ) : sleepHistory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="moon-outline" size={64} color="#666" />
                <Text style={styles.emptyText}>No sleep data available</Text>
                <Text style={styles.emptySubtext}>Sleep data will appear here once recorded</Text>
              </View>
            ) : (
              sleepHistory.map((entry, index) => (
                <View key={index} style={styles.historyCard}>
                  <View style={styles.dateSection}>
                    <Text style={styles.dateLabel}>{entry.date}</Text>
                    <Text style={styles.dateValue}>{entry.day}</Text>
                  </View>

                  <View style={styles.detailsSection}>
                    <View style={styles.timeRow}>
                      <View style={styles.timeItem}>
                        <View style={styles.iconCircle}>
                          <Ionicons name="bed-outline" size={16} color="white" />
                        </View>
                        <View>
                          <Text style={styles.timeLabel}>Fell Asleep</Text>
                          <Text style={styles.timeValue}>{entry.sleepTime}</Text>
                        </View>
                      </View>

                      <View style={styles.timeItem}>
                        <View style={styles.iconCircle}>
                          <Ionicons name="sunny-outline" size={16} color="white" />
                        </View>
                        <View>
                          <Text style={styles.timeLabel}>Woke Up</Text>
                          <Text style={styles.timeValue}>{entry.wakeTime}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.durationSection}>
                      <Ionicons name="time-outline" size={18} color="#A2E884" />
                      <Text style={styles.durationLabel}>Duration:</Text>
                      <Text style={styles.durationValue}>{entry.duration}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFF8F0",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dateSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#999",
  },
  detailsSection: {
    gap: 12,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 16,
  },
  timeItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#A2E884",
    justifyContent: "center",
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  durationSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  durationValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6B4FA0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
  },
});

export default SleepHistoryModal;
