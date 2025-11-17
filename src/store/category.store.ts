// src/store/category.store.ts

import { create } from 'zustand';
// ⚠️ ASSUMPTION: You must define and import this server action
import { deleteCategory as deleteCategoryAction } from "@/actions/category.actions"; 

interface Category {
  _id: string;
  name: string;
  codePrefix: string;
}

interface CategoryState {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  // ✅ FIX: Added the missing deleteCategory function signature
  deleteCategory: (categoryId: string) => Promise<{ success: boolean; error?: string }>;
}

// 💡 FIX: Removed the unused 'get' parameter from the create callback
export const useCategoryStore = create<CategoryState>((set) => ({ 
  categories: [],
  
  setCategories: (categories) => set({ categories }),

  // ✅ FIX: Implementation of the deleteCategory action
  deleteCategory: async (categoryId) => {
    try {
      // 1. Call the server action to delete from the database
      const result = await deleteCategoryAction(categoryId);
      
      if (result.success) {
        // 2. Update the Zustand store state immediately by filtering out the deleted category
        set((state) => ({
          categories: state.categories.filter(c => c._id !== categoryId),
        }));
        return { success: true };
      } else {
        // Log error from server action if needed
        console.error("Server failed to delete category:", result.error);
        return { success: false, error: result.error || "Server action failed." };
      }
    } catch (error) {
      console.error("Client/Network error during category deletion:", error);
      return { success: false, error: "An unexpected error occurred during deletion." };
    }
  },
}));