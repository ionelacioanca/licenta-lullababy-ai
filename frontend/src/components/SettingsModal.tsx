import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import AccountSettingsModal from "./AccountSettingsModal";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all stored data
              await AsyncStorage.removeItem("token");
              await AsyncStorage.removeItem("parentId");
              await AsyncStorage.removeItem("parentName");
              await AsyncStorage.removeItem("selectedBabyId");
              
              onClose();
              
              // Navigate to login
              router.replace("/login");
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setAccountSettingsOpen(true)}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="person-outline" size={24} color="#666" />
              </View>
              <Text style={styles.settingText}>Account Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="lock-closed-outline" size={24} color="#666" />
              </View>
              <Text style={styles.settingText}>Privacy & Security</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="help-circle-outline" size={24} color="#666" />
              </View>
              <Text style={styles.settingText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="information-circle-outline" size={24} color="#666" />
              </View>
              <Text style={styles.settingText}>About</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={[styles.settingItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <View style={[styles.settingIconContainer, styles.logoutIconContainer]}>
                <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
              </View>
              <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <AccountSettingsModal
        visible={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  closeButton: {
    position: "absolute",
    right: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  logoutItem: {
    backgroundColor: "#FFF0F0",
  },
  logoutIconContainer: {
    backgroundColor: "#FFE5E5",
  },
  logoutText: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
});

export default SettingsModal;
