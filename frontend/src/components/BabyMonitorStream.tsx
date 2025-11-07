import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { Audio } from "expo-av";

type BabyMonitorStreamProps = {
  babyName?: string;
  useDeviceCamera?: boolean;
};

const BabyMonitorStream: React.FC<BabyMonitorStreamProps> = ({
  babyName = "Baby",
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [facing, setFacing] = useState<CameraType>("front");
  const [permission, requestPermission] = useCameraPermissions();
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const cameraRef = useRef<CameraView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pollTimer = useRef<number | null>(null);

  // Auto-start audio monitoring when permissions granted
  useEffect(() => {
    if (!audioPermission) return;
    const ensureAudio = async () => {
      if (!audioPermission.granted) {
        if (audioPermission.canAskAgain) {
          const res = await requestAudioPermission();
          if (res.granted && !isListening) {
            startListening();
          }
        }
      } else {
        if (!isListening) {
          startListening();
        }
      }
    };
    ensureAudio();
  }, [audioPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const startListening = async () => {
    try {
      if (!audioPermission?.granted) {
        const res = await requestAudioPermission();
        if (!res.granted) return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      const recording = new Audio.Recording();
      const opts: any = { ...(Audio.RecordingOptionsPresets.HIGH_QUALITY as any) };
      opts.isMeteringEnabled = true;
      await recording.prepareToRecordAsync(opts);

      await recording.startAsync();
      recordingRef.current = recording;
      setIsListening(true);

      // Poll metering for audio level
      if (pollTimer.current) clearInterval(pollTimer.current as any);
      pollTimer.current = (setInterval(async () => {
        try {
          const status = await recording.getStatusAsync();
          const dB = (status as any).metering ?? -160;
          const normalized = Math.max(0, Math.min(1, 1 - Math.abs(dB) / 160));
          setAudioLevel(normalized);
        } catch (e) {
          // ignore
        }
      }, 200) as unknown) as number;
    } catch (e) {
      console.warn("Failed to start microphone:", e);
    }
  };

  const stopListening = async () => {
    try {
      if (pollTimer.current) {
        clearInterval(pollTimer.current as any);
        pollTimer.current = null;
      }
      if (recordingRef.current) {
        const rec = recordingRef.current;
        try {
          await rec.stopAndUnloadAsync();
        } catch {}
        recordingRef.current = null;
      }
      setIsListening(false);
      setAudioLevel(0);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, staysActiveInBackground: false });
    } catch (e) {
      // ignore
    }
  };

  const toggleAudioMonitoring = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        console.log("Taking picture...");
        
        // Take the picture
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: false,
          exif: false,
        });
        
        console.log("Photo taken:", photo);
        
        if (photo && photo.uri) {
          // Request permission to save to media library
          const { status } = await MediaLibrary.requestPermissionsAsync();
          
          if (status === "granted") {
            // Save to gallery
            const asset = await MediaLibrary.createAssetAsync(photo.uri);
            console.log("Photo saved to gallery:", asset);
            
            Alert.alert(
              "📸 Photo Saved!",
              "The baby monitor screenshot has been saved to your gallery.",
              [{ text: "OK" }]
            );
          } else {
            // Permission denied, but still show the URI
            Alert.alert(
              "Photo Captured!",
              `Picture taken but not saved to gallery.\n\nTemporary path: ${photo.uri}`,
              [{ text: "OK" }]
            );
          }
        }
      } catch (error: any) {
        console.error("Error taking picture:", error);
        Alert.alert("Error", `Failed to take picture: ${error.message || "Unknown error"}`);
      }
    } else {
      console.warn("Camera ref is not available");
      Alert.alert("Error", "Camera is not ready yet");
    }
  };

  // Check permissions
  if (!permission) {
    return (
      <View style={styles.normalContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.normalContainer}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={60} color="#ccc" />
          <Text style={styles.permissionText}>Camera Permission Required</Text>
          <Text style={styles.permissionSubtext}>
            Allow access to use the baby monitor
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderCamera = (isFullscreenMode: boolean) => {
    const containerStyle = isFullscreenMode
      ? styles.fullscreenContainer
      : styles.normalContainer;

    return (
      <View style={containerStyle}>
        {/* Camera Header */}
        <View style={styles.cameraHeader}>
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

        {/* Camera View */}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        />

        {/* Audio Level Overlay - Top of video */}
        <View style={styles.audioOverlay}>
          <View style={styles.audioStatusRow}>
            <Ionicons 
              name={isListening ? "mic" : "mic-off"} 
              size={16} 
              color={isListening ? "#36c261" : "#999"} 
            />
            <Text style={[styles.audioStatusText, isListening && styles.audioStatusActive]}>
              {isListening ? "Listening" : "Audio Off"}
            </Text>
          </View>
          <View style={styles.audioMeterContainer}>
            <View style={styles.audioMeterBg}>
              <View 
                style={[
                  styles.audioMeterFill, 
                  { width: `${Math.round(audioLevel * 100)}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Camera Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            onPress={toggleCameraFacing}
            style={styles.controlButton}
          >
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={takePicture} style={styles.controlButton}>
            <Ionicons name="camera" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={toggleAudioMonitoring} 
            style={[styles.controlButton, isListening && styles.controlButtonActive]}
          >
            <Ionicons name={isListening ? "mic" : "mic-off"} size={24} color="#fff" />
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
  },
  fullscreenWrapper: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
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
  controlButton: {
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonActive: {
    backgroundColor: "#36c261",
  },
  audioOverlay: {
    position: "absolute",
    top: 50,
    left: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 8,
    padding: 10,
    zIndex: 5,
  },
  audioStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  audioStatusText: {
    color: "#999",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  audioStatusActive: {
    color: "#36c261",
  },
  audioMeterContainer: {
    width: "100%",
  },
  audioMeterBg: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  audioMeterFill: {
    height: 6,
    backgroundColor: "#A2E884",
    borderRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  permissionText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  permissionSubtext: {
    color: "#ccc",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: "#A2E884",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default BabyMonitorStream;
