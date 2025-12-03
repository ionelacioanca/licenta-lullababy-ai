import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

type HeaderProps = {
  childInitial: string;
  babyName: string;
  avatarColor?: string;
  avatarImage?: string | null;
  onEditProfile: () => void;
  onNotifications: () => void;
  onMessages: () => void;
  unreadNotifications?: number;
  unreadMessages?: number;
};

export default function Header({ childInitial,  babyName, avatarColor = "#00CFFF", avatarImage, onEditProfile, onNotifications, onMessages, unreadNotifications = 0, unreadMessages = 0 }: HeaderProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.leftContainer}>
            <TouchableOpacity style={[styles.avatar, { backgroundColor: avatarColor }]} onPress={onEditProfile}>
                {avatarImage ? (
                  <Image source={{ uri: avatarImage }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{childInitial}</Text>
                )}
            </TouchableOpacity>
            <Text style={[styles.nameText, { color: theme.text }]}>{babyName}</Text>
        </View>

      <Text style={[styles.appName, { color: theme.primary }]}>lullababy</Text>

      {/* Right side: Notifications & Messages */}
      <View style={styles.rightContainer}>
        {/* Notifications Bell */}
        <TouchableOpacity style={styles.iconContainer} onPress={onNotifications}>
          <Ionicons name="notifications-outline" size={24} color={theme.icon} />
          {unreadNotifications > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadNotifications}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Messages Inbox */}
        <TouchableOpacity style={styles.iconContainer} onPress={onMessages}>
          <Ionicons name="mail-outline" size={24} color={theme.icon} />
          {unreadMessages > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadMessages}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF8F0",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  appName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginLeft: 16,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "red",
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  nameText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6, // sau folosește marginLeft în `nameText`
  },

});
