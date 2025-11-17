import { create } from "zustand";
import {
  getProductsForBatch,
  deleteBatch,
  getBatches,
} from "@/actions/batch.actions";
import { IPopulatedProduct } from "@/lib/models/product";
import { ICategory } from "@/lib/models/category";
import { getCategories } from "@/actions/product.actions";
import { toast } from "sonner";

// ✅ Lightweight product type for store state
interface IProduct {
  _id: string;
  productName: string;
  productCode: string;
  category: ICategory;
}

// ✅ Fully-populated batch type
export interface IPopulatedBatch {
  _id: string;
  product: IPopulatedProduct;
  batchNumber: string;
  vendorName: string;
  qty: number;
  price: number;
  perUnitPrice?: number;
  oilCakeProduced?: number;
  oilExpelled?: number;
  createdAt: Date;
}

interface BatchStoreState {
  products: IProduct[];
  batches: IPopulatedBatch[];
  categories: ICategory[];
  isLoading: boolean;
  isDeleting: boolean;
  selectedProductCode: string | null;

  fetchProducts: () => Promise<void>;
  fetchBatches: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  setBatches: (batches: IPopulatedBatch[]) => void;
  updateBatch: (updatedBatch: IPopulatedBatch) => void;
  deleteBatch: (batchId: string) => Promise<void>;
  setSelectedProductCode: (code: string | null) => void;
}

export const useBatchStore = create<BatchStoreState>((set) => ({
  products: [],
  batches: [],
  categories: [],
  isLoading: false,
  isDeleting: false,
  selectedProductCode: null,

  /** ✅ Fetch all products for dropdowns in BatchForm */
  fetchProducts: async () => {
    set({ isLoading: true });
    try {
      const result = await getProductsForBatch();
      if (result.success && result.data) {
        set({ products: result.data, isLoading: false });
      } else {
        toast.error(result.message || "Failed to fetch products.");
        set({ isLoading: false, products: [] });
      }
    } catch (error) {
      console.error("❌ Failed to fetch products:", error);
      toast.error("Unexpected error while fetching products.");
      set({ isLoading: false, products: [] });
    }
  },

  /** ✅ Fetch all batches for tables */
  fetchBatches: async () => {
    set({ isLoading: true });
    try {
      const result = await getBatches();
      if (result.success && result.data) {
        set({ batches: result.data, isLoading: false });
      } else {
        toast.error(result.message || "Failed to fetch batches.");
        set({ isLoading: false, batches: [] });
      }
    } catch (error) {
      console.error("❌ Failed to fetch batches:", error);
      toast.error("Unexpected error while fetching batches.");
      set({ isLoading: false, batches: [] });
    }
  },

  /** ✅ Fetch categories used for product filtering */
  fetchCategories: async () => {
    try {
      const result = await getCategories();
      if (result.success && result.data) {
        set({ categories: result.data });
      } else {
        toast.error(result.message || "Failed to fetch categories.");
      }
    } catch (error) {
      console.error("❌ Failed to fetch categories:", error);
      toast.error("Unexpected error while fetching categories.");
    }
  },

  /** ✅ Replace all batches */
  setBatches: (batches) => set({ batches }),

  /** ✅ Update one batch in place */
  updateBatch: (updatedBatch) => {
    set((state) => ({
      batches: state.batches.map((b) =>
        b._id === updatedBatch._id ? updatedBatch : b
      ),
    }));
  },

  /** ✅ Delete a batch by ID */
  deleteBatch: async (batchId) => {
    set({ isDeleting: true });
    try {
      const result = await deleteBatch(batchId);
      if (result.success) {
        toast.success(result.message);
        set((state) => ({
          batches: state.batches.filter((b) => b._id.toString() !== batchId),
          isDeleting: false,
        }));
      } else {
        toast.error(result.message || "Failed to delete batch.");
        set({ isDeleting: false });
      }
    } catch (error) {
      console.error("❌ Failed to delete batch:", error);
      toast.error("Unexpected error while deleting batch.");
      set({ isDeleting: false });
    }
  },

  /** ✅ Used for batch number generation */
  setSelectedProductCode: (code) => set({ selectedProductCode: code }),
}));
