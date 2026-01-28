import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLanguage } from "../contexts/LanguageContext";

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
  avatarColor?: string;
  avatarImage?: string | null;
}

const ChildProfilePage: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#00CFFF");
  const [avatarImage, setAvatarImage] = useState<string | null>(null);

  // Editable fields
  const [editedName, setEditedName] = useState("");
  const [editedSex, setEditedSex] = useState("");
  const [editedBirthDate, setEditedBirthDate] = useState("");
  const [editedBirthWeight, setEditedBirthWeight] = useState("");
  const [editedBirthLength, setEditedBirthLength] = useState("");
  const [editedBirthType, setEditedBirthType] = useState("");
  const [editedGestationalWeeks, setEditedGestationalWeeks] = useState("");
  const [editedAllergies, setEditedAllergies] = useState("");

  const avatarColors = [
    "#00CFFF", // cyan (default)
    "#A2E884", // green
    "#FFB84D", // orange
    "#FF7F50", // coral
    "#FF69B4", // pink
    "#FF6B6B", // red
    "#4169E1", // blue
    "#9370DB", // purple
  ];

  useEffect(() => {
    loadBabyProfile();
  }, []);

  useEffect(() => {
    if (baby) {
      setEditedName(baby.name || "");
      setEditedSex(baby.sex || "");
      setEditedBirthDate(baby.birthDate || "");
      // Always show weight in grams
      const weightInKg = baby.birthWeight || 0;
      const displayWeight = (weightInKg * 1000).toString();
      setEditedBirthWeight(displayWeight);
      setEditedBirthLength(baby.birthLength?.toString() || "");
      setEditedBirthType(baby.birthType || "");
      setEditedGestationalWeeks(baby.gestationalWeeks?.toString() || "");
      setEditedAllergies(baby.knownAllergies || "");
      setSelectedColor(baby.avatarColor || "#00CFFF");
      
      // Handle avatar image URL construction
      const newAvatarImage = baby.avatarImage 
        ? (baby.avatarImage.startsWith('http') ? baby.avatarImage : `http://192.168.1.14:5000${baby.avatarImage}`)
        : null;
      
      console.log("Setting avatar image in useEffect:", newAvatarImage);
      setAvatarImage(newAvatarImage);
    }
  }, [baby]);

  const loadBabyProfile = async () => {
    try {
      const selectedBabyId = await AsyncStorage.getItem("selectedBabyId");
      const parentId = await AsyncStorage.getItem("parentId");
      const token = await AsyncStorage.getItem("token");

      if (!parentId || !selectedBabyId) {
        console.warn("No parentId or selectedBabyId found");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://192.168.1.14:5000/api/baby/parent/${parentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch baby data");
      }

      const data = await response.json();
      if (data && Array.isArray(data)) {
        // Find the specific baby by ID
        const selectedBaby = data.find((b: Baby) => b._id === selectedBabyId);
        if (selectedBaby) {
          setBaby(selectedBaby);
          console.log("Baby profile loaded:", selectedBaby);
          
          // Load avatar data from backend
          setSelectedColor(selectedBaby.avatarColor || "#00CFFF");
          setAvatarImage(selectedBaby.avatarImage ? `http://192.168.1.14:5000${selectedBaby.avatarImage}` : null);
        } else {
          console.warn("Selected baby not found in data");
        }
      }
    } catch (error) {
      console.error("Error loading baby profile:", error);
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

  const uploadAvatarImage = async (imageUri: string) => {
    try {
      const selectedBabyId = await AsyncStorage.getItem("selectedBabyId");
      const token = await AsyncStorage.getItem("token");
      
      if (!selectedBabyId) {
        Alert.alert("Error", "Baby ID not found");
        return;
      }

      // Create FormData for multipart/form-data upload
      const formData = new FormData();
      
      // Extract filename from URI
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      // @ts-ignore - React Native FormData accepts this format
      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type: type,
      });
      
      formData.append('avatarColor', selectedColor);

      const response = await fetch(
        `http://192.168.1.14:5000/api/baby/${selectedBabyId}/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload avatar image");
      }

      const updatedBaby = await response.json();
      console.log("Updated baby from server:", updatedBaby);
      console.log("Avatar image path:", updatedBaby.avatarImage);
      
      const fullImageUrl = updatedBaby.avatarImage ? `http://192.168.1.14:5000${updatedBaby.avatarImage}` : null;
      console.log("Full image URL:", fullImageUrl);
      
      setBaby(updatedBaby);
      setAvatarImage(fullImageUrl);
      
      Alert.alert("Success", "Avatar updated successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      Alert.alert("Error", "Failed to upload avatar image");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission needed", "Camera permission is required to take photos");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await uploadAvatarImage(imageUri);
        setShowAvatarModal(false);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const handleSelectFromLibrary = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission needed", "Photo library permission is required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await uploadAvatarImage(imageUri);
        setShowAvatarModal(false);
      }
    } catch (error) {
      console.error("Error selecting photo:", error);
      Alert.alert("Error", "Failed to select photo");
    }
  };

  const handleRemovePhoto = async () => {
    try {
      const selectedBabyId = await AsyncStorage.getItem("selectedBabyId");
      const token = await AsyncStorage.getItem("token");
      
      if (!selectedBabyId) return;
      
      // Update backend to remove avatar image
      const formData = new FormData();
      formData.append('avatarColor', selectedColor);
      formData.append('removeImage', 'true');
      
      const response = await fetch(
        `http://192.168.1.14:5000/api/baby/${selectedBabyId}/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      
      if (response.ok) {
        const updatedBaby = await response.json();
        console.log("Baby after removing photo:", updatedBaby);
        setBaby({
          ...updatedBaby,
          avatarImage: null
        });
        setAvatarImage(null);
        Alert.alert("Success", "Photo removed successfully!");
      } else {
        throw new Error("Failed to remove photo");
      }
    } catch (error) {
      console.error("Error removing photo:", error);
      Alert.alert("Error", "Failed to remove photo");
    }
    
    setShowAvatarModal(false);
  };

  const handleSelectColor = async (color: string) => {
    try {
      const selectedBabyId = await AsyncStorage.getItem("selectedBabyId");
      const token = await AsyncStorage.getItem("token");
      
      if (!selectedBabyId) return;
      
      // Update backend with new color and remove image
      const formData = new FormData();
      formData.append('avatarColor', color);
      formData.append('removeImage', 'true'); // Remove image when selecting color
      
      const response = await fetch(
        `http://192.168.1.14:5000/api/baby/${selectedBabyId}/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      
      if (response.ok) {
        const updatedBaby = await response.json();
        console.log("Baby after updating color:", updatedBaby);
        setSelectedColor(color);
        setBaby({
          ...updatedBaby,
          avatarImage: null
        });
        setAvatarImage(null); // Remove the image to show color instead
      }
    } catch (error) {
      console.error("Error updating color:", error);
      Alert.alert("Error", "Failed to update color");
    }
    
    setShowAvatarModal(false);
  };

  const formatBirthDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const handleSaveProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const selectedBabyId = await AsyncStorage.getItem("selectedBabyId");

      if (!selectedBabyId) {
        Alert.alert("Error", "Baby ID not found");
        return;
      }

      // Avatar is already saved to AsyncStorage when user selects it
      // No need to save again here

      const updatedData = {
        name: editedName,
        sex: editedSex,
        birthDate: editedBirthDate,
        birthWeight: editedBirthWeight ? parseFloat(editedBirthWeight) / 1000 : undefined,
        birthLength: editedBirthLength ? parseFloat(editedBirthLength) : undefined,
        birthType: editedBirthType,
        gestationalWeeks: editedGestationalWeeks ? parseInt(editedGestationalWeeks) : undefined,
        knownAllergies: editedAllergies,
      };

      const response = await fetch(
        `http://192.168.1.14:5000/api/baby/${selectedBabyId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update baby profile");
      }

      // Update local baby state immediately (keep avatar settings)
      if (baby) {
        setBaby({
          ...baby,
          name: editedName,
          sex: editedSex,
          birthDate: editedBirthDate,
          birthWeight: editedBirthWeight ? (baby && baby.birthWeight && baby.birthWeight < 5 ? parseFloat(editedBirthWeight) / 1000 : parseFloat(editedBirthWeight)) : undefined,
          birthLength: editedBirthLength ? parseFloat(editedBirthLength) : undefined,
          birthType: editedBirthType,
          gestationalWeeks: editedGestationalWeeks ? parseInt(editedGestationalWeeks) : undefined,
          knownAllergies: editedAllergies,
          avatarColor: selectedColor,
          avatarImage: avatarImage,
        });
      }

      Alert.alert("Success", "Profile updated successfully");
      
      // Go back to babies list (which will reload via useFocusEffect)
      router.back();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleDeleteProfile = async () => {
    Alert.alert(
      "Delete Profile",
      "Are you sure you want to delete this child profile? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              const selectedBabyId = await AsyncStorage.getItem("selectedBabyId");

              if (!selectedBabyId) {
                Alert.alert("Error", "Baby ID not found");
                return;
              }

              // Remove local avatar data
              await AsyncStorage.removeItem(`baby_avatar_${selectedBabyId}`);
              await AsyncStorage.removeItem(`baby_image_${selectedBabyId}`);

              const response = await fetch(
                `http://192.168.1.14:5000/api/baby/${selectedBabyId}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (!response.ok) {
                throw new Error("Failed to delete baby profile");
              }

              // Go back to babies list (which will reload via useFocusEffect)
              router.back();
            } catch (error) {
              console.error("Error deleting profile:", error);
              Alert.alert("Error", "Failed to delete profile");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A2E884" />
      </View>
    );
  }

  if (!baby) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No baby data found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Child's Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: selectedColor }]}
            onPress={() => setShowAvatarModal(true)}
          >
            {avatarImage ? (
              <Image 
                key={avatarImage}
                source={{ uri: avatarImage }} 
                style={styles.avatarImage}
                onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
                onLoad={() => console.log("Image loaded successfully:", avatarImage)}
              />
            ) : (
              <Text style={styles.avatarText}>
                {editedName ? editedName.charAt(0).toUpperCase() : "B"}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAvatarModal(true)}>
            <Text style={styles.addPhotoText}>{avatarImage ? t('baby.changePhoto') : t('baby.addPhoto')}</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Details - Simple List */}
        <View style={styles.detailsContainer}>
          <View style={styles.simpleRow}>
            <Text style={styles.simpleLabel}>{t('baby.firstName')}:</Text>
            <TextInput
              style={styles.simpleValue}
              value={editedName}
              onChangeText={setEditedName}
              placeholder={t('baby.enterName')}
            />
          </View>

          <View style={styles.simpleRow}>
            <Text style={styles.simpleLabel}>{t('baby.birthday')}:</Text>
            <TextInput
              style={styles.simpleValue}
              value={editedBirthDate ? formatBirthDate(editedBirthDate) : ""}
              onChangeText={(text) => {
                // Allow user to type in formatted date
                setEditedBirthDate(text);
              }}
              placeholder="Jan 1, 2023"
            />
          </View>

          <View style={styles.simpleRow}>
            <Text style={styles.simpleLabel}>{t('baby.gestationalWeeks')}:</Text>
            <TextInput
              style={styles.simpleValue}
              value={editedGestationalWeeks}
              onChangeText={setEditedGestationalWeeks}
              placeholder="40"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.simpleRow}>
            <Text style={styles.simpleLabel}>{t('baby.birthWeight')}:</Text>
            <TextInput
              style={styles.simpleValue}
              value={editedBirthWeight}
              onChangeText={setEditedBirthWeight}
              placeholder="3500"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.simpleRow}>
            <Text style={styles.simpleLabel}>{t('baby.birthLength')}:</Text>
            <TextInput
              style={styles.simpleValue}
              value={editedBirthLength}
              onChangeText={setEditedBirthLength}
              placeholder="50"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.simpleRow}>
            <Text style={styles.simpleLabel}>{t('baby.sex')}:</Text>
            <View style={styles.sexButtons}>
              <TouchableOpacity
                style={[
                  styles.sexButtonSmall,
                  editedSex === "male" && styles.sexButtonActiveSmall,
                ]}
                onPress={() => setEditedSex("male")}
              >
                <Ionicons name="male" size={20} color={editedSex === "male" ? "#333" : "#999"} />
                <Text style={styles.sexButtonTextSmall}>{t('baby.male')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sexButtonSmall,
                  editedSex === "female" && styles.sexButtonActiveSmall,
                ]}
                onPress={() => setEditedSex("female")}
              >
                <Ionicons name="female" size={20} color={editedSex === "female" ? "#333" : "#999"} />
                <Text style={styles.sexButtonTextSmall}>{t('baby.female')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.simpleRow}>
            <Text style={styles.simpleLabel}>{t('baby.knownAllergies')}:</Text>
            <TextInput
              style={styles.simpleValue}
              value={editedAllergies}
              onChangeText={setEditedAllergies}
              placeholder={t('baby.none')}
              multiline
            />
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteProfile}>
          <Text style={styles.deleteButtonText}>{t('baby.deleteProfile')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Fixed Save Button at Bottom */}
      <View style={styles.fixedBottomButton}>
        <TouchableOpacity style={styles.saveButtonLarge} onPress={handleSaveProfile}>
          <Text style={styles.saveButtonLargeText}>{t('baby.save')}</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar Modal */}
      <Modal
        visible={showAvatarModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleTakePhoto}
            >
              <Text style={styles.modalOptionText}>Take photo</Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleSelectFromLibrary}
            >
              <Text style={styles.modalOptionText}>Select photo from library</Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Color Selection */}
            <View style={styles.colorSection}>
              <Text style={styles.colorTitle}>Select color</Text>
              <View style={styles.colorGrid}>
                {avatarColors.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                    ]}
                    onPress={() => handleSelectColor(color)}
                  >
                    <Text style={styles.colorCircleText}>
                      {editedName ? editedName.charAt(0).toUpperCase() : "B"}
                    </Text>
                    {selectedColor === color && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.separator} />

            {avatarImage && (
              <>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={handleRemovePhoto}
                >
                  <Text style={styles.modalOptionText}>Remove profile picture</Text>
                </TouchableOpacity>
                <View style={styles.separator} />
              </>
            )}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowAvatarModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: "#A2E884",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120, // Extra space for the fixed button at bottom
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 48,
  },
  addPhotoText: {
    color: "#A2E884",
    fontSize: 16,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#F9F9F9",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  // Simple Detail Rows (like screenshot)
  detailsContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  simpleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  simpleLabel: {
    fontSize: 18,
    color: "#333",
    fontWeight: "400",
  },
  simpleValue: {
    fontSize: 18,
    color: "#333",
    fontWeight: "400",
    textAlign: "right",
    flex: 1,
    marginLeft: 20,
  },
  prematureButtons: {
    flexDirection: "row",
    gap: 12,
  },
  prematureButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
  },
  prematureButtonActive: {
    backgroundColor: "#E0E0E0",
  },
  prematureButtonText: {
    fontSize: 16,
    color: "#333",
  },
  sexButtons: {
    flexDirection: "row",
    gap: 12,
  },
  sexButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  sexButtonActiveSmall: {
    backgroundColor: "#E0E0E0",
  },
  sexButtonTextSmall: {
    fontSize: 16,
    color: "#333",
  },
  sexButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F9F9F9",
    alignItems: "center",
  },
  sexButtonActive: {
    backgroundColor: "#A2E884",
    borderColor: "#A2E884",
  },
  sexButtonText: {
    fontSize: 16,
    color: "#666",
  },
  sexButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  deleteButton: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 18,
    color: "#FF6B6B",
    fontWeight: "500",
  },
  fixedBottomButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF8F0",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  saveButtonLarge: {
    backgroundColor: "#A2E884",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonLargeText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalOption: {
    paddingVertical: 18,
    alignItems: "center",
  },
  modalOptionText: {
    fontSize: 18,
    color: "#333",
  },
  separator: {
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  colorSection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  colorTitle: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  colorCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  colorCircleText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  checkmark: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 18,
    color: "#A2E884",
    fontWeight: "600",
  },
});

export default ChildProfilePage;
