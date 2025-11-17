// src/store/variantStore.ts

import { create } from "zustand";
import { toast } from "sonner";

import { IPopulatedProduct } from "@/lib/models/product";
import { IUnit } from "@/lib/models/unit";
import { IVariant, IPopulatedVariant } from "@/lib/models/variant";

import { getProductById, getProducts } from "@/actions/product.actions";
import { getUnits } from "@/actions/unit.actions";
import { getVariants, getVariantById } from "@/actions/variant.actions";

interface ProductDetails {
  productCode: string;
  totalPrice: number;
  purchasePrice: number;
  sellingPrice: number;
}

interface IVariantState {
  variants: IPopulatedVariant[];
  products: IPopulatedProduct[];
  units: IUnit[];
  isLoading: boolean;
  productDetails: ProductDetails;

  // State setters
  setVariants: (variants: IPopulatedVariant[]) => void;
  setProducts: (products: IPopulatedProduct[]) => void;
  setUnits: (units: IUnit[]) => void;
  setProductDetails: (details: ProductDetails) => void;

  // Async actions
  fetchVariants: () => Promise<void>;
  fetchFormData: () => Promise<void>;
  fetchProductDetails: (productId: string) => Promise<void>;

  // Local store CRUD helpers
  addVariant: (variant: IVariant) => Promise<void>;
  updateVariant: (variant: IVariant) => Promise<void>;
  removeVariant: (variantId: string) => void;
}

// ✅ FIX: Removed the unused 'get' function argument
export const useVariantStore = create<IVariantState>((set) => ({
  variants: [],
  products: [],
  units: [],
  isLoading: false,
  productDetails: {
    productCode: "",
    totalPrice: 0,
    purchasePrice: 0,
    sellingPrice: 0,
  },

  // ---------------------
  // ✅ SETTERS
  // ---------------------
  setVariants: (variants) => set({ variants }),
  setProducts: (products) => set({ products }),
  setUnits: (units) => set({ units }),
  setProductDetails: (details) => set({ productDetails: details }),

  // ---------------------
  // ✅ FETCH VARIANTS
  // ---------------------
  fetchVariants: async () => {
    set({ isLoading: true });
    try {
      const result = await getVariants();
      if (result.success && result.data) {
        set({ variants: result.data as IPopulatedVariant[], isLoading: false });
      } else {
        toast.error(result.message || "Failed to fetch variants.");
        set({ isLoading: false, variants: [] });
      }
    } catch (error) {
      console.error("❌ Failed to fetch variants:", error);
      set({ isLoading: false, variants: [] });
    }
  },

  // ---------------------
  // ✅ FETCH FORM DATA
  // ---------------------
  fetchFormData: async () => {
    set({ isLoading: true });
    try {
      const [productResult, unitResult] = await Promise.all([
        getProducts(),
        getUnits(),
      ]);

      if (productResult.success && productResult.data) {
        set({ products: productResult.data as IPopulatedProduct[] });
      }

      if (unitResult.success && unitResult.data) {
        set({ units: unitResult.data });
      }

      set({ isLoading: false });
    } catch (error) {
      console.error("❌ Failed to fetch form data:", error);
      toast.error("Error fetching form data.");
      set({ isLoading: false });
    }
  },

  // ---------------------
  // ✅ FETCH PRODUCT DETAILS (Dynamic Pricing Fix)
  // ---------------------
  fetchProductDetails: async (productId: string) => {
    if (!productId) {
      // Clear product details if no product selected
      set({
        productDetails: {
          productCode: "",
          totalPrice: 0,
          purchasePrice: 0,
          sellingPrice: 0,
        },
      });
      return;
    }

    try {
      const result = await getProductById(productId);

      if (result.success && result.data) {
        const product = result.data;
        console.log("✅ Product details fetched:", {
          id: productId,
          name: product.productName,
          purchasePrice: product.purchasePrice,
          sellingPrice: product.sellingPrice,
        });

        set({
          productDetails: {
            productCode: product.productCode || "",
            totalPrice: product.totalPrice || 0,
            purchasePrice: product.purchasePrice || 0,
            sellingPrice: product.sellingPrice || 0,
          },
        });
      } else {
        console.warn("⚠️ Product not found or missing details:", result.message);
        set({
          productDetails: {
            productCode: "",
            totalPrice: 0,
            purchasePrice: 0,
            sellingPrice: 0,
          },
        });
      }
    } catch (error) {
      console.error("❌ Failed to fetch product details:", error);
      toast.error("Error fetching product details.");
      set({
        productDetails: {
          productCode: "",
          totalPrice: 0,
          purchasePrice: 0,
          sellingPrice: 0,
        },
      });
    }
  },

  // ---------------------
  // ✅ ADD VARIANT
  // ---------------------
  addVariant: async (variant) => {
    try {
      const populatedVariant = await getVariantById(variant._id);
      if (populatedVariant.success && populatedVariant.data) {
        set((state) => ({
          variants: [
            ...state.variants,
            populatedVariant.data as IPopulatedVariant,
          ],
        }));
      }
    } catch (error) {
      console.error("❌ Failed to add variant to store:", error);
    }
  },

  // ---------------------
  // ✅ UPDATE VARIANT
  // ---------------------
  updateVariant: async (updatedVariant) => {
    try {
      const populatedVariant = await getVariantById(updatedVariant._id);
      if (populatedVariant.success && populatedVariant.data) {
        set((state) => ({
          variants: state.variants.map((v) =>
            v._id === updatedVariant._id
              ? (populatedVariant.data as IPopulatedVariant)
              : v
          ),
        }));
      }
    } catch (error) {
      console.error("❌ Failed to update variant in store:", error);
    }
  },

  // ---------------------
  // ✅ REMOVE VARIANT
  // ---------------------
  removeVariant: (variantId) => {
    set((state) => ({
      variants: state.variants.filter((v) => v._id !== variantId),
    }));
  },
}));