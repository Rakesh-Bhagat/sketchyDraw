// store/useSessionStore.ts
import { create } from "zustand";

type SessionStore = {
  isSessionStarted: boolean;
  setSessionStarted: (started: boolean) => void;
  participants: Array<{ userId: string; name: string }>;
  setParticipants: (participants: Array<{ userId: string; name: string }>) => void;
};

export const useSessionStore = create<SessionStore>((set) => ({
  isSessionStarted: false,
  setSessionStarted: (started) => set({ isSessionStarted: started }),
  participants: [],
  setParticipants: (participants) => set({ participants }),
}));
