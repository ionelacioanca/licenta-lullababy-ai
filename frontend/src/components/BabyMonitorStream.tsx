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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";

type BabyMonitorStreamProps = {
  babyName?: string;
  onStopMusic?: () => void;
};

const PI_IP = "192.168.1.44:5001";
const SNAPSHOT_URL = `http://${PI_IP}/snapshot`;
const TALKBACK_URL = `http://${PI_IP}/talkback`;
const STOP_AUDIO_URL = `http://${PI_IP}/stop_audio`;

const BabyMonitorStream: React.FC<BabyMonitorStreamProps> = ({
  babyName = "Baby",
  onStopMusic,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();
  const [currentUrl, setCurrentUrl] = useState(`${SNAPSHOT_URL}?t=${Date.now()}`);
  const [nextUrl, setNextUrl] = useState(`${SNAPSHOT_URL}?t=${Date.now()}`);
  const intervalRef = useRef<number | null>(null);
  
  // Detectează orientarea ecranului
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Start/stop video refresh when component mounts/unmounts
  useEffect(() => {
    // Pregătim următorul frame la fiecare 100ms
    intervalRef.current = setInterval(() => {
      setNextUrl(`${SNAPSHOT_URL}?t=${Date.now()}`);
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
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

  const renderCamera = (isFullscreenMode: boolean) => {
    const containerStyle = isFullscreenMode
      ? styles.fullscreenContainer
      : styles.normalContainer;

    return (
      <View style={containerStyle}>
        {/* Camera Header */}
        <View style={[styles.cameraHeader, isFullscreenMode && styles.cameraHeaderFullscreen]}>
          <View style={styles.headerLeft}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.babyNameText}>{babyName}</Text>
          </View>
          {isFullscreenMode && (
            <TouchableOpacity onPress={toggleFullscreen} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Video Stream from Raspberry Pi */}
        <View style={styles.videoWrapper}>
          {/* Imaginea de fundal (frame-ul vechi) */}
          <Image
            source={{ uri: currentUrl }}
            style={
              isFullscreenMode 
                ? { position: 'absolute', width: height, height: width, transform: [{ rotate: '-90deg' }] }
                : StyleSheet.absoluteFill
            }
            resizeMode="cover"
            fadeDuration={0}
          />
          {/* Imaginea nouă care se încarcă deasupra */}
          <Image
            source={{ uri: nextUrl }}
            style={
              isFullscreenMode 
                ? { position: 'absolute', width: height, height: width, transform: [{ rotate: '-90deg' }] }
                : StyleSheet.absoluteFill
            }
            resizeMode="cover"
            fadeDuration={0}
            onLoad={() => {
              // Când frame-ul nou e gata, devine frame-ul curent
              setCurrentUrl(nextUrl);
            }}
            onError={(error) => {
              console.error('Frame error:', error.nativeEvent.error);
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

        {/* Camera Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={takePicture} style={styles.controlButton}>
            <Ionicons name="camera" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={toggleMicrophone}
            style={[styles.controlButton, recording && styles.controlButtonSpeaking]}
          >
            <Ionicons name="mic" size={24} color="#fff" />
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
    top: 40,
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
});

export default BabyMonitorStream;
