// src/store/variant.store.ts

import { create } from "zustand";
import { IPopulatedVariant } from "@/lib/models/variant";
import {
  getVariants,
  getVariantById,
  getVariantsByProductId,
} from "@/actions/variant.actions";
import { toast } from "sonner";

/* =========================================================
   TYPES
========================================================= */

interface ProductDetails {
  productCode: string;
  productName: string;
  sellingTypes: string[];
}

interface PricingInputs {
  unitConsumed: number;
  price: number;
  packingCharges: number;
  laborCharges: number;
  electricityCharges: number;
  others1: number;
  others2: number;
}

interface IVariantState {
  variants: IPopulatedVariant[];
  selectedVariant: IPopulatedVariant | null;
  productDetails: ProductDetails;

  totalPrice: number;

  loading: boolean;
  error: string | null;

  fetchVariants: () => Promise<void>;
  fetchVariantById: (id: string) => Promise<void>;
  fetchVariantsByProduct: (productId: string) => Promise<void>;
  clearSelectedVariant: () => void;

  calculatePrice: (data: PricingInputs) => number;
  updateCalculatedPricing: (data: PricingInputs) => void;
  
  addVariant: (variant: IPopulatedVariant) => void;
  updateVariant: (variant: IPopulatedVariant) => void;
  removeVariant: (variantId: string) => void;
}

/* =========================================================
   INITIAL STATE
========================================================= */

const initialProductDetails: ProductDetails = {
  productCode: "",
  productName: "",
  sellingTypes: [],
};

/* =========================================================
   HELPER
========================================================= */

function toPlainObject<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/* =========================================================
   STORE
========================================================= */

export const useVariantStore = create<IVariantState>((set, get) => ({
  variants: [],
  selectedVariant: null,
  productDetails: initialProductDetails,
  totalPrice: 0,
  loading: false,
  error: null,

  /* ================= FETCH ALL VARIANTS ================= */

  fetchVariants: async () => {
    set({ loading: true, error: null });

    try {
      const res = await getVariants();

      if (!res.success) {
        throw new Error(res.message);
      }

      set({
        variants: toPlainObject(res.data) as IPopulatedVariant[],
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch variants",
        loading: false,
      });
      toast.error("Failed to fetch variants");
    }
  },

  /* ================= FETCH SINGLE VARIANT ================= */

  fetchVariantById: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const res = await getVariantById(id);

      if (!res.success) {
        throw new Error(res.message);
      }

      const variant = toPlainObject(res.data) as IPopulatedVariant;

      set({
        selectedVariant: variant,
        productDetails: {
          productCode: variant.product?.productCode || "",
          productName: variant.product?.productName || "",
          sellingTypes: variant.product?.sellingTypes || [],
        },
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch variant",
        loading: false,
      });
      toast.error("Failed to fetch variant");
    }
  },

  /* ================= FETCH VARIANTS BY PRODUCT ================= */

  fetchVariantsByProduct: async (productId: string) => {
    set({ loading: true, error: null });

    try {
      const res = await getVariantsByProductId(productId);

      if (!res.success) {
        throw new Error(res.message);
      }

      set({
        variants: toPlainObject(res.data) as IPopulatedVariant[],
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch variants",
        loading: false,
      });
      toast.error("Failed to fetch variants for product");
    }
  },

  /* ================= CLEAR ================= */

  clearSelectedVariant: () => {
    set({
      selectedVariant: null,
      productDetails: initialProductDetails,
      totalPrice: 0,
    });
  },

  /* ================= PRICE CALCULATION ================= */

  calculatePrice: ({
    unitConsumed,
    price,
    packingCharges,
    laborCharges,
    electricityCharges,
    others1,
    others2,
  }) => {
    return (
      unitConsumed * price +
      packingCharges +
      laborCharges +
      electricityCharges +
      others1 +
      others2
    );
  },

  updateCalculatedPricing: (data) => {
    const total = get().calculatePrice(data);
    set({ totalPrice: total });
  },

  /* ================= CRUD HELPERS ================= */

  addVariant: (variant) =>
    set((state) => ({ 
      variants: [...state.variants, toPlainObject(variant) as IPopulatedVariant] 
    })),

  updateVariant: (variant) =>
    set((state) => ({
      variants: state.variants.map((v) =>
        v._id === variant._id ? toPlainObject(variant) as IPopulatedVariant : v
      ),
    })),

  removeVariant: (variantId) =>
    set((state) => ({
      variants: state.variants.filter((v) => v._id !== variantId),
    })),
}));