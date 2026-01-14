import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.1.6:5000/api/growth";

export interface GrowthRecord {
  _id: string;
  babyId: string;
  weight: number;
  length: number;
  date: string;
  age: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Add a new growth record
export const addGrowthRecord = async (
  babyId: string,
  weight: string,
  length: string,
  notes?: string
): Promise<GrowthRecord> => {
  try {
    const token = await AsyncStorage.getItem("token");
    console.log("Adding growth record:", { babyId, weight, length, notes });
    
    const response = await fetch(`${API_URL}/baby/${babyId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ weight, length, notes }),
    });

    console.log("Add growth record response status:", response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Add growth record error response:", errorData);
      throw new Error(`Failed to add growth record: ${response.status}`);
    }

    const data = await response.json();
    console.log("Growth record added successfully:", data);
    return data.data;
  } catch (error) {
    console.error("Error adding growth record:", error);
    throw error;
  }
};

// Get all growth records for a baby
export const getGrowthRecords = async (
  babyId: string
): Promise<GrowthRecord[]> => {
  try {
    const token = await AsyncStorage.getItem("token");
    console.log("Fetching growth records for baby:", babyId);
    console.log("API URL:", `${API_URL}/baby/${babyId}`);
    
    const response = await fetch(`${API_URL}/baby/${babyId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Growth records response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Growth records error response:", errorData);
      throw new Error(`Failed to fetch growth records: ${response.status}`);
    }

    const data = await response.json();
    console.log("Growth records data:", data);
    return data.data || [];
  } catch (error) {
    console.error("Error fetching growth records:", error);
    throw error;
  }
};

// Get the latest growth record for a baby
export const getLatestGrowthRecord = async (
  babyId: string
): Promise<GrowthRecord | null> => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${API_URL}/baby/${babyId}/latest`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch latest growth record");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching latest growth record:", error);
    throw error;
  }
};

// Update a growth record
export const updateGrowthRecord = async (
  recordId: string,
  updates: Partial<{ weight: number; length: number; notes: string }>
): Promise<GrowthRecord> => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${API_URL}/${recordId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Failed to update growth record");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error updating growth record:", error);
    throw error;
  }
};

// Delete a growth record
export const deleteGrowthRecord = async (recordId: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${API_URL}/${recordId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete growth record");
    }
  } catch (error) {
    console.error("Error deleting growth record:", error);
    throw error;
  }
};

// Get growth statistics for a baby
export const getGrowthStats = async (babyId: string): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${API_URL}/baby/${babyId}/stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch growth statistics");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching growth statistics:", error);
    throw error;
  }
};
