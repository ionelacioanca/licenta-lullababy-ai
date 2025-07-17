import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const routeMap: Record<"Home" | "Raports" | "Calendar" | "Tips" | "Jurnal", string> = {
  Home: "/dashboard",
  Raports: "/raports",
  Calendar: "/calendar",
  Tips: "/tips",
  Jurnal: "/jurnal",
};


interface FooterProps {
  active: keyof typeof routeMap;
  onNavigate: (screen: keyof typeof routeMap) => void;
}

const Footer: React.FC<FooterProps> = ({ active, onNavigate }) => {
  type IconName =
  | "home-outline"
  | "bar-chart-outline"
  | "calendar-outline"
  | "bulb-outline"
  | "book-outline";

const tabs: { name: keyof typeof routeMap; icon: IconName }[] = [
  { name: "Home", icon: "home-outline" },
  { name: "Raports", icon: "bar-chart-outline" },
  { name: "Calendar", icon: "calendar-outline" },
  { name: "Tips", icon: "bulb-outline" },
  { name: "Jurnal", icon: "book-outline" },
];
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={styles.tab}
          onPress={() => onNavigate(tab.name)}
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
