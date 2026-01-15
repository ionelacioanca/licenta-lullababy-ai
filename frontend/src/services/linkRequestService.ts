import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.6:5000/api/link-request';

interface LinkRequest {
  _id: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  parentId: string;
  parentEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  message?: string;
  data: T;
}

// Send link request to parent by email
export const sendLinkRequest = async (
  parentEmail: string,
  message?: string
): Promise<LinkRequest> => {
  const token = await AsyncStorage.getItem('token');

  const response = await fetch(`${API_URL}/send-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ parentEmail, message }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to send link request');
  }

  return result.data;
};

// Get pending link requests (for parents)
export const getPendingLinkRequests = async (): Promise<LinkRequest[]> => {
  const token = await AsyncStorage.getItem('token');

  const response = await fetch(`${API_URL}/pending`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch link requests');
  }

  return result.data;
};

// Get count of pending link requests (for notification badge)
export const getPendingRequestsCount = async (): Promise<number> => {
  const token = await AsyncStorage.getItem('token');

  const response = await fetch(`${API_URL}/pending/count`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch count');
  }

  return result.count;
};

// Accept link request
export const acceptLinkRequest = async (requestId: string): Promise<LinkRequest> => {
  const token = await AsyncStorage.getItem('token');

  const response = await fetch(`${API_URL}/accept/${requestId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to accept link request');
  }

  return result.data;
};

// Decline link request
export const declineLinkRequest = async (requestId: string): Promise<LinkRequest> => {
  const token = await AsyncStorage.getItem('token');

  const response = await fetch(`${API_URL}/decline/${requestId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to decline link request');
  }

  return result.data;
};

// Get my link requests (for nanny/others to track their sent requests)
export const getMyLinkRequests = async (): Promise<LinkRequest[]> => {
  const token = await AsyncStorage.getItem('token');

  const response = await fetch(`${API_URL}/my-requests`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch my requests');
  }

  return result.data;
};

export type { LinkRequest };
