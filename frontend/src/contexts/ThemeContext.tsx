import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Primary colors
  primary: string;
  primaryLight: string;
  
  // UI elements
  border: string;
  shadow: string;
  error: string;
  success: string;
  
  // Chat bubbles
  userBubble: string;
  otherBubble: string;
  
  // Icon color
  icon: string;
  iconInactive: string;
}

export const lightTheme: Theme = {
  background: '#FFF8F0',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  
  text: '#444444',
  textSecondary: '#666666',
  textTertiary: '#999999',
  
  primary: '#A2E884',
  primaryLight: '#D4F1C5',
  
  border: '#E0E0E0',
  shadow: '#000000',
  error: '#FF6B6B',
  success: '#A2E884',
  
  userBubble: '#D4F1C5',
  otherBubble: '#FFF3E0',
  
  icon: '#444444',
  iconInactive: '#999999',
};

export const darkTheme: Theme = {
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2C2C2C',
  
  text: '#E0E0E0',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  
  primary: '#A2E884',
  primaryLight: '#7DC75F',
  
  border: '#3A3A3A',
  shadow: '#000000',
  error: '#FF6B6B',
  success: '#A2E884',
  
  userBubble: '#2C5F2D',
  otherBubble: '#3D3D3D',
  
  icon: '#E0E0E0',
  iconInactive: '#808080',
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setIsDark(true);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
