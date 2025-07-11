import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const DashboardPage: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lullababy</Text>
        <Ionicons name="close" size={24} color="#333" />
      </View>

      {/* Baby Info Section */}
      <View style={styles.infoRow}>
        <View style={styles.photoBox}>
          <Ionicons name="close" size={28} color="#bbb" />
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>2 mos, 3 days</Text>
          <Text style={styles.infoText}>12 kg</Text>
          <Text style={styles.infoText}>65 cm</Text>
          <TouchableOpacity style={styles.editIcon}>
            <Ionicons name="create-outline" size={16} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar / Timeline */}
      <TouchableOpacity style={styles.fullButton}>
        <Text style={styles.fullButtonText}>Calendar / Timeline</Text>
      </TouchableOpacity>

      {/* Tips & Journal */}
      <View style={styles.rowButtons}>
        <TouchableOpacity style={styles.smallButton}>
          <Text style={styles.smallButtonText}>Tips & Tricks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallButton}>
          <Text style={styles.smallButtonText}>Journal Notes</Text>
        </TouchableOpacity>
      </View>

      {/* AI Button */}
      <TouchableOpacity style={styles.aiButton}>
        <Text style={styles.aiText}>AI</Text>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home-outline" size={24} color="#333" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar-outline" size={24} color="#333" />
          <Text style={styles.navText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#333" />
          <Text style={styles.navText}>Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFCF6",
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  photoBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    width: "45%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    width: "45%",
    padding: 16,
    justifyContent: "center",
    alignItems: "flex-start",
    position: "relative",
  },
  infoText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222",
    marginBottom: 6,
  },
  editIcon: {
    position: "absolute",
    bottom: 8,
    right: 8,
  },
  fullButton: {
    backgroundColor: "#FFF0E0",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  fullButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  rowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  smallButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "48%",
    alignItems: "center",
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  aiButton: {
    backgroundColor: "#F5F5F5",
    width: 70,
    height: 70,
    borderRadius: 35,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  aiText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    color: "#333",
    marginTop: 4,
  },
});

export default DashboardPage;
