import { API_BASE_URL } from "@/src/config/network";

const babyService = {
  saveBabyDetails: async (
    babyData: {
      name: string;
      sex: string;
      birthDate: string;
      birthTime?: string;
      birthWeight?: number;
      birthLength?: number;
      birthType?: string;
      gestationalWeeks?: number;
      knownAllergies?: string;
      parentId?: string; // dacă îl trimiți din frontend
    }
  ): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/babies/babyDetails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(babyData),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Saving baby details failed");
    }
  },
};

export default babyService;
