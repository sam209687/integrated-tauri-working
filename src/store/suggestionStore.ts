// src/store/suggestionStore.ts
import { create } from "zustand";
import { getVariantsByMaxPrice } from "@/actions/pos/pos-suggestions.actions";
import { IPosVariant } from "@/actions/pos/pos.actions";

interface SuggestionState {
  suggestedProducts: IPosVariant[];
  isLoading: boolean;
  fetchSuggestions: (price: number) => Promise<void>;
  clearSuggestions: () => void;
}

export const useSuggestionStore = create<SuggestionState>((set) => ({
  suggestedProducts: [],
  isLoading: false,
  fetchSuggestions: async (price) => {
    if (price <= 0) {
      set({ suggestedProducts: [] });
      return;
    }
    set({ isLoading: true });
    try {
      const result = await getVariantsByMaxPrice(price);

      // 🔥 ADD THIS
      console.log(JSON.stringify(result.data, null, 2));

      if (result.success) {
        set({
          suggestedProducts: result.data as IPosVariant[],
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      set({ isLoading: false });
    }
  },
  clearSuggestions: () => set({ suggestedProducts: [] }),
}));
