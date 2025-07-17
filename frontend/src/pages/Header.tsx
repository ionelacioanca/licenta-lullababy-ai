import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // sau altă librărie de iconuri

type HeaderProps = {
  childInitial: string;
  babyName: string;
  onEditProfile: () => void;
  onMessages: () => void;
  onSettings: () => void;
  unreadMessages?: number;
};

export default function Header({ childInitial,  babyName, onEditProfile, onMessages, onSettings, unreadMessages = 0 }: HeaderProps) {
  return (
    <View style={styles.container}>
        <View style={styles.leftContainer}>
            <TouchableOpacity style={styles.avatar} onPress={onEditProfile}>
                <Text style={styles.avatarText}>{childInitial}</Text>
            </TouchableOpacity>
            <Text style={styles.nameText}>{babyName}</Text>
        </View>

      <Text style={styles.appName}>lullababy</Text>

      {/* Dreapta: Mesaje + Setări */}
      <View style={styles.rightContainer}>
        <TouchableOpacity style={styles.iconContainer} onPress={onMessages}>
          <Ionicons name="mail-outline" size={24} color="#444" />
          {unreadMessages > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadMessages}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconContainer} onPress={onSettings}>
          <Ionicons name="settings-outline" size={24} color="#444" />
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
    backgroundColor: "#00CFFF",
    alignItems: "center",
    justifyContent: "center",
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
    marginLeft: 20,
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
