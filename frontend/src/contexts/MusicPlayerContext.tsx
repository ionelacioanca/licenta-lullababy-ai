import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Sound {
  _id: string;
  name: string;
  description?: string;
  audioUrl: string;
  category: string;
}

interface MusicPlayerContextType {
  currentSound: Sound | null;
  isPlaying: boolean;
  volume: number;
  playlist: Sound[];
  currentIndex: number;
  showFloatingPlayer: boolean;
  setCurrentSound: (sound: Sound | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setPlaylist: (playlist: Sound[]) => void;
  setCurrentIndex: (index: number) => void;
  setShowFloatingPlayer: (show: boolean) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => void;
  increaseVolume: () => void;
  decreaseVolume: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSound, setCurrentSound] = useState<Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [playlist, setPlaylist] = useState<Sound[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFloatingPlayer, setShowFloatingPlayer] = useState(false);

  const playNext = () => {
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    setCurrentSound(playlist[nextIndex]);
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentSound(playlist[prevIndex]);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const increaseVolume = () => {
    setVolume((prev) => Math.min(1, prev + 0.1));
  };

  const decreaseVolume = () => {
    setVolume((prev) => Math.max(0, prev - 0.1));
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        currentSound,
        isPlaying,
        volume,
        playlist,
        currentIndex,
        showFloatingPlayer,
        setCurrentSound,
        setIsPlaying,
        setVolume,
        setPlaylist,
        setCurrentIndex,
        setShowFloatingPlayer,
        playNext,
        playPrevious,
        togglePlayPause,
        increaseVolume,
        decreaseVolume,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};
