const authService = {
  register: async (
    name: string,
    email: string,
    password: string,
    role: string
  ): Promise<void> => {
    const response = await fetch("http://192.168.1.49:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Registration failed");
    }
  },
};

export default authService;
