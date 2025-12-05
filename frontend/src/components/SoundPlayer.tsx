import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Sound, getDefaultSounds } from "../services/soundService";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

type SoundPlayerProps = {
  onOpenLibrary: () => void;
  selectedSound?: Sound | null;
};

const SoundPlayer: React.FC<SoundPlayerProps> = ({
  onOpenLibrary,
  selectedSound: externalSelectedSound,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSound, setCurrentSound] = useState<Sound | null>(null);
  const [volume, setVolume] = useState(0.7);
  const soundRef = useRef<Audio.Sound | null>(null);
  const { t } = useLanguage();

  // Load last played sound from AsyncStorage on mount
  useEffect(() => {
    loadLastPlayedSound();
  }, []);

  // Update current sound when external selection changes
  useEffect(() => {
    if (externalSelectedSound) {
      setCurrentSound(externalSelectedSound);
      saveLastPlayedSound(externalSelectedSound);
      playSound(externalSelectedSound);
    }
  }, [externalSelectedSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const loadLastPlayedSound = async () => {
    try {
      const savedSound = await AsyncStorage.getItem("lastPlayedSound");
      if (savedSound) {
        const sound: Sound = JSON.parse(savedSound);
        setCurrentSound(sound);
      } else {
        // If no saved sound, load a default one
        await loadDefaultSound();
      }
    } catch (error) {
      console.error("Error loading last played sound:", error);
      await loadDefaultSound();
    }
  };

  const loadDefaultSound = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const sounds = await getDefaultSounds(token);
      if (sounds.length > 0) {
        const firstLullaby = sounds.find((s) => s.category === "lullaby") || sounds[0];
        setCurrentSound(firstLullaby);
      }
    } catch (error) {
      console.error("Error loading default sound:", error);
    }
  };

  const saveLastPlayedSound = async (sound: Sound) => {
    try {
      await AsyncStorage.setItem("lastPlayedSound", JSON.stringify(sound));
    } catch (error) {
      console.error("Error saving last played sound:", error);
    }
  };

  const playSound = async (sound: Sound) => {
    try {
      setIsLoading(true);

      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Load and play new sound
      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: sound.audioUrl },
        { shouldPlay: true, volume: volume, isLooping: true }
      );

      soundRef.current = audioSound;
      setIsPlaying(true);
      setIsLoading(false);

      // Listen for playback status
      audioSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish && !status.isLooping) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("Error playing sound:", error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const pauseSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Error pausing sound:", error);
    }
  };

  const resumeSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error resuming sound:", error);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseSound();
    } else {
      if (soundRef.current) {
        resumeSound();
      } else if (currentSound) {
        playSound(currentSound);
      }
    }
  };

  const handleVolumeDown = async () => {
    const newVolume = Math.max(0, volume - 0.1);
    setVolume(newVolume);
    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(newVolume);
    }
  };

  const handleVolumeUp = async () => {
    const newVolume = Math.min(1, volume + 0.1);
    setVolume(newVolume);
    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(newVolume);
    }
  };

  const { theme } = useTheme();

  if (!currentSound) {
    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]} activeOpacity={0.7} onPress={onOpenLibrary}>
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes-outline" size={48} color={theme.textTertiary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('dashboard.lullabySectionEmpty')}</Text>
          <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>{t('dashboard.lullabySectionTapBrowse')}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]} activeOpacity={0.7} onPress={onOpenLibrary}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="musical-notes" size={18} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('dashboard.lullabySectionTitle')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
      </View>

      <View style={styles.content}>
        {/* Sound Info */}
        <View style={styles.soundInfo}>
          <Image
            source={{ uri: currentSound.thumbnailUrl }}
            style={styles.thumbnail}
            defaultSource={require("../../assets/images/partial-react-logo.png")}
          />
          <View style={styles.textInfo}>
            <Text style={[styles.soundTitle, { color: theme.text }]} numberOfLines={1}>
              {currentSound.title}
            </Text>
            <Text style={[styles.soundArtist, { color: theme.textSecondary }]} numberOfLines={1}>
              {currentSound.artist}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.volumeBtn, { backgroundColor: theme.surface }]}
            onPress={(e) => {
              e.stopPropagation();
              handleVolumeDown();
            }}
          >
            <Ionicons name="volume-low" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: theme.primary }, isPlaying && styles.playBtnActive]}
            onPress={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={28}
                color="#fff"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.volumeBtn, { backgroundColor: theme.surface }]}
            onPress={(e) => {
              e.stopPropagation();
              handleVolumeUp();
            }}
          >
            <Ionicons name="volume-high" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Volume Indicator */}
        <View style={styles.volumeIndicator}>
          <View style={[styles.volumeBarBg, { backgroundColor: theme.border }]}>
            <View
              style={[styles.volumeBarFill, { width: `${volume * 100}%`, backgroundColor: theme.primary }]}
            />
          </View>
          <Text style={[styles.volumeText, { color: theme.textSecondary }]}>{Math.round(volume * 100)}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    gap: 12,
  },
  soundInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  textInfo: {
    flex: 1,
  },
  soundTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  soundArtist: {
    fontSize: 14,
    color: "#666",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  volumeBtn: {
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  playBtn: {
    backgroundColor: "#A2E884",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  playBtnActive: {
    backgroundColor: "#36c261",
  },
  volumeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  volumeBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 3,
    overflow: "hidden",
  },
  volumeBarFill: {
    height: 6,
    backgroundColor: "#A2E884",
    borderRadius: 3,
  },
  volumeText: {
    fontSize: 12,
    color: "#666",
    width: 35,
    textAlign: "right",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#bbb",
    marginTop: 4,
  },
});

export default SoundPlayer;
