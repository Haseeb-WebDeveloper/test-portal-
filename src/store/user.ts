import { create } from "zustand";
import { User } from "@/types/messages";

interface UserState {
  user: User | undefined;
  setUser: (user: User | undefined) => void;
}

export const useUser = create<UserState>()((set) => ({
  user: undefined,
  setUser: (user) => set(() => ({ user })),
}));
