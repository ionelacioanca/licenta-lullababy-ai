import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";

type MicrophoneMonitorProps = {
  title?: string;
  targetHeight?: number; // px height target (e.g., half of video section)
  autoStart?: boolean;
};

const MicrophoneMonitor: React.FC<MicrophoneMonitorProps> = ({
  title = "Room audio",
  targetHeight = 125,
  autoStart = true,
}) => {
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [isListening, setIsListening] = useState(false);
  const [level, setLevel] = useState(0); // 0..1 normalized
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pollTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!permissionResponse) return;
    const ensure = async () => {
      if (!permissionResponse.granted) {
        if (permissionResponse.canAskAgain) {
          const res = await requestPermission();
          if (res.granted && autoStart && !isListening) {
            startListening();
          }
        }
      } else {
        if (autoStart && !isListening) {
          startListening();
        }
      }
    };
    ensure();
  }, [permissionResponse, autoStart, isListening]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const startListening = async () => {
    try {
      if (!permissionResponse?.granted) {
        const res = await requestPermission();
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
      // Use preset then enable metering (iOS)
      const opts: any = { ...(Audio.RecordingOptionsPresets.HIGH_QUALITY as any) };
      opts.isMeteringEnabled = true;
      await recording.prepareToRecordAsync(opts);

      await recording.startAsync();
      recordingRef.current = recording;
      setIsListening(true);

      // Poll metering
      if (pollTimer.current) clearInterval(pollTimer.current as any);
      pollTimer.current = (setInterval(async () => {
        try {
          const status = await recording.getStatusAsync();
          // metering returns in dBFS (iOS only). Range approx -160..0. Normalize 0..1
          const dB = (status as any).metering ?? -160;
          const normalized = Math.max(0, Math.min(1, 1 - Math.abs(dB) / 160));
          setLevel(normalized);
        } catch (e) {
          // ignore polling errors
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
      setLevel(0);
      // Reset audio mode
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, staysActiveInBackground: false });
    } catch (e) {
      // ignore
    }
  };

  const toggle = () => {
    if (isListening) stopListening();
    else startListening();
  };

  return (
    <View style={[styles.card, { height: targetHeight }]}> 
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="mic-outline" size={18} color="#333" />
          <Text style={styles.titleText}>{title}</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: isListening ? "#36c261" : "#bbb" }]} />
          <Text style={styles.statusText}>{isListening ? "Listening" : "Idle"}</Text>
        </View>
      </View>

      {/* Level meter */}
      <View style={styles.meterContainer}>
        <View style={styles.meterBarBg}>
          <View style={[styles.meterBarFill, { width: `${Math.round(level * 100)}%` }]} />
        </View>
        <Text style={styles.meterHint}>
          {Platform.OS === "ios" ? "Live level (iOS metering)" : "Level display limited on Android"}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={[styles.toggleBtn, isListening ? styles.btnStop : styles.btnStart]} onPress={toggle}>
          <Ionicons name={isListening ? "stop" : "play"} size={18} color={isListening ? "#fff" : "#fff"} />
          <Text style={styles.toggleText}>{isListening ? "Stop" : "Listen"}</Text>
        </TouchableOpacity>
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            Tip: Headphone use recommended to avoid feedback. Cry notification will be added later.
          </Text>
        </View>
      </View>
    </View>
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
  headerRow: {
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
  titleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  meterContainer: {
    marginTop: 8,
  },
  meterBarBg: {
    height: 14,
    backgroundColor: "#eee",
    borderRadius: 7,
    overflow: "hidden",
  },
  meterBarFill: {
    height: 14,
    backgroundColor: "#A2E884",
  },
  meterHint: {
    marginTop: 6,
    color: "#999",
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#A2E884",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  btnStart: {
    backgroundColor: "#36c261",
  },
  btnStop: {
    backgroundColor: "#ff6b6b",
  },
  toggleText: {
    color: "#fff",
    fontWeight: "600",
  },
  noteBox: {
    flex: 1,
    backgroundColor: "#F6FFF2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  noteText: {
    color: "#48654a",
    fontSize: 12,
  },
});

export default MicrophoneMonitor;
