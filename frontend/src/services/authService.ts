const authService = {
  register: async (
    name: string,
    email: string,
    password: string,
    role: string
  ): Promise<void> => {
    const response = await fetch("http://192.168.1.49:5000/api/users/register", {
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
    const response = await fetch("http://192.168.1.49:5000/api/users//login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Login failed");
    }

    const data = await response.json();
    return {
      token: data.token,
      user: data.user,
    };
  },
};

export default authService;
