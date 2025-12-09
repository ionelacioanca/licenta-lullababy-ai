import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Switch,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import AccountSettingsModal from "./AccountSettingsModal";
import AboutModal from "./AboutModal";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onRequestLink?: () => void;
  userRole?: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose, onRequestLink, userRole }) => {
  const router = useRouter();
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { theme, isDark, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
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
              await AsyncStorage.removeItem("userEmail");
              await AsyncStorage.removeItem("userRole");
              await AsyncStorage.removeItem("profilePicture");
              
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
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>{t('settings.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: theme.surface }]}
              onPress={() => setAccountSettingsOpen(true)}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="person-outline" size={24} color={theme.textSecondary} />
              </View>
              <Text style={[styles.settingText, { color: theme.text }]}>{t('settings.account')}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>

            {/* Show "Request Parent Link" only for nanny and others */}
            {userRole && userRole !== 'mother' && userRole !== 'father' && onRequestLink && (
              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: theme.surface }]}
                onPress={() => {
                  onClose();
                  onRequestLink();
                }}
              >
                <View style={styles.settingIconContainer}>
                  <Ionicons name="link-outline" size={24} color={theme.primary} />
                </View>
                <Text style={[styles.settingText, { color: theme.text }]}>{t('settings.requestParentLink')}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            )}

            {/* Show "Link Requests" only for parents */}
            {userRole && (userRole === 'mother' || userRole === 'father') && onRequestLink && (
              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: theme.surface }]}
                onPress={() => {
                  onClose();
                  onRequestLink();
                }}
              >
                <View style={styles.settingIconContainer}>
                  <Ionicons name="notifications-outline" size={24} color={theme.primary} />
                </View>
                <Text style={[styles.settingText, { color: theme.text }]}>Link Requests</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            )}

            <View style={[styles.settingItem, { backgroundColor: theme.surface }]}>
              <View style={styles.settingIconContainer}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={24} color={theme.primary} />
              </View>
              <Text style={[styles.settingText, { color: theme.text }]}>{t('settings.theme')}</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "#E0E0E0", true: "#A2E884" }}
                thumbColor={isDark ? "#FFF" : "#FFF"}
              />
            </View>

            <TouchableOpacity 
              style={[styles.settingItem, { backgroundColor: theme.surface }]}
              onPress={() => setLanguage(language === 'en' ? 'ro' : 'en')}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="language" size={24} color={theme.primary} />
              </View>
              <Text style={[styles.settingText, { color: theme.text }]}>{t('settings.language')}</Text>
              <Text style={[styles.languageValue, { color: theme.textSecondary }]}>
                {language === 'en' ? 'English 🇬🇧' : 'Română 🇷🇴'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.surface }]}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="lock-closed-outline" size={24} color={theme.textSecondary} />
              </View>
              <Text style={[styles.settingText, { color: theme.text }]}>{t('settings.privacySecurity')}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.surface }]}>
              <View style={styles.settingIconContainer}>
                <Ionicons name="help-circle-outline" size={24} color={theme.textSecondary} />
              </View>
              <Text style={[styles.settingText, { color: theme.text }]}>{t('settings.helpSupport')}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, { backgroundColor: theme.surface }]}
              onPress={() => setAboutOpen(true)}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons name="information-circle-outline" size={24} color={theme.textSecondary} />
              </View>
              <Text style={[styles.settingText, { color: theme.text }]}>{t('settings.about')}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <TouchableOpacity
              style={[styles.settingItem, styles.logoutItem, { backgroundColor: theme.surface }]}
              onPress={handleLogout}
            >
              <View style={[styles.settingIconContainer, styles.logoutIconContainer]}>
                <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
              </View>
              <Text style={[styles.settingText, styles.logoutText]}>{ t('settings.logout')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <AccountSettingsModal
        visible={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
      />

      <AboutModal
        visible={aboutOpen}
        onClose={() => setAboutOpen(false)}
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
  languageValue: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 8,
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
