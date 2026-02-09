import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Text } from 'react-native';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Set up notification listeners (but don't register token yet - that happens after login)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  if (!loaded) {
  return <Text>Loading...</Text>; // sau un loader mic
}

  return (
    <LanguageProvider>
      <ThemeProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="open" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ title: "Sign Up" }} />
            <Stack.Screen name="babyDetails" options={{ title: "Baby's details" }} />
            <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
            <Stack.Screen name="login" options={{ title: "Log In" }} />
          </Stack>
          <StatusBar style="auto" />
        </NavigationThemeProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
