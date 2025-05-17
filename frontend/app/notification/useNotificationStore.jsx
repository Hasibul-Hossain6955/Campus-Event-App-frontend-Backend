// stores/useNotificationStore.js
import { create } from "zustand";

const useNotificationStore = create((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications], // adds latest at the top
    })),
}));

export default useNotificationStore;
