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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";

type BabyMonitorStreamProps = {
  babyName?: string;
};

// Raspberry Pi Camera Configuration
const PI_IP = "192.168.1.44:5001";
const VIDEO_FEED_URL = `http://${PI_IP}/video_feed`;
const SPEAK_URL = `http://${PI_IP}/speak`;

const BabyMonitorStream: React.FC<BabyMonitorStreamProps> = ({
  babyName = "Baby",
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();
  const [videoKey, setVideoKey] = useState(0);
  
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  // Refresh video feed every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setVideoKey(prev => prev + 1);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Start recording voice to send to Raspberry Pi
  const startSpeaking = async () => {
    try {
      if (!audioPermission?.granted) {
        const res = await requestAudioPermission();
        if (!res.granted) {
          Alert.alert("Permission Required", "Microphone access is needed to speak to your baby");
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsSpeaking(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Could not start microphone");
    }
  };

  // Stop recording and send audio to Raspberry Pi
  const stopSpeaking = async () => {
    try {
      if (!recordingRef.current) return;
      
      const recording = recordingRef.current;
      setIsSpeaking(false);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        setIsLoading(true);
        
        try {
          // Read audio file and convert to blob
          const fileResponse = await fetch(uri);
          const audioBlob = await fileResponse.blob();
          
          // Create FormData and send to Raspberry Pi
          const formData = new FormData();
          formData.append('audio', audioBlob, 'voice.m4a');
          
          const uploadResponse = await fetch(SPEAK_URL, {
            method: 'POST',
            body: formData,
          });
          
          if (uploadResponse.ok) {
            Alert.alert("✅", "Voice sent successfully");
          } else {
            const errorText = await uploadResponse.text();
            console.error("Server response:", errorText);
            Alert.alert("Error", "Failed to send voice");
          }
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          Alert.alert("Error", "Could not connect to baby monitor");
        } finally {
          setIsLoading(false);
        }
      }
      
      recordingRef.current = null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (error) {
      console.error("Error stopping recording:", error);
      Alert.alert("Error", "Could not send voice");
      setIsSpeaking(false);
      setIsLoading(false);
    }
  };

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

        {/* Video Stream from Raspberry Pi */}
        <View style={styles.videoWrapper}>
          <Image
            key={videoKey}
            source={{ uri: `${VIDEO_FEED_URL}?t=${Date.now()}` }}
            style={styles.video}
            resizeMode="contain"
          />
        </View>

        {/* Status Overlay */}
        {(isSpeaking || isLoading) && (
          <View style={styles.statusOverlay}>
            {isSpeaking && (
              <View style={styles.statusRow}>
                <Ionicons name="mic" size={16} color="#FF6B6B" />
                <Text style={styles.statusText}>Recording...</Text>
              </View>
            )}
            {isLoading && (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color="#A2E884" />
                <Text style={styles.statusText}>Sending voice...</Text>
              </View>
            )}
          </View>
        )}

        {/* Camera Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={takePicture} style={styles.controlButton}>
            <Ionicons name="camera" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPressIn={startSpeaking}
            onPressOut={stopSpeaking}
            style={[styles.controlButton, isSpeaking && styles.controlButtonSpeaking]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="mic" size={24} color="#fff" />
            )}
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
