import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Alert,
  Modal,
  TextInput,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Header from "../src/pages/Header";
import Footer from "../src/pages/Footer";
import CalendarModal from "../src/components/CalendarModal";
import SettingsModal from "../src/components/SettingsModal";
import {
  getJournalEntries,
  getJournalGallery,
  deleteJournalEntry,
  JournalEntry,
  GalleryPhoto,
} from "../src/services/journalService";
import AddEntryModal from "@/src/components/AddEntryModal";
import { useTheme } from "../src/contexts/ThemeContext";
import { useLanguage } from "../src/contexts/LanguageContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MOOD_ICONS: Record<string, string> = {
  happy: "happy-outline",
  okay: "happy-outline", 
  neutral: "ellipse-outline",
  crying: "sad-outline",
  sick: "thermometer-outline",
};

const TAG_COLORS: Record<string, string> = {
  milestone: "#FFD93D",
  "first-moments": "#FF6B6B",
  sleep: "#6B4FA0",
  feeding: "#4ECDC4",
  health: "#FF8585",
  challenges: "#95A5A6",
  playtime: "#A2E884",
  other: "#BBBBBB",
};

const JournalPage: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [babyId, setBabyId] = useState<string | null>(null);
  const [babyName, setBabyName] = useState("");
  const [childInitial, setChildInitial] = useState("?");
  const [avatarColor, setAvatarColor] = useState("#00CFFF");
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [viewMode, setViewMode] = useState<"timeline" | "gallery">("timeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>();
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Lightbox state
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    loadBabyData();
  }, []);

  const loadBabyData = async () => {
    try {
      const parentId = await AsyncStorage.getItem("parentId");
      const token = await AsyncStorage.getItem("token");
      const selectedBabyId = await AsyncStorage.getItem("selectedBabyId");

      if (!parentId) return;

      const response = await fetch(`http://192.168.1.20:5000/api/baby/parent/${parentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch baby data");

      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        let baby = data.find((b: any) => b._id === selectedBabyId) || data[0];
        
        setBabyName(baby.name);
        setChildInitial(baby.name.charAt(0).toUpperCase());
        setBabyId(baby._id);
        setAvatarColor(baby.avatarColor || "#00CFFF");
        setAvatarImage(baby.avatarImage ? `http://192.168.1.20:5000${baby.avatarImage}` : null);
        
        loadEntries(baby._id);
        loadGallery(baby._id);
      }
    } catch (error) {
      console.error("Error loading baby data:", error);
    }
  };

  const loadEntries = async (id: string) => {
    try {
      const data = await getJournalEntries(id);
      setEntries(data);
    } catch (error) {
      console.error("Error loading entries:", error);
    }
  };

  const loadGallery = async (id: string) => {
    try {
      const data = await getJournalGallery(id);
      setGallery(data);
    } catch (error) {
      console.error("Error loading gallery:", error);
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert(t('journal.delete'), "Are you sure you want to delete this memory?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteJournalEntry(entryId);
            if (babyId) {
              loadEntries(babyId);
              loadGallery(babyId);
            }
          } catch (error) {
            Alert.alert("Error", "Failed to delete entry");
          }
        },
      },
    ]);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowAddModal(true);
  };

  const handleEntrySaved = () => {
    if (babyId) {
      loadEntries(babyId);
      loadGallery(babyId);
    }
    setShowAddModal(false);
    setEditingEntry(undefined);
  };

  const openLightbox = (photos: string[], startIndex: number = 0) => {
    setLightboxPhotos(photos);
    setLightboxIndex(startIndex);
    setLightboxVisible(true);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      !searchQuery ||
      entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => entry.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const renderEntryCard = (entry: JournalEntry) => {
    const isExpanded = expandedEntry === entry._id;
    const entryDate = new Date(entry.date);
    const displayDescription = isExpanded
      ? entry.description
      : entry.description.length > 150
      ? entry.description.substring(0, 150) + "..."
      : entry.description;

    return (
      <View key={entry._id} style={[styles.entryCard, { backgroundColor: theme.card }]}>
        <View style={styles.entryHeader}>
          <View style={[styles.entryDateSection, { backgroundColor: theme.surface }]}>
            <Text style={[styles.entryDay, { color: theme.text }]}>{entryDate.getDate()}</Text>
            <Text style={[styles.entryMonth, { color: theme.textSecondary }]}>
              {entryDate.toLocaleString("en", { month: "short" })}
            </Text>
            <Text style={[styles.entryYear, { color: theme.textTertiary }]}>{entryDate.getFullYear()}</Text>
          </View>

          <View style={styles.entryContent}>
            <View style={styles.entryTitleRow}>
              {entry.title && <Text style={[styles.entryTitle, { color: theme.text }]}>{entry.title}</Text>}
              <View style={[styles.moodCircle, { backgroundColor: theme.surface }]}>
                <Ionicons 
                  name={MOOD_ICONS[entry.mood] as any || "happy-outline"} 
                  size={20} 
                  color={theme.primary} 
                />
              </View>
            </View>

            <Text style={[styles.entryDescription, { color: theme.textSecondary }]}>{displayDescription}</Text>

            {entry.description.length > 150 && (
              <TouchableOpacity onPress={() => setExpandedEntry(isExpanded ? null : entry._id)}>
                <Text style={[styles.readMoreText, { color: theme.primary }]}>
                  {isExpanded ? t('journal.showLess') : t('journal.readMore')}
                </Text>
              </TouchableOpacity>
            )}

            {entry.tags.length > 0 && (
              <View style={styles.entryTags}>
                {entry.tags.map((tag) => (
                  <View
                    key={tag}
                    style={[styles.tag, { backgroundColor: TAG_COLORS[tag] }]}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {entry.photos.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.photosCarousel}
              >
                {entry.photos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openLightbox(entry.photos, index)}
                  >
                    <Image
                      source={{ uri: `http://192.168.1.20:5000${photo}` }}
                      style={styles.carouselPhoto}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.entryActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditEntry(entry)}
              >
                <Ionicons name="create-outline" size={18} color={theme.primary} />
                <Text style={[styles.actionText, { color: theme.primary }]}>{t('journal.edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteEntry(entry._id)}
              >
                <Ionicons name="trash-outline" size={18} color={theme.error} />
                <Text style={[styles.actionText, { color: theme.error }]}>{t('journal.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderGalleryView = () => {
    return (
      <View style={styles.galleryContainer}>
        {gallery.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('journal.noPhotos')}</Text>
            <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>{t('journal.addPhotos')}</Text>
          </View>
        ) : (
          <View style={styles.galleryGrid}>
            {gallery.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.galleryItem}
                onPress={() => openLightbox([item.photoUrl], 0)}
              >
                <Image
                  source={{ uri: `http://192.168.1.20:5000${item.photoUrl}` }}
                  style={styles.galleryPhoto}
                />
                {item.caption && (
                  <View style={[styles.galleryCaption, { backgroundColor: theme.card }]}>
                    <Text style={[styles.galleryCaptionText, { color: theme.text }]} numberOfLines={2}>
                      {item.caption}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        childInitial={childInitial}
        babyName={babyName}
        avatarColor={avatarColor}
        avatarImage={avatarImage}
        onEditProfile={() => router.push("/babiesList")}
        onMessages={() => {}}
        unreadMessages={3}
      />

      <View style={styles.content}>
        <View style={[styles.topBar, { backgroundColor: theme.surface }]}>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, { backgroundColor: theme.card, borderColor: theme.border }, viewMode === "timeline" && { backgroundColor: theme.primary }]}
              onPress={() => setViewMode("timeline")}
            >
              <Ionicons
                name="list"
                size={20}
                color={viewMode === "timeline" ? "#FFF" : theme.primary}
              />
              <Text
                style={[
                  styles.toggleText,
                  { color: theme.text },
                  viewMode === "timeline" && { color: "#FFF" },
                ]}
              >
                {t('journal.timeline')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, { backgroundColor: theme.card, borderColor: theme.border }, viewMode === "gallery" && { backgroundColor: theme.primary }]}
              onPress={() => setViewMode("gallery")}
            >
              <Ionicons
                name="images"
                size={20}
                color={viewMode === "gallery" ? "#FFF" : theme.primary}
              />
              <Text
                style={[styles.toggleText, { color: theme.text }, viewMode === "gallery" && { color: "#FFF" }]}
              >
                {t('journal.gallery')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {viewMode === "timeline" && (
          <>
            <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
              <Ionicons name="search" size={20} color={theme.primary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={t('journal.search')}
                placeholderTextColor={theme.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagFilters}>
              {Object.keys(TAG_COLORS).map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.filterTag,
                    {
                      backgroundColor: selectedTags.includes(tag)
                        ? TAG_COLORS[tag]
                        : theme.surface,
                      borderColor: TAG_COLORS[tag],
                    },
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text
                    style={[
                      styles.filterTagText,
                      { color: theme.text },
                      selectedTags.includes(tag) && styles.filterTagTextActive,
                    ]}
                  >
                    {t(`journal.${tag === 'first-moments' ? 'firstMoments' : tag}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {viewMode === "timeline" ? (
            filteredEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={64} color={theme.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('journal.noMemories')}</Text>
                <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>{t('journal.startCapturing')}</Text>
              </View>
            ) : (
              filteredEntries.map(renderEntryCard)
            )
          ) : (
            renderGalleryView()
          )}
        </ScrollView>
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        activeOpacity={0.85}
        onPress={() => {
          setEditingEntry(undefined);
          setShowAddModal(true);
        }}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      <AddEntryModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingEntry(undefined);
        }}
        onSave={handleEntrySaved}
        babyId={babyId || ""}
        editEntry={editingEntry}
      />

      {/* Lightbox Modal */}
      <Modal visible={lightboxVisible} transparent={true} animationType="fade">
        <View style={styles.lightboxContainer}>
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightboxVisible(false)}>
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>
          {lightboxPhotos.length > 0 && (
            <Image
              source={{ uri: `http://192.168.1.20:5000${lightboxPhotos[lightboxIndex]}` }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}
          {lightboxPhotos.length > 1 && (
            <View style={styles.lightboxNav}>
              <TouchableOpacity
                onPress={() => setLightboxIndex((prev) => Math.max(0, prev - 1))}
                disabled={lightboxIndex === 0}
              >
                <Ionicons
                  name="chevron-back"
                  size={32}
                  color={lightboxIndex === 0 ? "#666" : "white"}
                />
              </TouchableOpacity>
              <Text style={styles.lightboxCounter}>
                {lightboxIndex + 1} / {lightboxPhotos.length}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setLightboxIndex((prev) => Math.min(lightboxPhotos.length - 1, prev + 1))
                }
                disabled={lightboxIndex === lightboxPhotos.length - 1}
              >
                <Ionicons
                  name="chevron-forward"
                  size={32}
                  color={lightboxIndex === lightboxPhotos.length - 1 ? "#666" : "white"}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <Footer
        active="Jurnal"
        onNavigate={(screen) => {
          if (screen === "Calendar") {
            setCalendarOpen(true);
          } else if (screen === "Home") {
            router.push("/dashboard");
          } else if (screen === "Jurnal") {
            router.push("/jurnal");
          } else if (screen === "Profile") {
            router.push("/childProfile");
          }
        }}
        onSettings={() => setSettingsOpen(true)}
      />

      <CalendarModal
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        babyId={babyId || ''}
        onEventsUpdate={() => {}}
      />

      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
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
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF8F0",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#FFF8F0",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "#A2E884",
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: "#A2E884",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A2E884",
  },
  toggleTextActive: {
    color: "#FFF",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A2E884",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  tagFilters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 70,
  },
  filterTag: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
    minWidth: 100,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  filterTagTextActive: {
    color: "#FFF",
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  entryCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  entryHeader: {
    flexDirection: "row",
    gap: 16,
  },
  entryDateSection: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#A2E884",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 60,
  },
  entryDay: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
  },
  entryMonth: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 2,
  },
  entryYear: {
    fontSize: 10,
    fontWeight: "500",
    color: "#FFF",
    opacity: 0.8,
    marginTop: 2,
  },
  entryContent: {
    flex: 1,
  },
  entryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  moodCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#A2E884",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  entryDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  readMoreText: {
    fontSize: 12,
    color: "#A2E884",
    fontWeight: "600",
    marginBottom: 8,
  },
  entryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFF",
  },
  photosCarousel: {
    marginBottom: 12,
  },
  carouselPhoto: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 8,
  },
  entryActions: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A2E884",
  },
  galleryContainer: {
    flex: 1,
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
  },
  galleryItem: {
    width: (SCREEN_WIDTH - 48) / 3,
    height: (SCREEN_WIDTH - 48) / 3,
    margin: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  galleryPhoto: {
    width: "100%",
    height: "100%",
  },
  galleryCaption: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 6,
  },
  galleryCaptionText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#BBB",
    marginTop: 8,
  },
  addButton: {
    position: "absolute",
    bottom: 90,
    right: 24,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#A2E884",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  lightboxImage: {
    width: SCREEN_WIDTH,
    height: "80%",
  },
  lightboxNav: {
    position: "absolute",
    bottom: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 30,
  },
  lightboxCounter: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});

export default JournalPage;
