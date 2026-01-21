import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.11:5000/api/sleep-events';

export interface SleepEvent {
  _id: string;
  status: 'Somn Inceput' | 'Somn Incheiat';
  start_time: string;
  end_time: string;
  duration_minutes: number;
  device_id: string;
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
