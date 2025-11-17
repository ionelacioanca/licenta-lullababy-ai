import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Sound,
  getAllSounds,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "../services/soundService";

type SoundLibraryModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectSound: (sound: Sound) => void;
};

const SoundLibraryModal: React.FC<SoundLibraryModalProps> = ({
  visible,
  onClose,
  onSelectSound,
}) => {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [filteredSounds, setFilteredSounds] = useState<Sound[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = Object.keys(CATEGORY_LABELS);

  useEffect(() => {
    if (visible) {
      loadSounds();
    }
  }, [visible]);

  useEffect(() => {
    filterSounds();
  }, [sounds, selectedCategory, searchQuery]);

  const loadSounds = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const allSounds = await getAllSounds(token);
      setSounds(allSounds);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading sounds:", error);
      setIsLoading(false);
    }
  };

  const filterSounds = () => {
    let filtered = [...sounds];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.artist.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query)
      );
    }

    setFilteredSounds(filtered);
  };

  const handleSelectSound = (sound: Sound) => {
    onSelectSound(sound);
    onClose();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="musical-notes" size={24} color="#A2E884" />
              <View>
                <Text style={styles.headerTitle}>Sound Library</Text>
                <Text style={styles.headerSubtitle}>
                  {isLoading ? "Loading..." : `${filteredSounds.length} sound${filteredSounds.length !== 1 ? "s" : ""} available`}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sounds..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === null && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === null && styles.categoryChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
                { borderColor: CATEGORY_COLORS[cat] },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sound List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A2E884" />
            <Text style={styles.loadingText}>Loading sounds...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.soundList}
            contentContainerStyle={styles.soundListContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredSounds.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="musical-notes-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No sounds found</Text>
                <Text style={styles.emptySubtext}>
                  Try adjusting your filters
                </Text>
              </View>
            ) : (
              filteredSounds.map((sound) => (
                <TouchableOpacity
                  key={sound._id}
                  style={styles.soundCard}
                  onPress={() => handleSelectSound(sound)}
                >
                  <Image
                    source={{ uri: sound.thumbnailUrl }}
                    style={[
                      styles.soundThumbnail,
                      { backgroundColor: CATEGORY_COLORS[sound.category] },
                    ]}
                  />
                  <View style={styles.soundCardContent}>
                    <Text style={styles.soundCardTitle} numberOfLines={1}>
                      {sound.title}
                    </Text>
                    <Text style={styles.soundCardArtist} numberOfLines={1}>
                      {sound.artist}
                    </Text>
                    <Text style={styles.soundCardMeta} numberOfLines={1}>
                      {CATEGORY_LABELS[sound.category]} •{" "}
                      {formatDuration(sound.duration)}
                    </Text>
                  </View>
                  <Ionicons name="play-circle" size={36} color="#A2E884" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#FFF8F0",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  categoryScroll: {
    maxHeight: 50,
    marginBottom: 12,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#A2E884",
    borderColor: "#A2E884",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  soundList: {
    flex: 1,
  },
  soundListContent: {
    padding: 20,
    gap: 12,
  },
  soundCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  soundThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  soundCardContent: {
    flex: 1,
  },
  soundCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  soundCardArtist: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  soundCardMeta: {
    fontSize: 12,
    color: "#999",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#bbb",
    marginTop: 4,
  },
});

export default SoundLibraryModal;
