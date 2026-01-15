import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Sound, getDefaultSounds } from "../services/soundService";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

// Raspberry Pi Configuration
const PI_IP = "192.168.1.44:5001";
const PLAY_LULLABY_URL = `http://${PI_IP}/play_lullaby`;
const STOP_AUDIO_URL = `http://${PI_IP}/stop_audio`;
const SET_VOLUME_URL = `http://${PI_IP}/set_volume`;

// Backend server configuration
const BACKEND_SERVER = "http://192.168.1.6:5000";

// Helper function to get full audio URL
const getFullAudioUrl = (audioUrl: string): string => {
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
    return audioUrl;
  }
  // If it's a relative path, prepend the backend server URL
  return `${BACKEND_SERVER}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
};

type SoundPlayerProps = {
  onOpenLibrary: () => void;
  selectedSound?: Sound | null;
  useRaspberryPi?: boolean; // Toggle between phone and Raspberry Pi playback
};

const SoundPlayer: React.FC<SoundPlayerProps> = ({
  onOpenLibrary,
  selectedSound: externalSelectedSound,
  useRaspberryPi = true, // Default to Raspberry Pi
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSound, setCurrentSound] = useState<Sound | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [position, setPosition] = useState(0); // Current playback position in ms
  const [duration, setDuration] = useState(0); // Total duration in ms
  const [isSeeking, setIsSeeking] = useState(false);
  const [playlist, setPlaylist] = useState<Sound[]>([]); // Available sounds
  const [currentIndex, setCurrentIndex] = useState(0); // Current sound index in playlist
  const soundRef = useRef<Audio.Sound | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useLanguage();

  // Load last played sound and volume from AsyncStorage on mount
  useEffect(() => {
    loadLastPlayedSound();
    loadVolume();
  }, []);

  // Update current sound when external selection changes
  useEffect(() => {
    if (externalSelectedSound) {
      setCurrentSound(externalSelectedSound);
      saveLastPlayedSound(externalSelectedSound);
      // Update index if sound is in playlist
      const index = playlist.findIndex(s => s._id === externalSelectedSound._id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
      playSound(externalSelectedSound);
    }
  }, [externalSelectedSound, playlist]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const loadLastPlayedSound = async () => {
    try {
      // Always load playlist first
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const sounds = await getDefaultSounds(token);
      setPlaylist(sounds);
      
      const savedSound = await AsyncStorage.getItem("lastPlayedSound");
      if (savedSound) {
        const sound: Sound = JSON.parse(savedSound);
        
        // Try to find the sound in the current playlist by title (in case ID changed)
        const freshSound = sounds.find(s => s.title === sound.title);
        if (freshSound) {
          console.log('Refreshing sound with new ID:', freshSound._id);
          setCurrentSound(freshSound);
          // Update saved sound with fresh data
          await saveLastPlayedSound(freshSound);
          
          // Update index
          const index = sounds.findIndex(s => s._id === freshSound._id);
          if (index !== -1) {
            setCurrentIndex(index);
          }
        } else {
          setCurrentSound(sound);
        }
      } else {
        // If no saved sound, load a default one
        await loadDefaultSound();
      }
    } catch (error) {
      console.error("Error loading last played sound:", error);
      await loadDefaultSound();
    }
  };

  const loadPlaylist = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const sounds = await getDefaultSounds(token);
      setPlaylist(sounds); // Store all sounds for prev/next navigation
    } catch (error) {
      console.error("Error loading playlist:", error);
    }
  };

  const loadDefaultSound = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const sounds = await getDefaultSounds(token);
      setPlaylist(sounds); // Store all sounds for prev/next navigation
      if (sounds.length > 0) {
        const firstLullaby = sounds.find((s) => s.category === "lullaby") || sounds[0];
        const index = sounds.findIndex((s) => s._id === firstLullaby._id);
        setCurrentSound(firstLullaby);
        setCurrentIndex(index);
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

  const loadVolume = async () => {
    try {
      const savedVolume = await AsyncStorage.getItem("volume");
      if (savedVolume) {
        const vol = parseFloat(savedVolume);
        setVolume(vol);
      }
    } catch (error) {
      console.error("Error loading volume:", error);
    }
  };

  const saveVolume = async (vol: number) => {
    try {
      await AsyncStorage.setItem("volume", vol.toString());
    } catch (error) {
      console.error("Error saving volume:", error);
    }
  };

  const playSound = async (sound: Sound) => {
    try {
      setIsLoading(true);

      if (useRaspberryPi) {
        // Play through Raspberry Pi with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
          // Get local URL from backend (downloads if necessary)
          const token = await AsyncStorage.getItem("token");
          console.log('Sound ID:', sound._id);
          console.log('Sound object:', JSON.stringify(sound, null, 2));
          
          const localUrlEndpoint = `${BACKEND_SERVER}/api/sounds/${sound._id}/local-url`;
          console.log('Requesting local URL from:', localUrlEndpoint);
          
          const localUrlResponse = await fetch(localUrlEndpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          });

          console.log('Local URL response status:', localUrlResponse.status);

          if (!localUrlResponse.ok) {
            const errorText = await localUrlResponse.text();
            console.error('Failed to get local URL:', errorText);
            throw new Error(`Failed to get local URL: ${localUrlResponse.status}`);
          }

          const { url: localUrl } = await localUrlResponse.json();
          console.log('Got local URL, sending to Raspberry Pi:', localUrl);
          
          const response = await fetch(PLAY_LULLABY_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: localUrl,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            setIsPlaying(true);
            setIsLoading(false);
            
            // Set initial volume on Raspberry Pi
            await setVolumeOnDevice(volume);
            
            // Set duration from sound metadata
            setDuration(sound.duration * 1000); // Convert seconds to milliseconds
            setPosition(0);
            
            // Start progress simulation after 1 second delay
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
            
            setTimeout(() => {
              progressIntervalRef.current = setInterval(() => {
                setPosition(prev => {
                  const newPos = prev + 1000; // Increment by 1 second
                  if (newPos >= sound.duration * 1000) {
                    // Song finished
                    if (progressIntervalRef.current) {
                      clearInterval(progressIntervalRef.current);
                    }
                    setIsPlaying(false);
                    setPosition(0);
                    return 0;
                  }
                  return newPos;
                });
              }, 1000);
            }, 1000); // Wait 1 second before starting progress
            
            Alert.alert("🎵", `Playing "${sound.title}" on baby monitor`);
          } else {
            const errorText = await response.text();
            console.error('Raspberry Pi error:', errorText);
            throw new Error('Raspberry Pi returned error: ' + response.status);
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error('Connection timeout. Is Raspberry Pi running?');
          }
          throw fetchError;
        }
      } else {
        // Play on phone (original implementation)
        // Unload previous sound
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        // Reset position and duration when loading new sound
        setPosition(0);
        setDuration(0);

        // Set audio mode for playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        // Load and play new sound with full URL
        const fullAudioUrl = getFullAudioUrl(sound.audioUrl);
        console.log('Playing audio from:', fullAudioUrl);
        
        const { sound: audioSound } = await Audio.Sound.createAsync(
          { uri: fullAudioUrl },
          { shouldPlay: true, volume: volume, isLooping: true }
        );

        soundRef.current = audioSound;
        setIsPlaying(true);
        setIsLoading(false);

        // Listen for playback status and update position/duration
        audioSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (!isSeeking) {
              setPosition(status.positionMillis);
              setDuration(status.durationMillis || 0);
            }
            if (status.didJustFinish && !status.isLooping) {
              setIsPlaying(false);
              setPosition(0);
            }
          }
        });
      }
    } catch (error: any) {
      console.error("Error playing sound:", error);
      const errorMessage = error.message || "Unknown error occurred";
      
      if (errorMessage.includes('timeout') || errorMessage.includes('Network request failed')) {
        Alert.alert(
          "Connection Error", 
          "Cannot connect to baby monitor.\n\nPlease check:\n• Raspberry Pi is powered on\n• Both devices are on same WiFi\n• IP address is correct (192.168.1.44)"
        );
      } else {
        Alert.alert("Error", `Could not play sound: ${errorMessage}`);
      }
      
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const pauseSound = async () => {
    try {
      if (useRaspberryPi) {
        // Stop sound on Raspberry Pi
        const response = await fetch(STOP_AUDIO_URL, { method: 'POST' });
        if (response.ok) {
          setIsPlaying(false);
          
          // Stop progress simulation
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          
          // Reset position
          setPosition(0);
        }
      } else {
        // Pause on phone
        if (soundRef.current) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        }
      }
    } catch (error) {
      console.error("Error pausing sound:", error);
      Alert.alert("Error", "Could not stop sound");
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
      if (useRaspberryPi) {
        // For Raspberry Pi, always play the current sound
        if (currentSound) {
          playSound(currentSound);
        }
      } else {
        // For phone, check if sound is loaded
        if (soundRef.current) {
          resumeSound();
        } else if (currentSound) {
          playSound(currentSound);
        }
      }
    }
  };

  const setVolumeOnDevice = async (newVolume: number) => {
    try {
      if (useRaspberryPi) {
        // Send volume to Raspberry Pi (0.0 - 1.0)
        const response = await fetch(SET_VOLUME_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ volume: newVolume }),
        });

        if (response.ok) {
          console.log(`Volume set to ${Math.round(newVolume * 100)}% on Raspberry Pi`);
        } else {
          console.error('Failed to set volume on Raspberry Pi');
        }
      } else {
        // Set volume on phone
        if (soundRef.current) {
          await soundRef.current.setVolumeAsync(newVolume);
        }
      }
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  };

  const handleVolumeDown = async () => {
    const newVolume = Math.max(0, volume - 0.1);
    setVolume(newVolume);
    await setVolumeOnDevice(newVolume);
  };

  const handleVolumeUp = async () => {
    const newVolume = Math.min(1, volume + 0.1);
    setVolume(newVolume);
    await setVolumeOnDevice(newVolume);
  };

  const handleSeek = async (value: number) => {
    if (soundRef.current && duration > 0) {
      setIsSeeking(true);
      const newPosition = value * duration;
      await soundRef.current.setPositionAsync(newPosition);
      setPosition(newPosition);
      setIsSeeking(false);
    }
  };

  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePrevious = () => {
    if (playlist.length === 0) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
    const prevSound = playlist[newIndex];
    setCurrentIndex(newIndex);
    setCurrentSound(prevSound);
    saveLastPlayedSound(prevSound);
    playSound(prevSound);
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    const newIndex = currentIndex < playlist.length - 1 ? currentIndex + 1 : 0;
    const nextSound = playlist[newIndex];
    setCurrentIndex(newIndex);
    setCurrentSound(nextSound);
    saveLastPlayedSound(nextSound);
    playSound(nextSound);
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
            style={[styles.controlBtn, { backgroundColor: theme.surface }]}
            onPress={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            disabled={playlist.length === 0}
          >
            <Ionicons name="play-skip-back" size={24} color={theme.text} />
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
            style={[styles.controlBtn, { backgroundColor: theme.surface }]}
            onPress={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            disabled={playlist.length === 0}
          >
            <Ionicons name="play-skip-forward" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Volume Controls */}
        <View style={styles.volumeControls}>
          <TouchableOpacity
            style={[styles.volumeBtn, { backgroundColor: theme.surface }]}
            onPress={(e) => {
              e.stopPropagation();
              handleVolumeDown();
            }}
          >
            <Ionicons name="volume-low" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={styles.volumeIndicator}>
            <View style={[styles.volumeBarBg, { backgroundColor: theme.border }]}>
              <View
                style={[styles.volumeBarFill, { width: `${volume * 100}%`, backgroundColor: theme.primary }]}
              />
            </View>
            <Text style={[styles.volumeText, { color: theme.textSecondary }]}>{Math.round(volume * 100)}%</Text>
          </View>

          <TouchableOpacity
            style={[styles.volumeBtn, { backgroundColor: theme.surface }]}
            onPress={(e) => {
              e.stopPropagation();
              handleVolumeUp();
            }}
          >
            <Ionicons name="volume-high" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Seek Bar with Time */}
        <View style={styles.seekContainer}>
          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
            {formatTime(position)}
          </Text>
          <TouchableOpacity
            style={styles.seekBarWrapper}
            activeOpacity={1}
            onPress={(e) => {
              e.stopPropagation();
              const { locationX } = e.nativeEvent;
              const seekBarWidth = e.currentTarget.measure((x, y, width) => {
                const percentage = locationX / width;
                handleSeek(percentage);
              });
            }}
          >
            <View style={[styles.seekBarBg, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.seekBarFill,
                  {
                    width: duration > 0 ? `${(position / duration) * 100}%` : '0%',
                    backgroundColor: theme.primary,
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
            {formatTime(duration)}
          </Text>
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
    justifyContent: "center",
    gap: 16,
  },
  controlBtn: {
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 25,
    width: 50,
    height: 50,
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
  volumeControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  volumeBtn: {
    padding: 6,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  seekContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeText: {
    fontSize: 11,
    color: "#666",
    width: 40,
    textAlign: "center",
  },
  seekBarWrapper: {
    flex: 1,
    paddingVertical: 4,
  },
  seekBarBg: {
    height: 4,
    backgroundColor: "#eee",
    borderRadius: 2,
    overflow: "hidden",
  },
  seekBarFill: {
    height: 4,
    backgroundColor: "#A2E884",
    borderRadius: 2,
  },
  volumeIndicator: {
    flex: 1,
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
