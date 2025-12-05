import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  createJournalEntry,
  updateJournalEntry,
  JournalEntry,
} from "../services/journalService";
import { useLanguage } from "../contexts/LanguageContext";

interface AddEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  babyId: string;
  editEntry?: JournalEntry | null;
}

const MOODS = [
  { key: "happy", icon: "happy-outline", label: "Happy" },
  { key: "okay", icon: "happy-outline", label: "Okay" },
  { key: "neutral", icon: "ellipse-outline", label: "Neutral" },
  { key: "crying", icon: "sad-outline", label: "Crying" },
  { key: "sick", icon: "thermometer-outline", label: "Sick" },
];

const TAGS = [
  { key: "milestone", label: "Milestone", color: "#FFD93D" },
  { key: "first-moments", label: "First Moments", color: "#FF6B6B" },
  { key: "sleep", label: "Sleep", color: "#6B4FA0" },
  { key: "feeding", label: "Feeding", color: "#4ECDC4" },
  { key: "health", label: "Health", color: "#FF8585" },
  { key: "challenges", label: "Challenges", color: "#95A5A6" },
  { key: "playtime", label: "Playtime", color: "#A2E884" },
  { key: "other", label: "Other", color: "#BBBBBB" },
];

const AddEntryModal: React.FC<AddEntryModalProps> = ({
  visible,
  onClose,
  onSave,
  babyId,
  editEntry,
}) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>("neutral");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [photoCaptions, setPhotoCaptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editEntry) {
      setTitle(editEntry.title || "");
      setDescription(editEntry.description);
      setDate(new Date(editEntry.date));
      setSelectedMood(editEntry.mood);
      setSelectedTags(editEntry.tags);
      // For editing, photos come from existing entry
      setPhotoCaptions(editEntry.photoCaptions || []);
    } else {
      resetForm();
    }
  }, [editEntry, visible]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate(new Date());
    setSelectedMood("neutral");
    setSelectedTags([]);
    setPhotos([]);
    setPhotoCaptions([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const pickImages = async () => {
    if (photos.length >= 5) {
      Alert.alert("Limit Reached", "You can add up to 5 photos per entry");
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - photos.length,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type || "image/jpeg",
        fileName: asset.fileName || `photo-${Date.now()}.jpg`,
      }));
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
      // Add empty captions for new photos
      setPhotoCaptions((prev) => [
        ...prev,
        ...new Array(newPhotos.length).fill(""),
      ].slice(0, 5));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoCaptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    setPhotoCaptions((prev) => {
      const newCaptions = [...prev];
      newCaptions[index] = caption;
      return newCaptions;
    });
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert("Required Field", "Please add a description");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        date,
        tags: selectedTags,
        mood: selectedMood,
        photoCaptions,
      };

      if (editEntry) {
        // For editing, keep existing photos
        await updateJournalEntry(editEntry._id, {
          ...data,
          existingPhotos: editEntry.photos,
          newPhotos: photos,
        });
      } else {
        // For creating, add photos directly
        await createJournalEntry(babyId, {
          ...data,
          photos,
        });
      }

      onSave();
      resetForm();
    } catch (error) {
      console.error("Error saving entry:", error);
      Alert.alert("Error", "Failed to save entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editEntry ? "Edit Memory" : "New Memory"}
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.saveButton}
            disabled={isSubmitting}
          >
            <Text style={[styles.saveText, isSubmitting && styles.saveTextDisabled]}>
              {isSubmitting ? t('journal.saving') : t('journal.save')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('journal.titleOptional')}</Text>
            <TextInput
              style={styles.titleInput}
              placeholder={t('journal.titlePlaceholder')}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.label}>
              {t('journal.descriptionRequired')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder={t('journal.descriptionPlaceholder')}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Date Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('journal.dateTime')}</Text>
            <TouchableOpacity
              style={styles.datePicker}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#A2E884" />
              <Text style={styles.dateText}>
                {date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="datetime"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
          </View>

          {/* Mood Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('journal.mood')}</Text>
            <View style={styles.moodSelector}>
              {MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood.key}
                  style={[
                    styles.moodButton,
                    selectedMood === mood.key && styles.moodButtonActive,
                  ]}
                  onPress={() => setSelectedMood(mood.key)}
                >
                  <View style={[
                    styles.moodIconCircle,
                    selectedMood === mood.key && styles.moodIconCircleActive
                  ]}>
                    <Ionicons 
                      name={mood.icon as any} 
                      size={24} 
                      color={selectedMood === mood.key ? "#A2E884" : "#999"}
                    />
                  </View>
                  <Text style={styles.moodLabel}>{t(`journal.${mood.key}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tags Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('journal.tags')}</Text>
            <View style={styles.tagsContainer}>
              {TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag.key}
                  style={[
                    styles.tagButton,
                    {
                      backgroundColor: selectedTags.includes(tag.key)
                        ? tag.color
                        : "#FFF",
                      borderColor: tag.color,
                    },
                  ]}
                  onPress={() => toggleTag(tag.key)}
                >
                  <Text
                    style={[
                      styles.tagButtonText,
                      selectedTags.includes(tag.key) && styles.tagButtonTextActive,
                    ]}
                  >
                    {t(`journal.${tag.key === 'first-moments' ? 'firstMoments' : tag.key}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Photo Picker */}
          <View style={styles.section}>
            <View style={styles.photoHeader}>
              <Text style={styles.label}>{t('journal.photos')} ({photos.length}/5)</Text>
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={pickImages}
                disabled={photos.length >= 5}
              >
                <Ionicons
                  name="add-circle"
                  size={24}
                  color={photos.length >= 5 ? "#CCC" : "#A2E884"}
                />
                <Text
                  style={[
                    styles.addPhotoText,
                    photos.length >= 5 && styles.addPhotoTextDisabled,
                  ]}
                >
                  {t('journal.addPhotosButton')}
                </Text>
              </TouchableOpacity>
            </View>

            {photos.length > 0 && (
              <View style={styles.photosContainer}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.photoCaptionInput}
                      placeholder={t('journal.addCaption')}
                      value={photoCaptions[index] || ""}
                      onChangeText={(text) => updateCaption(index, text)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#A2E884",
    borderRadius: 20,
  },
  saveText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  required: {
    color: "#FF6B6B",
  },
  titleInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
  },
  descriptionInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
    minHeight: 120,
  },
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  moodSelector: {
    flexDirection: "row",
    gap: 8,
  },
  moodButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingVertical: 12,
  },
  moodButtonActive: {
    borderColor: "#A2E884",
    backgroundColor: "#F0F9F0",
  },
  moodIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  moodIconCircleActive: {
    borderColor: "#A2E884",
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  tagButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  tagButtonTextActive: {
    color: "#FFF",
  },
  photoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A2E884",
  },
  addPhotoTextDisabled: {
    color: "#CCC",
  },
  photosContainer: {
    gap: 16,
    marginTop: 12,
  },
  photoItem: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  removePhotoButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
  photoCaptionInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#333",
  },
});

export default AddEntryModal;
