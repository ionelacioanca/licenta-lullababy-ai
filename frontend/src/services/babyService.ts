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
    const response = await fetch("http://192.168.1.50:5000/api/babies/babyDetails", {
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
