// Sound Service - API calls for sound library
const BASE_URL = "http://192.168.1.11:5000/api/sounds";

export interface Sound {
  _id: string;
  title: string;
  artist: string;
  category: "lullaby" | "white-noise" | "nature" | "music-box" | "classical";
  duration: number;
  audioUrl: string;
  thumbnailUrl: string;
  isDefault: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Get all sounds
export const getAllSounds = async (token: string): Promise<Sound[]> => {
  try {
    const response = await fetch(BASE_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch sounds");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching all sounds:", error);
    throw error;
  }
};

// Get default sounds only
export const getDefaultSounds = async (token: string): Promise<Sound[]> => {
  try {
    const response = await fetch(`${BASE_URL}/default`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch default sounds");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching default sounds:", error);
    throw error;
  }
};

// Get sounds by category
export const getSoundsByCategory = async (
  token: string,
  category: string
): Promise<Sound[]> => {
  try {
    const response = await fetch(`${BASE_URL}/category/${category}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sounds for category: ${category}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching sounds for category ${category}:`, error);
    throw error;
  }
};

// Get sound by ID
export const getSoundById = async (
  token: string,
  soundId: string
): Promise<Sound> => {
  try {
    const response = await fetch(`${BASE_URL}/${soundId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch sound");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching sound by ID:", error);
    throw error;
  }
};

// Category labels for UI
export const CATEGORY_LABELS: Record<string, string> = {
  "lullaby": "Lullabies",
  "white-noise": "White Noise",
  "nature": "Nature Sounds",
  "music-box": "Music Box",
  "classical": "Classical"
};

// Category colors for UI
export const CATEGORY_COLORS: Record<string, string> = {
  "lullaby": "#FFB6C1",
  "white-noise": "#D3D3D3",
  "nature": "#87CEEB",
  "music-box": "#F0E68C",
  "classical": "#DDA0DD"
};
