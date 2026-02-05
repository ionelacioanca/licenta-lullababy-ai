import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.1.20:5000/api/journal";

export interface JournalEntry {
  _id: string;
  babyId: string;
  title?: string;
  description: string;
  date: string;
  photos: string[];
  photoCaptions: string[];
  tags: string[];
  mood: 'happy' | 'okay' | 'neutral' | 'crying' | 'sick';
  createdAt: string;
  updatedAt: string;
}

export interface GalleryPhoto {
  photoUrl: string;
  caption: string;
  entryTitle: string;
  entryDate: string;
  entryId: string;
}

// Get all journal entries for a baby
export const getJournalEntries = async (babyId: string): Promise<JournalEntry[]> => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${API_URL}/baby/${babyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch journal entries");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    throw error;
  }
};

// Get single journal entry
export const getJournalEntry = async (entryId: string): Promise<JournalEntry> => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${API_URL}/${entryId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch journal entry");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    throw error;
  }
};

// Create new journal entry
export const createJournalEntry = async (
  babyId: string,
  data: {
    title?: string;
    description: string;
    date?: Date;
    tags?: string[];
    mood?: string;
    photos?: any[]; // File objects from ImagePicker
    photoCaptions?: string[];
  }
): Promise<JournalEntry> => {
  try {
    const token = await AsyncStorage.getItem("token");
    
    const formData = new FormData();
    formData.append('babyId', babyId);
    if (data.title) formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.date) formData.append('date', data.date.toISOString());
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    if (data.mood) formData.append('mood', data.mood);
    if (data.photoCaptions) formData.append('photoCaptions', JSON.stringify(data.photoCaptions));
    
    // Append photos if any
    if (data.photos && data.photos.length > 0) {
      data.photos.forEach((photo, index) => {
        formData.append('photos', {
          uri: photo.uri,
          type: photo.type || 'image/jpeg',
          name: photo.fileName || `photo-${index}.jpg`,
        } as any);
      });
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to create journal entry");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating journal entry:", error);
    throw error;
  }
};

// Update journal entry
export const updateJournalEntry = async (
  entryId: string,
  data: {
    title?: string;
    description?: string;
    date?: Date;
    tags?: string[];
    mood?: string;
    existingPhotos?: string[];
    newPhotos?: any[];
    photoCaptions?: string[];
  }
): Promise<JournalEntry> => {
  try {
    const token = await AsyncStorage.getItem("token");
    
    const formData = new FormData();
    if (data.title !== undefined) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.date) formData.append('date', data.date.toISOString());
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    if (data.mood) formData.append('mood', data.mood);
    if (data.existingPhotos) formData.append('existingPhotos', JSON.stringify(data.existingPhotos));
    if (data.photoCaptions) formData.append('photoCaptions', JSON.stringify(data.photoCaptions));
    
    // Append new photos if any
    if (data.newPhotos && data.newPhotos.length > 0) {
      data.newPhotos.forEach((photo, index) => {
        formData.append('photos', {
          uri: photo.uri,
          type: photo.type || 'image/jpeg',
          name: photo.fileName || `photo-${index}.jpg`,
        } as any);
      });
    }

    const response = await fetch(`${API_URL}/${entryId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to update journal entry");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating journal entry:", error);
    throw error;
  }
};

// Delete journal entry
export const deleteJournalEntry = async (entryId: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${API_URL}/${entryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete journal entry");
    }
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    throw error;
  }
};

// Get gallery (all photos from all entries)
export const getJournalGallery = async (babyId: string): Promise<GalleryPhoto[]> => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${API_URL}/baby/${babyId}/gallery`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch gallery");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching gallery:", error);
    throw error;
  }
};

// Get recent entries (for dashboard)
export const getRecentEntries = async (babyId: string, limit: number = 2): Promise<JournalEntry[]> => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${API_URL}/baby/${babyId}/recent?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recent entries");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching recent entries:", error);
    throw error;
  }
};
