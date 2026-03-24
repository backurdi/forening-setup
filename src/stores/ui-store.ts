import { create } from "zustand";

type UiStore = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open })
}));
