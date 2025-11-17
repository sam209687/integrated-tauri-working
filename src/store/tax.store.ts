import { create } from 'zustand';
import { ITax } from '@/lib/models/tax';
import { deleteTax as deleteTaxAction } from '@/actions/tax.actions';

interface TaxStore {
  taxes: ITax[];
  setTaxes: (taxes: ITax[]) => void;
  deleteTax: (taxId: string) => Promise<void>;
}

// 💡 FIX: Removed the unused 'get' parameter
export const useTaxStore = create<TaxStore>((set) => ({
  taxes: [],
  setTaxes: (taxes) => set({ taxes }),
  deleteTax: async (taxId) => {
    try {
      const result = await deleteTaxAction(taxId);
      if (result.success) {
        set((state) => ({
          taxes: state.taxes.filter((tax) => tax._id.toString() !== taxId),
        }));
      } else {
        console.error("Failed to delete tax:", result.message);
      }
    } catch (error) {
      console.error("Error deleting tax:", error);
    }
  },
}));