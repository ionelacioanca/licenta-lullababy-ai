import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://192.168.1.8:5000/api'; // adjust if backend IP changes

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
    let storedLang = await AsyncStorage.getItem('app_language');
    // Helper: lightweight language detection to prefer reply language matching user input
    const detectLanguageFromMessage = (text: string): string | null => {
      if (!text) return null;
      const lower = text.toLowerCase();
      // Romanian diacritics are a strong indicator
      if (/[ăâîșțţ]/i.test(lower)) return 'ro';

      // Common small word lists to heuristically detect language
      const engWords = [' the ', ' and ', ' you ', ' please ', ' is ', ' are ', ' I ', ' me ', ' do ', 'does', 'what', 'when'];
      const roWords = [' si ', ' și ', ' ce ', ' cum ', ' este ', ' sunt ', ' te ', ' rog ', ' nu ', ' da ', ' când '];

      let engScore = 0;
      let roScore = 0;
      for (const w of engWords) if (lower.includes(w)) engScore++;
      for (const w of roWords) if (lower.includes(w)) roScore++;

      if (engScore > roScore) return 'en';
      if (roScore > engScore) return 'ro';
      return null;
    };

    const prefLang = language;
    let lang = prefLang || storedLang || 'en';
    // If language wasn't explicitly passed, try to detect from message and override stored preference
    if (!prefLang) {
      const detected = detectLanguageFromMessage(message);
      if (detected) {
        lang = detected;
      }
    }
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

// ✅ NEW: Fetch chat history from backend
export interface ChatHistoryItem {
  _id: string;
  userId: string;
  babyId?: string;
  role: 'user' | 'assistant';
  content: string;
  language: string;
  createdAt: string;
  contextUsed?: {
    babyAge?: number;
    babyWeight?: number;
    babyLength?: number;
    userName?: string;
    userRole?: string;
  };
  metadata?: {
    responseTime?: number;
    model?: string;
  };
}

export async function getChatHistory(babyId?: string, limit: number = 50): Promise<any[]> {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.log('[Chatbot Service] No token - skipping history load');
      return [];
    }

    // Get selected babyId from AsyncStorage if not provided
    const selectedBabyId = babyId || await AsyncStorage.getItem('selectedBabyId');
    
    let url = `${API_BASE}/chatbot/history?limit=${limit}`;
    if (selectedBabyId) {
      url += `&babyId=${selectedBabyId}`;
    }
    
    console.log('[Chatbot Service] Fetching history from:', url);
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error('[Chatbot Service] Failed to fetch history:', res.status);
      return [];
    }

    const data = await res.json();
    console.log('[Chatbot Service] History loaded:', data.conversations?.length || 0, 'conversations');
    
    // Backend returns { conversations: [...], total: X }
    // Each conversation has { question: {...}, answer: {...} }
    return data.conversations || [];
  } catch (err) {
    console.error('[Chatbot Service] Error fetching history:', err);
    return [];
  }
}

// ✅ NEW: Delete all chat history for current user
export async function deleteChatHistory(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return false;

    const res = await fetch(`${API_BASE}/chatbot/history`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error('[Chatbot Service] Failed to delete history:', res.status);
      return false;
    }

    console.log('[Chatbot Service] Chat history deleted successfully');
    return true;
  } catch (err) {
    console.error('[Chatbot Service] Error deleting history:', err);
    return false;
  }
}
