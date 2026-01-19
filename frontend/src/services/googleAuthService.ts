import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth Configuration
const GOOGLE_CLIENT_ID_WEB = '616868634084-ua6tfbgu5sma4af0otut49stmm74mm8e.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_IOS = '616868634084-74b0jkmbqik2jkl6jmn79vtbkhsho67e.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_ANDROID = 'YOUR_ANDROID_CLIENT_ID_HERE.apps.googleusercontent.com';

export const useGoogleAuth = () => {
  // Explicitly use Expo's auth proxy
  const redirectUri = 'https://auth.expo.io/@ionela.cioanca/licenta-lullababy-ai';
  
  console.log('Using redirect URI:', redirectUri);
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID_WEB,
    iosClientId: GOOGLE_CLIENT_ID_IOS,
    androidClientId: GOOGLE_CLIENT_ID_ANDROID,
    redirectUri: redirectUri,
  });

  // Log request details
  if (request) {
    console.log('OAuth request ready');
    console.log('Request redirect URI:', request.redirectUri);
  }

  return { request, response, promptAsync };
};

// Check if Google user exists
export const checkGoogleUser = async (accessToken: string) => {
  try {
    console.log('Access token received:', accessToken ? 'Yes' : 'No');
    
    // First get user info from Google
    const userInfo = await getUserInfoFromGoogle(accessToken);
    console.log('Google user info:', userInfo);
    
    // Then check if user exists in our database
    const requestBody = { 
      email: userInfo.email,
      name: userInfo.name,
      googleId: userInfo.id,
      picture: userInfo.picture
    };
    console.log('Sending to backend:', requestBody);
    
    const response = await fetch('http://192.168.1.11:5000/api/users/auth/google/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.message || 'Google authentication failed');
      } catch {
        throw new Error(`Server error: ${response.status}`);
      }
    }

    const data = await response.json();
    console.log('Backend response data:', data);
    return data;
  } catch (error) {
    console.error('Google auth check error:', error);
    throw error;
  }
};

// Register new user with Google
export const registerWithGoogle = async (accessToken: string, googleData: any, role: string, customRole?: string) => {
  try {
    const response = await fetch('http://192.168.1.11:5000/api/users/auth/google/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: googleData.email,
        name: googleData.name,
        googleId: googleData.googleId || googleData.id,
        picture: googleData.picture,
        role, 
        customRole 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Google registration failed');
    }

    const data = await response.json();
    
    // Store auth data
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('parentId', data.parentId);
    await AsyncStorage.setItem('parentName', data.name);
    await AsyncStorage.setItem('userEmail', data.email);
    await AsyncStorage.setItem('userRole', data.role);

    return data;
  } catch (error) {
    console.error('Google registration error:', error);
    throw error;
  }
};

// Store user data after Google login
export const storeGoogleUserData = async (data: any) => {
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('parentId', data.parentId);
  await AsyncStorage.setItem('parentName', data.name);
  await AsyncStorage.setItem('userEmail', data.email);
  await AsyncStorage.setItem('userRole', data.role);
};

// Get user info from Google token
export const getUserInfoFromGoogle = async (accessToken: string) => {
  try {
    const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const userInfo = await response.json();
    return userInfo;
  } catch (error) {
    console.error('Error fetching Google user info:', error);
    throw error;
  }
};
