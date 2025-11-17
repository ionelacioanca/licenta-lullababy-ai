import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Header from "./Header";
import Footer from "./Footer";
import BabyMonitorStream from "../components/BabyMonitorStream";
import SoundPlayer from "../components/SoundPlayer";
import SoundLibraryModal from "../components/SoundLibraryModal";
import SleepHistoryModal from "../components/SleepHistoryModal";
import GrowthTrackingModal from "../components/GrowthTrackingModal";
import { Sound } from "../services/soundService";
import ChatbotModal from "../components/ChatbotModal";

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [babyName, setBabyName] = useState("");
  const [childInitial, setChildInitial] = useState("?");
  const [avatarColor, setAvatarColor] = useState("#00CFFF");
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [babyId, setBabyId] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [sleepHistoryOpen, setSleepHistoryOpen] = useState(false);
  const [growthTrackingOpen, setGrowthTrackingOpen] = useState(false);
  const [currentWeight, setCurrentWeight] = useState("7.2");
  const [currentLength, setCurrentLength] = useState("65");

  const loadBabyForParent = async () => {
    const parentId = await AsyncStorage.getItem("parentId");
    console.log("Loading baby for parentId:", parentId);
    
    if (!parentId) {
      console.warn("No parentId found in AsyncStorage");
      return;
    }

    const token = await AsyncStorage.getItem("token");

    try {
  const response = await fetch(`http://192.168.1.10:5000/api/baby/parent/${parentId}`, {
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
          
          // Load avatar data from backend
          setAvatarColor(baby.avatarColor || "#00CFFF");
          setAvatarImage(baby.avatarImage ? `http://192.168.1.10:5000${baby.avatarImage}` : null);
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

  const handleSelectSound = (sound: Sound) => {
    setSelectedSound(sound);
  };

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
        <BabyMonitorStream babyName={babyName} />
        
        {/* Baby Sleep Activity */}
        <TouchableOpacity
          style={[styles.activityCard, styles.firstCard]}
          activeOpacity={0.7}
          onPress={() => setSleepHistoryOpen(true)}
        >
          <View style={styles.activityHeader}>
            <View style={styles.titleRow}>
              <Ionicons name="moon" size={18} color="#A2E884" />
              <Text style={styles.headerTitle}>Sleep Activity</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
          
          <View style={styles.activityContent}>
            <View style={styles.activityRow}>
              <View style={styles.activityItem}>
                <View style={styles.timelineDot}>
                  <Ionicons name="bed-outline" size={16} color="white" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Fell Asleep</Text>
                  <Text style={styles.timelineTime}>14:30 PM</Text>
                </View>
              </View>
              <View style={styles.activityDivider} />
              <View style={styles.activityItem}>
                <View style={styles.timelineDot}>
                  <Ionicons name="sunny-outline" size={16} color="white" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Woke Up</Text>
                  <Text style={styles.timelineTime}>16:15 PM</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.activitySummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.activityLabel}>Last Sleep</Text>
                <Text style={styles.activityValue}>2h ago</Text>
              </View>
              <View style={styles.activityDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.activityLabel}>Duration</Text>
                <Text style={styles.activityValue}>1h 45m</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        
        <SoundPlayer
          onOpenLibrary={() => setIsLibraryOpen(true)}
          selectedSound={selectedSound}
        />

        {/* Growth Tracking */}
        <TouchableOpacity
          style={[styles.activityCard, { marginTop: 20 }]}
          activeOpacity={0.7}
          onPress={() => setGrowthTrackingOpen(true)}
        >
          <View style={styles.activityHeader}>
            <View style={styles.titleRow}>
              <Ionicons name="fitness" size={18} color="#A2E884" />
              <Text style={styles.headerTitle}>Growth Tracking</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>

          <View style={styles.activityContent}>
            <View style={styles.activityRow}>
              <View style={styles.activityItem}>
                <View style={styles.measurementIcon}>
                  <Ionicons name="scale-outline" size={20} color="white" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Weight</Text>
                  <Text style={styles.timelineTime}>{currentWeight} kg</Text>
                </View>
              </View>
              <View style={styles.activityDivider} />
              <View style={styles.activityItem}>
                <View style={styles.measurementIcon}>
                  <Ionicons name="resize-outline" size={20} color="white" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Length</Text>
                  <Text style={styles.timelineTime}>{currentLength} cm</Text>
                </View>
              </View>
            </View>

            <View style={styles.lastUpdated}>
              <Ionicons name="time-outline" size={14} color="#999" />
              <Text style={styles.lastUpdatedText}>Last updated: Today</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
      
      <SoundLibraryModal
        visible={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectSound={handleSelectSound}
      />

      <SleepHistoryModal
        visible={sleepHistoryOpen}
        onClose={() => setSleepHistoryOpen(false)}
      />

      <GrowthTrackingModal
        visible={growthTrackingOpen}
        onClose={() => setGrowthTrackingOpen(false)}
        onSave={(weight, length) => {
          setCurrentWeight(weight);
          setCurrentLength(length);
          setGrowthTrackingOpen(false);
        }}
      />
      
      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.chatButton}
        activeOpacity={0.85}
        onPress={() => setChatOpen(true)}
      >
        <Ionicons name="chatbubbles" size={32} color="white" />
      </TouchableOpacity>

      <ChatbotModal visible={chatOpen} onClose={() => setChatOpen(false)} />

      <Footer active="Home" onNavigate={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  content: {
    flex: 1,
  },
  chatButton: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#A2E884',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  firstCard: {
    marginTop: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A2E884',
  },
  activityContent: {
    gap: 16,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  activityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  activityLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500',
  },
  activityValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  activityDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  activitySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#A2E884',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A2E884',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  timelineContent: {
    alignItems: 'center',
  },
  timelineLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  measurementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#A2E884',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A2E884',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
});

export default DashboardPage;
