import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface FloatingMusicPlayerProps {
  currentSound?: {
    name: string;
    description?: string;
  };
  isPlaying: boolean;
  volume: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onClose: () => void;
}

export const FloatingMusicPlayer: React.FC<FloatingMusicPlayerProps> = ({
  currentSound,
  isPlaying,
  volume,
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeUp,
  onVolumeDown,
  onClose,
}) => {
  const pan = React.useRef(new Animated.ValueXY({ x: width - 80, y: height - 200 })).current;
  const [expanded, setExpanded] = React.useState(false);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        
        // Snap to edges
        const toX = gesture.moveX < width / 2 ? 10 : width - (expanded ? 320 : 70);
        const toY = Math.max(50, Math.min(height - (expanded ? 250 : 70), (pan.y as any)._value));
        
        Animated.spring(pan, {
          toValue: { x: toX, y: toY },
          useNativeDriver: false,
          friction: 7,
        }).start();
      },
    })
  ).current;

  const toggleExpanded = () => {
    setExpanded(!expanded);
    const toX = expanded ? width - 70 : width - 320;
    Animated.spring(pan, {
      toValue: { x: toX, y: (pan.y as any)._value },
      useNativeDriver: false,
      friction: 7,
    }).start();
  };

  if (!currentSound) return null;

  const volumePercent = Math.round(volume * 100);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          width: expanded ? 310 : 60,
          height: expanded ? 240 : 60,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Compact view */}
      {!expanded && (
        <TouchableOpacity
          style={styles.compactView}
          onPress={toggleExpanded}
          activeOpacity={0.9}
        >
          <Ionicons
            name={isPlaying ? 'musical-notes' : 'musical-notes-outline'}
            size={28}
            color="white"
          />
        </TouchableOpacity>
      )}

      {/* Expanded view */}
      {expanded && (
        <View style={styles.expandedView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={toggleExpanded}>
              <Ionicons name="chevron-down" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Now Playing</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Song info */}
          <View style={styles.songInfo}>
            <Text style={styles.songTitle} numberOfLines={2}>
              {currentSound.name}
            </Text>
            {currentSound.description && (
              <Text style={styles.songArtist} numberOfLines={1}>
                {currentSound.description}
              </Text>
            )}
          </View>

          {/* Volume display */}
          <View style={styles.volumeDisplay}>
            <Ionicons name="volume-high" size={20} color="#4CAF50" />
            <View style={styles.volumeBar}>
              <View style={[styles.volumeFill, { width: `${volumePercent}%` }]} />
            </View>
            <Text style={styles.volumeText}>{volumePercent}%</Text>
          </View>

          {/* Playback controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={onPrevious}>
              <Ionicons name="play-skip-back" size={32} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.playButton]}
              onPress={onPlayPause}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={36}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={onNext}>
              <Ionicons name="play-skip-forward" size={32} color="white" />
            </TouchableOpacity>
          </View>

          {/* Volume controls */}
          <View style={styles.volumeControls}>
            <TouchableOpacity
              style={styles.volumeButton}
              onPress={onVolumeDown}
            >
              <Ionicons name="volume-low" size={24} color="white" />
              <Text style={styles.volumeButtonText}>-</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.volumeButton}
              onPress={onVolumeUp}
            >
              <Ionicons name="volume-high" size={24} color="white" />
              <Text style={styles.volumeButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  compactView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 16,
  },
  expandedView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  songInfo: {
    marginBottom: 16,
  },
  songTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  songArtist: {
    color: '#999',
    fontSize: 14,
  },
  volumeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  volumeBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  volumeText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 32,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  volumeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  volumeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
