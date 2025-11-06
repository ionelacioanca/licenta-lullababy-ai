import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import Header from "./Header";
import Footer from "./Footer";
import BabyMonitorStream from "../components/BabyMonitorStream";

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [babyName, setBabyName] = useState("");
  const [childInitial, setChildInitial] = useState("?");
  const [avatarColor, setAvatarColor] = useState("#00CFFF");
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [babyId, setBabyId] = useState<string | null>(null);

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
      
      // API returns an array of babies
      if (data && Array.isArray(data) && data.length > 0) {
        // Check if there's a selected baby ID in AsyncStorage
        const selectedBabyId = await AsyncStorage.getItem("selectedBabyId");
        
        // Find the selected baby, or default to the first one
        let baby;
        if (selectedBabyId) {
          baby = data.find((b: any) => b._id === selectedBabyId);
        }
        if (!baby) {
          baby = data[0]; // Fallback to first baby if selected not found
        }
        
        if (baby && baby.name) {
          setBabyName(baby.name);
          setChildInitial(baby.name.charAt(0).toUpperCase());
          setBabyId(baby._id);
          console.log("Baby name set to:", baby.name);
          
          // Load avatar color and image from AsyncStorage
          const savedColor = await AsyncStorage.getItem(`baby_avatar_${baby._id}`);
          if (savedColor) {
            setAvatarColor(savedColor);
          }
          
          const savedImage = await AsyncStorage.getItem(`baby_image_${baby._id}`);
          if (savedImage) {
            setAvatarImage(savedImage);
          }
        }
      } else {
        console.warn("No baby found for this parent");
      }
    } catch (error) {
      console.error("Error fetching baby data:", error);
    }
  };

  // Load baby data on mount
  useEffect(() => {
    loadBabyForParent();
  }, []);

  // Reload baby data when returning to dashboard (to pick up newly added babies or changed selection)
  useFocusEffect(
    React.useCallback(() => {
      loadBabyForParent();
    }, [])
  );



  return (
    <View style={styles.container}>
      <Header
        childInitial={childInitial}
        babyName={babyName}
        avatarColor={avatarColor}
        avatarImage={avatarImage}
        onEditProfile={() => router.push("/babiesList")}
        onMessages={() => {}}
        onSettings={() => {}}
        unreadMessages={3}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <BabyMonitorStream 
          babyName={babyName}
        />
        
        {/* Add more dashboard content here */}
      </ScrollView>
      
      <Footer active="Home" onNavigate={() => {}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  content: {
    flex: 1,
  },
});

export default DashboardPage;
