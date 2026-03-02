import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.56:5000/api/sleep-events';

export interface SleepEvent {
  _id: string;
  status: 'Somn Inceput' | 'Somn Incheiat' | 'Finalizat';
  start_time: string;
  end_time: string;
  duration_minutes: number;
  device_id: string;
  babyId?: string;
}

export interface SleepStats {
  totalMinutes: number;
  totalHours: number;
  remainingMinutes: number;
  sessionCount: number;
  sessions: SleepEvent[];
}

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

/**
 * Get all sleep events for a device
 */
export const getSleepEventsByDevice = async (deviceId: string): Promise<SleepEvent[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/device/${deviceId}`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch sleep events');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching sleep events:', error);
    throw error;
  }
};

/**
 * Get recent sleep sessions (completed)
 */
export const getRecentSleepSessions = async (deviceId: string, limit: number = 10): Promise<SleepEvent[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/device/${deviceId}/recent?limit=${limit}`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch recent sleep sessions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching recent sleep sessions:', error);
    throw error;
  }
};

/**
 * Get last sleep session
 */
export const getLastSleepSession = async (deviceId: string): Promise<SleepEvent | null> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/device/${deviceId}/last`, { headers });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch last sleep session');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching last sleep session:', error);
    throw error;
  }
};

/**
 * Get current sleep session (if baby is sleeping)
 */
export const getCurrentSleepSession = async (deviceId: string): Promise<{ sleeping: boolean; session: SleepEvent | null }> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/device/${deviceId}/current`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch current sleep session');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching current sleep session:', error);
    throw error;
  }
};

/**
 * Get sleep events by date range
 */
export const getSleepEventsByDateRange = async (
  deviceId: string, 
  startDate: string, 
  endDate: string
): Promise<SleepEvent[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_URL}/device/${deviceId}/range?startDate=${startDate}&endDate=${endDate}`,
      { headers }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch sleep events by date range');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching sleep events by date range:', error);
    throw error;
  }
};

/**
 * Get sleep events by baby ID and date range
 */
export const getSleepEventsByBabyAndDateRange = async (
  babyId: string, 
  startDate: string, 
  endDate: string
): Promise<SleepEvent[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_URL}/baby/${babyId}/range?startDate=${startDate}&endDate=${endDate}`,
      { headers }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch sleep events by baby and date range');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching sleep events by baby and date range:', error);
    throw error;
  }
};

/**
 * Get current sleep session for a specific baby
 */
export const getCurrentSleepSessionByBaby = async (babyId: string): Promise<{ sleeping: boolean; session: SleepEvent | null }> => {
  try {
    console.log('LOG [Service] Fetching current sleep session for babyId:', babyId);
    const headers = await getAuthHeaders();
    const url = `${API_URL}/baby/${babyId}/current`;
    console.log('LOG [Service] Request URL:', url);
    
    const response = await fetch(url, { headers });
    console.log('LOG [Service] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('LOG [Service] Response error:', errorText);
      throw new Error(`Failed to fetch current sleep session by baby: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('LOG [Service] Response data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching current sleep session by baby:', error);
    // Return default value instead of throwing to prevent app crash
    return { sleeping: false, session: null };
  }
};

/**
 * Get last sleep session for a specific baby
 */
export const getLastSleepSessionByBaby = async (babyId: string): Promise<SleepEvent | null> => {
  try {
    console.log('LOG [Service] Fetching last sleep session for babyId:', babyId);
    const headers = await getAuthHeaders();
    const url = `${API_URL}/baby/${babyId}/last`;
    console.log('LOG [Service] Request URL:', url);
    
    const response = await fetch(url, { headers });
    console.log('LOG [Service] Response status:', response.status);
    
    if (response.status === 404) {
      console.log('LOG [Service] No last session found (404)');
      return null;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('LOG [Service] Response error:', errorText);
      throw new Error(`Failed to fetch last sleep session by baby: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('LOG [Service] Response data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching last sleep session by baby:', error);
    // Return null instead of throwing to prevent app crash
    return null;
  }
};

/**
 * Get today's sleep statistics
 */
export const getTodaySleepStats = async (deviceId: string): Promise<SleepStats> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/device/${deviceId}/today`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch today sleep stats');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching today sleep stats:', error);
    throw error;
  }
};
