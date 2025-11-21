import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const routeMap: Record<"Home" | "Calendar" | "Jurnal" | "Settings", string> = {
  Home: "/dashboard",
  Calendar: "/calendar",
  Jurnal: "/jurnal",
  Settings: "settings", // Special case - opens modal
};


interface FooterProps {
  active: keyof typeof routeMap;
  onNavigate: (screen: keyof typeof routeMap) => void;
  onSettings?: () => void; // Optional callback for Settings
}

const Footer: React.FC<FooterProps> = ({ active, onNavigate, onSettings }) => {
  type IconName =
  | "home-outline"
  | "calendar-outline"
  | "book-outline"
  | "settings-outline";

const tabs: { name: keyof typeof routeMap; icon: IconName }[] = [
  { name: "Home", icon: "home-outline" },
  { name: "Calendar", icon: "calendar-outline" },
  { name: "Jurnal", icon: "book-outline" },
  { name: "Settings", icon: "settings-outline" },
];
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={styles.tab}
          onPress={() => {
            if (tab.name === "Settings" && onSettings) {
              onSettings();
            } else {
              onNavigate(tab.name);
            }
          }}
        >
          <Ionicons
            name={tab.icon}
            size={24}
            color={active === tab.name ? "#A2E884" : "#66788A"}
          />
          <Text
            style={[
              styles.label,
              active === tab.name && styles.labelActive,
            ]}
          >
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default Footer;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    backgroundColor: "#FFF8F0",
  },
  tab: {
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    color: "#66788A",
    marginTop: 4,
    fontWeight: "500",
  },
  labelActive: {
    color: "#A2E884",
    fontWeight: "700",
  },
});
