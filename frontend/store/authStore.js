import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      const response = await fetch(
        "https://campus-event-final.onrender.com/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("token", data.token);

      set({ token: data.token, user: data.user, isLoading: false });

      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: error.message }; // 👈 fix the key here too
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });

    try {
      const response = await fetch(
        "https://campus-event-final.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // ✅ Fix header casing
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();
      console.log("🔐 Login Response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // ✅ Only store if response is OK
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("token", data.token);

      set({ token: data.token, user: data.user, isLoading: false });

      return { success: true };
    } catch (error) {
      console.log("❌ Login Error:", error.message);
      set({ isLoading: false });
      return { success: false, error: error.message }; // <-- safe fallback
    }
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      set({ token, user });
    } catch (error) {
      console.log("Auth check failed", error);
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    set({ token: null, user: null });
  },
}));
