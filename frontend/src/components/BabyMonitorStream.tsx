import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  useWindowDimensions,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio, Video, AVPlaybackStatus, ResizeMode } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

type BabyMonitorStreamProps = {
  babyName?: string;
  onStopMusic?: () => void;
};

const PI_IP = "192.168.1.44:5001";
const SNAPSHOT_URL = `http://${PI_IP}/snapshot`;
const TALKBACK_URL = `http://${PI_IP}/talkback`;
const STOP_AUDIO_URL = `http://${PI_IP}/stop_audio`;
const AUDIO_STREAM_URL = `http://${PI_IP}/audio_stream`;

const BabyMonitorStream: React.FC<BabyMonitorStreamProps> = ({
  babyName = "Baby",
  onStopMusic,
}) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();
  const [isListening, setIsListening] = useState(false);
  const [audioSound, setAudioSound] = useState<Audio.Sound | null>(null);
  
  // Ghost Buffer strategy - Main image + invisible buffer
  const [currentUrl, setCurrentUrl] = useState(`${SNAPSHOT_URL}?t=${Date.now()}`);
  const [bufferUrl, setBufferUrl] = useState(`${SNAPSHOT_URL}?t=${Date.now()}`);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const intervalRef = useRef<number | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [recordings, setRecordings] = useState<string[]>([]);
  const [showEvents, setShowEvents] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [currentVideoName, setCurrentVideoName] = useState<string>('');
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const videoRef = useRef<Video>(null);
  
  // Detectează orientarea ecranului
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Start/stop video refresh when component mounts/unmounts
  useEffect(() => {
    const triggerNext = () => {
      const timestamp = Date.now();
      setBufferUrl(`${SNAPSHOT_URL}?t=${timestamp}`);
    };
    triggerNext();
  }, [refreshTrigger]);

  // Update clock every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  // Sync MONITORED baby ID with Raspberry Pi when component mounts
  // IMPORTANT: Uses monitoredBabyId (not selectedBabyId) - only babies explicitly marked for monitoring
  useEffect(() => {
    const syncBabyIdWithPi = async () => {
      try {
        // Read the MONITORED baby ID (user explicitly confirmed they want live monitoring)
        const monitoredBabyId = await AsyncStorage.getItem('monitoredBabyId');
        
        if (!monitoredBabyId) {
          console.warn('⚠️ [Baby Monitor] No baby set for live monitoring');
          console.log('ℹ️ [Baby Monitor] User needs to select a baby and confirm monitoring');
          return;
        }

        // Step 1: Check what baby ID is currently set on Pi
        console.log('🔍 [Baby Monitor] Checking baby ID on Pi...');
        const getResponse = await fetch(`http://${PI_IP}/get_baby`);
        
        if (getResponse.ok) {
          const currentPiBaby = await getResponse.json();
          console.log('📥 [Baby Monitor] Pi current baby:', currentPiBaby);
          
          // Step 2: Only update if different or not set
          if (currentPiBaby.babyId === monitoredBabyId) {
            console.log('✅ [Baby Monitor] Monitored baby ID already correct on Pi:', monitoredBabyId);
            return; // Baby ID is already correct, no need to update
          }
          
          // Step 3: Baby ID is different or not set - update it
          console.log(`🔄 [Baby Monitor] Updating Pi monitored baby ID: ${currentPiBaby.babyId || 'null'} → ${monitoredBabyId}`);
          
          const setResponse = await fetch(`http://${PI_IP}/set_baby`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ babyId: monitoredBabyId }),
          });

          if (setResponse.ok) {
            const data = await setResponse.json();
            console.log('✅ [Baby Monitor] Monitored baby ID updated on Pi:', data);
          } else {
            console.warn('⚠️ [Baby Monitor] Failed to update baby ID on Pi:', setResponse.status);
          }
        } else {
          console.warn('⚠️ [Baby Monitor] Could not check Pi baby ID, setting anyway...');
          // If we can't check, just set it to be safe
          await fetch(`http://${PI_IP}/set_baby`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ babyId: monitoredBabyId }),
          });
        }
      } catch (error) {
        console.error('❌ [Baby Monitor] Error syncing baby ID with Pi:', error);
      }
    };

    syncBabyIdWithPi();
  }, []); // Run only once when component mounts

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioSound) {
        audioSound.stopAsync().then(() => audioSound.unloadAsync());
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  // Toggle microphone: start/stop recording
  async function toggleMicrophone() {
    if (recording) {
      // Stop recording
      await stopRecording();
    } else {
      // Start recording
      await startRecording();
    }
  }

  // Toggle audio listening: start/stop listening to baby monitor audio
  async function toggleAudioListening() {
    if (isListening) {
      // Stop listening
      await stopAudioListening();
    } else {
      // Start listening
      await startAudioListening();
    }
  }

  // Start listening to audio stream from Pi
  async function startAudioListening() {
    try {
      // Stop any talkback recording first
      if (recording) {
        await stopRecording();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      console.log('🎧 Pornesc audio streaming de la Pi...');
      const { sound } = await Audio.Sound.createAsync(
        { uri: AUDIO_STREAM_URL },
        { shouldPlay: true, volume: 1.0 },
        null
      );

      setAudioSound(sound);
      setIsListening(true);
      console.log('🎧 Audio streaming pornit!');
    } catch (err) {
      console.error('Eroare la pornirea audio streaming:', err);
      Alert.alert(t('common.error'), 'Nu pot porni audio streaming');
    }
  }

  // Stop listening to audio stream
  async function stopAudioListening() {
    try {
      if (audioSound) {
        console.log('🎧 Opresc audio streaming...');
        await audioSound.stopAsync();
        await audioSound.unloadAsync();
        setAudioSound(null);
      }
      setIsListening(false);
      console.log('🎧 Audio streaming oprit');
    } catch (err) {
      console.error('Eroare la oprirea audio streaming:', err);
    }
  }

  // Start recording voice to send to Raspberry Pi
  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        // Stop music first - both on Pi and in UI
        try {
          await fetch(STOP_AUDIO_URL, { method: 'POST' });
          // Update UI state
          if (onStopMusic) {
            onStopMusic();
          }
        } catch (e) {
          console.error('Failed to stop music:', e);
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.LOW_QUALITY // Calitate joasă = viteză mare de transmitere
        );
        setRecording(recording);
      }
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  // Stop recording and send audio to Raspberry Pi
  async function stopRecording() {
    setRecording(null);
    await recording?.stopAndUnloadAsync();
    const uri = recording?.getURI();

    if (uri) {
      // Trimitem fișierul către Raspberry Pi
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/wav',
        name: 'talkback.wav',
      } as any);

      try {
        await fetch(`http://${PI_IP}/talkback`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } catch (e) {
        console.error("Talkback error:", e);
      }
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const takePicture = () => {
    Alert.alert("📸", "Screenshot feature coming soon!");
  };

  const fetchRecordings = async () => {
    try {
      const response = await fetch(`http://${PI_IP}/list_recordings`);
      const data = await response.json();
      setRecordings(data);
      setShowEvents(true);
    } catch (error) {
      Alert.alert(t('common.error'), t('monitor.errorFetchList'));
      console.error(error);
    }
  };

  const playVideo = (filename: string) => {
    const videoUrl = `http://${PI_IP}/get_video/${filename}`;
    // Convertim .h264 în .mp4 pentru compatibilitate iOS
    const compatibleUrl = videoUrl.replace('.h264', '.mp4');
    setCurrentVideoUrl(compatibleUrl);
    setCurrentVideoName(filename);
    setShowVideoPlayer(true);
    setShowEvents(false); // Închidem lista când deschidem video-ul
  };

  const closeVideoPlayer = async () => {
    if (videoRef.current) {
      await videoRef.current.stopAsync();
      await videoRef.current.unloadAsync();
    }
    setShowVideoPlayer(false);
    setCurrentVideoUrl('');
    setIsVideoFullscreen(false);
    setShowEvents(true); // Revine la lista de videouri
  };

  const renderCamera = (isFullscreenMode: boolean) => {
    const containerStyle = isFullscreenMode
      ? styles.fullscreenContainer
      : styles.normalContainer;

    return (
      <View style={containerStyle}>
        {/* Camera Header */}
        {!isFullscreenMode && (
          <View style={styles.cameraHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <Text style={styles.babyNameText}>{babyName}</Text>
            </View>
          </View>
        )}
        
        {/* Close button in fullscreen */}
        {isFullscreenMode && (
          <TouchableOpacity onPress={toggleFullscreen} style={styles.closeButtonFullscreen}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Date and Time in fullscreen */}
        {isFullscreenMode && (
          <View style={styles.dateTimeOverlay}>
            <Text style={styles.dateTimeText}>
              {currentDateTime.toLocaleDateString('ro-RO', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              })} {currentDateTime.toLocaleTimeString('ro-RO', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </Text>
          </View>
        )}

        {/* Video Stream from Raspberry Pi - Ghost Buffer Strategy */}
        <View style={styles.videoWrapper}>
          {/* IMAGINEA PRINCIPALĂ (Cea vizibilă) */}
          <Image
            source={{ uri: currentUrl, cache: 'force-cache' }}
            style={
              isFullscreenMode 
                ? { position: 'absolute', width: height, height: width, transform: [{ rotate: '90deg' }] }
                : StyleSheet.absoluteFill
            }
            resizeMode="cover"
          />

          {/* IMAGINEA BUFFER (Invizibilă, doar pentru pre-încărcare) */}
          <Image
            source={{ uri: bufferUrl, cache: 'force-cache' }}
            style={{ width: 0, height: 0, opacity: 0 }} // Complet invizibilă
            onLoad={() => {
              // 1. Mutăm URL-ul imediat în imaginea vizibilă
              setCurrentUrl(bufferUrl);
              
              // 2. Reducem timpul de așteptare la 15ms.
              // 100ms era prea mult (tăia practic 10 cadre pe secundă).
              // 15ms este imperceptibil pentru ochiul uman, dar oferă procesorului
              // un moment de răsuflare să nu blocheze interfața (UI Thread).
              setTimeout(() => setRefreshTrigger(prev => prev + 1), 15);
            }}
          />
        </View>

        {/* Status Overlay */}
        {recording && (
          <View style={styles.statusOverlay}>
            <View style={styles.statusRow}>
              <Ionicons name="mic" size={16} color="#FF6B6B" />
              <Text style={styles.statusText}>Recording...</Text>
            </View>
          </View>
        )}
        {isListening && (
          <View style={[styles.statusOverlay, { top: recording ? 90 : 50 }]}>
            <View style={styles.statusRow}>
              <Ionicons name="headset" size={16} color="#4CAF50" />
              <Text style={styles.statusText}>Listening...</Text>
            </View>
          </View>
        )}

        {/* Camera Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={takePicture} style={styles.controlButton}>
            <View style={isFullscreenMode ? { transform: [{ rotate: '90deg' }] } : undefined}>
              <Ionicons 
                name="camera" 
                size={24} 
                color="#fff" 
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={toggleMicrophone}
            style={[styles.controlButton, recording && styles.controlButtonSpeaking]}
          >
            <View style={isFullscreenMode ? { transform: [{ rotate: '90deg' }] } : undefined}>
              <Ionicons 
                name="mic" 
                size={24} 
                color="#fff"
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={toggleAudioListening}
            style={[styles.controlButton, isListening && { backgroundColor: "#4CAF50" }]}
          >
            <View style={isFullscreenMode ? { transform: [{ rotate: '90deg' }] } : undefined}>
              <Ionicons 
                name={isListening ? "headset" : "headset-outline"}
                size={24} 
                color="#fff"
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={fetchRecordings} 
            style={styles.controlButton}
          >
            <View style={isFullscreenMode ? { transform: [{ rotate: '90deg' }] } : undefined}>
              <Ionicons name="list" size={24} color="#fff" />
            </View>
          </TouchableOpacity>

          {!isFullscreenMode && (
            <TouchableOpacity
              onPress={toggleFullscreen}
              style={styles.controlButton}
            >
              <Ionicons name="expand" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Normal View */}
      {renderCamera(false)}

      {/* Fullscreen Modal */}
      <Modal
        visible={isFullscreen}
        animationType="fade"
        onRequestClose={toggleFullscreen}
        supportedOrientations={["portrait", "landscape"]}
      >
        <View style={styles.fullscreenWrapper}>
          {renderCamera(true)}
        </View>
      </Modal>

      {/* Recordings Modal */}
      <Modal
        visible={showEvents}
        animationType="slide"
        onRequestClose={() => setShowEvents(false)}
        transparent={false}
      >
        <View style={[styles.recordingsModalContainer, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.recordingsHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <Text style={[styles.recordingsTitle, { color: theme.text }]}>{t('monitor.detectedEvents')}</Text>
            <TouchableOpacity onPress={() => setShowEvents(false)} style={styles.closeModalButton}>
              <Ionicons name="close-circle" size={32} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={[styles.recordingsSubtitle, { color: theme.textSecondary, backgroundColor: theme.surface }]}>
            {t('monitor.last24Hours')} • {recordings.length} {recordings.length === 1 ? t('monitor.event') : t('monitor.events')}
          </Text>

          {/* Recordings List */}
          <ScrollView 
            style={styles.recordingsScroll}
            contentContainerStyle={styles.recordingsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {recordings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="videocam-off-outline" size={64} color={theme.textTertiary} />
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>{t('monitor.noMotion')}</Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.textTertiary }]}>{t('monitor.videosAutomatic')}</Text>
              </View>
            ) : (
              recordings.map((file, index) => {
                const timeMatch = file.match(/(\d{8})-(\d{4})/);
                let displayTime = t('monitor.now');
                if (timeMatch) {
                  const date = timeMatch[1];
                  const time = timeMatch[2];
                  // Format based on language
                  const formattedDate = language === 'ro' 
                    ? `${date.slice(6, 8)}.${date.slice(4, 6)}.${date.slice(0, 4)}`
                    : `${date.slice(4, 6)}/${date.slice(6, 8)}/${date.slice(0, 4)}`;
                  const formattedTime = `${time.slice(0, 2)}:${time.slice(2, 4)}`;
                  displayTime = `${formattedDate} ${t('monitor.at')} ${formattedTime}`;
                }

                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.recordingCard, { backgroundColor: theme.card, borderColor: theme.border }]} 
                    onPress={() => playVideo(file)}
                    activeOpacity={0.7}
                  >
                    {/* Thumbnail */}
                    <View style={styles.thumbnailContainer}>
                      {/* Placeholder pentru thumbnail - va fi înlocuit cu imagine reală de la server */}
                      <Image 
                        source={{ uri: `http://${PI_IP}/get_thumbnail/${file.replace('.h264', '.jpg')}` }}
                        style={styles.thumbnail}
                        defaultSource={require('../../assets/images/partial-react-logo.png')}
                      />
                      <View style={styles.playOverlay}>
                        <Ionicons name="play-circle" size={48} color="rgba(255, 255, 255, 0.9)" />
                      </View>
                      <View style={styles.durationBadge}>
                        <Ionicons name="time-outline" size={12} color="#fff" />
                        <Text style={styles.durationText}>~30s</Text>
                      </View>
                    </View>

                    {/* Info */}
                    <View style={styles.recordingInfo}>
                      <View style={styles.recordingHeader}>
                        <View style={styles.recordingTitleRow}>
                          <Ionicons name="alert-circle" size={18} color="#FF6B6B" />
                          <Text style={[styles.recordingTitle, { color: theme.text }]}>{t('monitor.motionDetected')}</Text>
                        </View>
                        <Text style={[styles.recordingIndex, { color: theme.textTertiary }]}>#{recordings.length - index}</Text>
                      </View>
                      <Text style={[styles.recordingTime, { color: theme.textSecondary }]}>{displayTime}</Text>
                      <Text style={[styles.recordingFilename, { color: theme.textTertiary }]}>{file}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Video Player Modal */}
      <Modal
        visible={showVideoPlayer}
        animationType="slide"
        onRequestClose={closeVideoPlayer}
        transparent={false}
        supportedOrientations={["portrait", "landscape"]}
      >
        <View style={[styles.videoPlayerContainer, { backgroundColor: theme.background }]}>
          {/* Back button - doar dacă nu e fullscreen */}
          {!isVideoFullscreen && (
            <TouchableOpacity onPress={closeVideoPlayer} style={styles.backButtonVideo} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Close button in fullscreen */}
          {isVideoFullscreen && (
            <TouchableOpacity 
              onPress={() => setIsVideoFullscreen(false)} 
              style={styles.closeButtonVideoFullscreen}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Video Player */}
          <View style={isVideoFullscreen ? styles.videoContainerFullscreen : styles.videoContainerNormal}>
            {currentVideoUrl ? (
              <Video
                ref={videoRef}
                source={{ uri: currentVideoUrl }}
                style={isVideoFullscreen 
                  ? { width: height, height: width, transform: [{ rotate: '90deg' }] }
                  : styles.videoPlayer
                }
                useNativeControls
                resizeMode={ResizeMode.COVER}
                shouldPlay
                rate={1.0}
                shouldCorrectPitch={true}
                onError={(error) => {
                  console.error('Video error:', error);
                  Alert.alert(t('common.error'), t('monitor.errorPlayVideo'));
                }}
              />
            ) : null}
          </View>

          {/* Fullscreen Button - doar dacă nu e fullscreen */}
          {!isVideoFullscreen && (
            <TouchableOpacity
              onPress={() => setIsVideoFullscreen(true)}
              style={styles.fullscreenVideoButton}
            >
              <Ionicons name="expand" size={32} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  normalContainer: {
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
    margin: 16,
    marginTop: 8,
    height: 250,
  },
  fullscreenContainer: {
    backgroundColor: "#000",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenWrapper: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  cameraHeaderFullscreen: {
    top: 0,
    paddingTop: 60,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginRight: 6,
  },
  liveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  babyNameText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonFullscreen: {
    position: "absolute",
    top: 60,
    right: 16,
    padding: 8,
    zIndex: 20,
  },
  dateTimeOverlay: {
    position: "absolute",
    top: "48%",
    right: 3,
    zIndex: 20,
    transform: [{ rotate: '90deg' }, { translateY: -50 }],
  },
  dateTimeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  videoWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  controlsContainerLandscape: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    bottom: "auto",
    top: "50%",
    right: 16,
    left: "auto",
    width: 60,
    transform: [{ translateY: -75 }],
    gap: 16,
  },
  controlButton: {
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonSpeaking: {
    backgroundColor: "#FF6B6B",
  },
  statusOverlay: {
    position: "absolute",
    top: 50,
    left: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 8,
    padding: 10,
    zIndex: 5,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  // Recordings Modal Styles
  recordingsModalContainer: {
    flex: 1,
  },
  recordingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  recordingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeModalButton: {
    padding: 4,
  },
  recordingsSubtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  recordingsScroll: {
    flex: 1,
  },
  recordingsScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  recordingCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  recordingInfo: {
    padding: 12,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recordingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recordingIndex: {
    fontSize: 14,
    fontWeight: '600',
  },
  recordingTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  recordingFilename: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  // Video Player Modal Styles
  videoPlayerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  videoPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  backButtonVideo: {
    position: 'absolute',
    top: 60,
    left: 16,
    padding: 8,
    zIndex: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  videoPlayerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  videoPlayerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  videoPlayerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  videoContainerNormal: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainerFullscreen: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideoButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonVideoFullscreen: {
    position: 'absolute',
    top: 60,
    right: 16,
    padding: 8,
    zIndex: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
});

export default BabyMonitorStream;
