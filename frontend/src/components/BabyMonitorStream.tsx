import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";

type BabyMonitorStreamProps = {
  streamUrl?: string;
  babyName?: string;
};

const BabyMonitorStream: React.FC<BabyMonitorStreamProps> = ({
  streamUrl = "",
  babyName = "Baby",
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const videoRef = React.useRef<Video>(null);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = async () => {
    if (videoRef.current) {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const renderVideoPlayer = (isFullscreenMode: boolean) => {
    const containerStyle = isFullscreenMode
      ? styles.fullscreenContainer
      : styles.normalContainer;

    return (
      <View style={containerStyle}>
        {/* Video Header */}
        <View style={styles.videoHeader}>
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

        {/* Video Stream */}
        <View style={styles.videoWrapper}>
          {streamUrl ? (
            <>
              <Video
                ref={videoRef}
                source={{ uri: streamUrl }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={isPlaying}
                isLooping
                isMuted={isMuted}
                onLoadStart={() => setIsLoading(true)}
                onLoad={() => setIsLoading(false)}
                onError={(error: any) => {
                  console.error("Video error:", error);
                  setIsLoading(false);
                }}
              />
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#A2E884" />
                  <Text style={styles.loadingText}>Connecting to stream...</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noStreamContainer}>
              <Ionicons name="videocam-off-outline" size={60} color="#ccc" />
              <Text style={styles.noStreamText}>No stream available</Text>
              <Text style={styles.noStreamSubtext}>
                Connect your camera to start monitoring
              </Text>
            </View>
          )}
        </View>

        {/* Video Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={togglePlayPause} style={styles.controlButton}>
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
            <Ionicons
              name={isMuted ? "volume-mute" : "volume-high"}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>

          {!isFullscreenMode && (
            <TouchableOpacity
              onPress={toggleFullscreen}
              style={styles.controlButton}
            >
              <Ionicons name="expand" size={24} color="#fff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="camera" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Normal View */}
      {renderVideoPlayer(false)}

      {/* Fullscreen Modal */}
      <Modal
        visible={isFullscreen}
        animationType="fade"
        onRequestClose={toggleFullscreen}
        supportedOrientations={["portrait", "landscape"]}
      >
        <View style={styles.fullscreenWrapper}>
          {renderVideoPlayer(true)}
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
  videoHeader: {
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 14,
  },
  noStreamContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  noStreamText: {
    color: "#ccc",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  noStreamSubtext: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
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
});

export default BabyMonitorStream;
