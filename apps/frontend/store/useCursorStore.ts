import { create } from "zustand";

export type RemoteCursor = {
  userId: string;
  name: string;
  x: number;
  y: number;
};

type CursorStore = {
  cursors: Record<string, RemoteCursor>;
  setCursor: (cursor: RemoteCursor) => void;
  keepOnly: (userIds: string[]) => void;
  clearCursors: () => void;
};

export const useCursorStore = create<CursorStore>()((set) => ({
  cursors: {},
  setCursor: (cursor) =>
    set((state) => ({ cursors: { ...state.cursors, [cursor.userId]: cursor } })),
  keepOnly: (userIds) =>
    set((state) => ({
      cursors: Object.fromEntries(
        Object.entries(state.cursors).filter(([id]) => userIds.includes(id))
      ),
    })),
  clearCursors: () => set({ cursors: {} }),
}));
