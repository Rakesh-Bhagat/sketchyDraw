import { Shape } from "@/types/shape";
import { create } from "zustand";

// In-progress shapes (being drawn or typed) from other participants, keyed by userId.
type PreviewStore = {
  previews: Record<string, Shape>;
  setPreview: (userId: string, shape: Shape | null) => void;
  keepOnly: (userIds: string[]) => void;
  clearPreviews: () => void;
};

export const usePreviewStore = create<PreviewStore>()((set) => ({
  previews: {},
  setPreview: (userId, shape) =>
    set((state) => {
      const previews = { ...state.previews };
      if (shape) previews[userId] = shape;
      else delete previews[userId];
      return { previews };
    }),
  keepOnly: (userIds) =>
    set((state) => ({
      previews: Object.fromEntries(
        Object.entries(state.previews).filter(([id]) => userIds.includes(id))
      ),
    })),
  clearPreviews: () => set({ previews: {} }),
}));
