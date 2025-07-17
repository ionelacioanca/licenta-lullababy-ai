import React, { useEffect, useState } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "./Header";
import Footer from "./Footer";

const DashboardPage: React.FC = () => {
  const [babyName, setBabyName] = useState("");
  const [childInitial, setChildInitial] = useState("?");

 useEffect(() => {
  const loadBabyForParent = async () => {
    const parentId = await AsyncStorage.getItem("parentId");
    if (!parentId) return;

    const token = await AsyncStorage.getItem("token");

    try {
      const response = await fetch(`http://192.168.1.53:5000/api/baby/parent/${parentId}`, {
        headers: {

          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Failed to fetch baby data");

      const data = await response.json();
      if (data.babyName) {
        setBabyName(data.babyName);
        setChildInitial(data.babyName.charAt(0).toUpperCase());
      }
    } catch (error) {
      console.error("Error fetching baby data:", error);
    }
  };

  loadBabyForParent();
}, []);



  return (
    <View style={{ flex: 1 }}>
      <Header
        childInitial={childInitial}
        babyName={babyName}
        onEditProfile={() => {}}
        onMessages={() => {}}
        onSettings={() => {}}
        unreadMessages={3}
      />
      <Footer active="Home" onNavigate={() => {}} />
    </View>
  );
};

export default DashboardPage;
