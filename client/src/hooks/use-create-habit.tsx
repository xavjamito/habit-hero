import { create } from "zustand";

interface CreateHabitState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useCreateHabit = create<CreateHabitState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state: CreateHabitState) => ({ isOpen: !state.isOpen })),
}));
