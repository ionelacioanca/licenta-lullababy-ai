import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

interface Baby {
  _id: string;
  name: string;
  sex: string;
  birthDate: string;
  birthWeight?: number;
  birthLength?: number;
  birthType?: string;
  gestationalWeeks?: number;
  knownAllergies?: string;
}

interface BabyWithAvatar extends Baby {
  avatarColor?: string;
  avatarImage?: string | null;
}

const BabiesListPage: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [babies, setBabies] = useState<BabyWithAvatar[]>([]);
  const [loading, setLoading] = useState(true);

  // Reload babies data every time this screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadBabies();
    }, [])
  );

  const loadBabies = async () => {
    try {
      const parentId = await AsyncStorage.getItem("parentId");
      const token = await AsyncStorage.getItem("token");

      if (!parentId) {
        console.warn("No parentId found");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://192.168.1.20:5000/api/baby/parent/${parentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        // Don't throw error for 404 - just means no babies yet (valid state)
        console.log("No babies found (status:", response.status, ")");
        setBabies([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data && Array.isArray(data)) {
        // Avatar data now comes from backend
        const babiesWithAvatars = data.map((baby: any) => ({
          ...baby,
          avatarColor: baby.avatarColor || "#00CFFF",
          avatarImage: baby.avatarImage ? `http://192.168.1.20:5000${baby.avatarImage}` : null,
        }));
        setBabies(babiesWithAvatars);
        console.log("Babies loaded with avatars:", babiesWithAvatars);
      } else {
        // No babies found - this is OK for new accounts
        setBabies([]);
        console.log("No babies found for this parent");
      }
    } catch (error) {
      console.error("Error loading babies:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return `${years} years and ${months} months old`;
  };

  const handleSelectBaby = async (baby: Baby) => {
    // Store selected baby ID and navigate to dashboard
    await AsyncStorage.setItem("selectedBabyId", baby._id);
    router.push("/dashboard");
  };

  const handleEditProfile = (baby: Baby) => {
    // Store selected baby ID and navigate to profile page
    AsyncStorage.setItem("selectedBabyId", baby._id);
    router.push("/childProfile");
  };

  const handleAddChild = () => {
    router.push("/babyDetails");
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.icon} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Babies</Text>
        <TouchableOpacity onPress={handleAddChild} style={styles.addButton}>
          <Ionicons name="person-add" size={24} color={theme.primary} />
          <Text style={[styles.addButtonText, { color: theme.primary }]}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {babies.length > 0 ? (
          babies.map((baby) => (
            <TouchableOpacity 
              key={baby._id} 
              style={[styles.babyCard, { backgroundColor: theme.card }]}
              onPress={() => handleSelectBaby(baby)}
              activeOpacity={0.7}
            >
              {/* Baby Avatar and Info */}
              <View style={styles.babyInfo}>
                <View style={[styles.avatar, { backgroundColor: baby.avatarColor || "#00CFFF" }]}>
                  {baby.avatarImage ? (
                    <Image source={{ uri: baby.avatarImage }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {baby.name ? baby.name.charAt(0).toUpperCase() : "B"}
                    </Text>
                  )}
                </View>
                <View style={styles.babyDetails}>
                  <Text style={[styles.babyName, { color: theme.text }]}>{baby.name || "Baby"}</Text>
                  <Text style={[styles.babyAge, { color: theme.textSecondary }]}>
                    {baby.birthDate ? calculateAge(baby.birthDate) : "Age unknown"}
                  </Text>
                  
                  {/* Edit Profile Button */}
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditProfile(baby);
                    }}
                  >
                    <Text style={[styles.editButtonText, { color: theme.primary }]}>Edit profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noChildrenContainer}>
            <Ionicons name="person-add-outline" size={80} color={theme.textTertiary} />
            <Text style={[styles.noChildrenText, { color: theme.textSecondary }]}>No children profiles found</Text>
            <TouchableOpacity style={[styles.addChildButton, { backgroundColor: theme.primary }]} onPress={handleAddChild}>
              <Text style={styles.addChildButtonText}>Add Child Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8F0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF8F0",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addButtonText: {
    fontSize: 16,
    color: "#A2E884",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  babyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  babyInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#00CFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    overflow: "hidden",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 36,
  },
  babyDetails: {
    flex: 1,
  },
  babyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  babyAge: {
    fontSize: 16,
    color: "#666",
  },
  editButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 0,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "transparent",
    marginTop: 4,
  },
  editButtonText: {
    color: "#A2E884",
    fontSize: 16,
    fontWeight: "600",
  },
  noChildrenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 100,
  },
  noChildrenText: {
    fontSize: 18,
    color: "#999",
    marginTop: 20,
    marginBottom: 30,
    textAlign: "center",
  },
  addChildButton: {
    backgroundColor: "#A2E884",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  addChildButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default BabiesListPage;
