import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://192.168.1.20:5000/api'; // adjust if backend IP changes

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  ts: number;
  id: string;
}

export async function sendChatMessage(message: string, language?: string, babyId?: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout
  try {
    const token = await AsyncStorage.getItem('token');
    // Get language preference from AsyncStorage if not provided
    const lang = language || await AsyncStorage.getItem('app_language') || 'en';
    // Get selected babyId from AsyncStorage if not provided
    const selectedBabyId = babyId || await AsyncStorage.getItem('selectedBabyId');
    
    console.log('[Chatbot Service] Sending message:', message.substring(0, 30));
    console.log('[Chatbot Service] Language:', lang);
    console.log('[Chatbot Service] BabyId:', selectedBabyId);
    
    const res = await fetch(`${API_BASE}/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ 
        message, 
        language: lang,
        babyId: selectedBabyId 
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Chatbot error ${res.status}`);
    }

    const data = await res.json();
    return data.reply || '';
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return 'Sorry, the assistant is taking too long. Please try again.';
    }
    return 'I had trouble responding. Please retry in a moment.';
  } finally {
    clearTimeout(timeout);
  }
}
