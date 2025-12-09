import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.1.27:5000/api/messages";

export interface Message {
  _id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  userId: string;
  name: string;
  email: string;
  lastMessage: {
    content: string;
    createdAt: string;
    sentByMe: boolean;
  } | null;
  unreadCount: number;
}

const getAuthToken = async () => {
  return await AsyncStorage.getItem("token");
};

export const sendMessage = async (
  receiverId: string,
  content: string
): Promise<{ success: boolean; message?: string; data?: Message }> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ receiverId, content }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || "Failed to send message" };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, message: "Network error" };
  }
};

export const getConversations = async (): Promise<{
  success: boolean;
  conversations?: Conversation[];
  message?: string;
}> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/conversations`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || "Failed to fetch conversations" };
    }

    return { success: true, conversations: data.conversations };
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return { success: false, message: "Network error" };
  }
};

export const getMessagesWithUser = async (
  userId: string
): Promise<{ success: boolean; messages?: Message[]; message?: string }> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/with/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || "Failed to fetch messages" };
    }

    return { success: true, messages: data.messages };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { success: false, message: "Network error" };
  }
};

export const getUnreadCount = async (): Promise<{
  success: boolean;
  count?: number;
  message?: string;
}> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/unread/count`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || "Failed to fetch unread count" };
    }

    return { success: true, count: data.count };
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return { success: false, message: "Network error" };
  }
};
