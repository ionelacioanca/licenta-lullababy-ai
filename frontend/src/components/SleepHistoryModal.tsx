import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type SleepHistoryModalProps = {
  visible: boolean;
  onClose: () => void;
};

// Mock data for a week of sleep history
const sleepHistory = [
  {
    date: "Today",
    day: "Nov 17",
    sleepTime: "14:30 PM",
    wakeTime: "16:15 PM",
    duration: "1h 45m",
  },
  {
    date: "Yesterday",
    day: "Nov 16",
    sleepTime: "13:00 PM",
    wakeTime: "15:30 PM",
    duration: "2h 30m",
  },
  {
    date: "Friday",
    day: "Nov 15",
    sleepTime: "14:00 PM",
    wakeTime: "16:00 PM",
    duration: "2h 0m",
  },
  {
    date: "Thursday",
    day: "Nov 14",
    sleepTime: "12:30 PM",
    wakeTime: "14:45 PM",
    duration: "2h 15m",
  },
  {
    date: "Wednesday",
    day: "Nov 13",
    sleepTime: "13:15 PM",
    wakeTime: "15:00 PM",
    duration: "1h 45m",
  },
  {
    date: "Tuesday",
    day: "Nov 12",
    sleepTime: "14:45 PM",
    wakeTime: "17:00 PM",
    duration: "2h 15m",
  },
  {
    date: "Monday",
    day: "Nov 11",
    sleepTime: "13:30 PM",
    wakeTime: "16:15 PM",
    duration: "2h 45m",
  },
];

const SleepHistoryModal: React.FC<SleepHistoryModalProps> = ({
  visible,
  onClose,
}) => {
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

            {sleepHistory.map((entry, index) => (
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
            ))}
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
});

export default SleepHistoryModal;
