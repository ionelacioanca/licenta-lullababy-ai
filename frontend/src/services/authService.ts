import { API_BASE_URL } from "@/src/config/network";

const authService = {
  register: async (
    name: string,
    email: string,
    password: string,
    role: string
  ): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Registration failed");
    }
  },

  login: async (
    email: string,
    password: string
  ): Promise<{ token: string; user: any }> => {
  const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json(); 

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    return {
      token: data.token,
      user: data.user,
    };
  },
};

export default authService;
