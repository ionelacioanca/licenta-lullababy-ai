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
    console.log("Loading baby for parentId:", parentId);
    
    if (!parentId) {
      console.warn("No parentId found in AsyncStorage");
      return;
    }

    const token = await AsyncStorage.getItem("token");

    try {
      const response = await fetch(`http://192.168.1.50:5000/api/baby/parent/${parentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Baby fetch response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch baby data:", errorData);
        throw new Error("Failed to fetch baby data");
      }

      const data = await response.json();
      console.log("Baby data received:", data);
      
      // API returns an array of babies, get the first one
      if (data && Array.isArray(data) && data.length > 0) {
        const baby = data[0];
        if (baby.name) {
          setBabyName(baby.name);
          setChildInitial(baby.name.charAt(0).toUpperCase());
          console.log("Baby name set to:", baby.name);
        }
      } else {
        console.warn("No baby found for this parent");
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
