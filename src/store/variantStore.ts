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

interface CalculatedPricing {
  price: number;
  discount: number;
}

interface IVariantState {
  variants: IPopulatedVariant[];
  products: IPopulatedProduct[];
  units: IUnit[];
  isLoading: boolean;
  productDetails: ProductDetails;
  calculatedPricing: CalculatedPricing;

  // State setters
  setVariants: (variants: IPopulatedVariant[]) => void;
  setProducts: (products: IPopulatedProduct[]) => void;
  setUnits: (units: IUnit[]) => void;
  setProductDetails: (details: ProductDetails) => void;

  // Async actions
  fetchVariants: () => Promise<void>;
  fetchFormData: () => Promise<void>;
  fetchProductDetails: (productId: string) => Promise<void>;
  
  // New pricing calculation actions
  calculatePrice: (params: {
    unitConsumed: number;
    packingCharges: number;
    laborCharges: number;
    electricityCharges: number;
    others1: number;
    others2: number;
  }) => number;
  
  calculateDiscount: (price: number, mrp: number) => number;
  
  updateCalculatedPricing: (params: {
    unitConsumed?: number;
    packingCharges?: number;
    laborCharges?: number;
    electricityCharges?: number;
    others1?: number;
    others2?: number;
    price?: number;
    mrp?: number;
  }) => CalculatedPricing;

  // Local store CRUD helpers
  addVariant: (variant: IVariant) => Promise<void>;
  updateVariant: (variant: IVariant) => Promise<void>;
  removeVariant: (variantId: string) => void;
  
  // Reset functions
  resetProductDetails: () => void;
  resetCalculatedPricing: () => void;
}

const initialProductDetails: ProductDetails = {
  productCode: "",
  totalPrice: 0,
  purchasePrice: 0,
  sellingPrice: 0,
};

const initialCalculatedPricing: CalculatedPricing = {
  price: 0,
  discount: 0,
};

export const useVariantStore = create<IVariantState>((set, get) => ({
  variants: [],
  products: [],
  units: [],
  isLoading: false,
  productDetails: initialProductDetails,
  calculatedPricing: initialCalculatedPricing,

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
  // ✅ FETCH PRODUCT DETAILS
  // ---------------------
  fetchProductDetails: async (productId: string) => {
    if (!productId) {
      get().resetProductDetails();
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
        get().resetProductDetails();
      }
    } catch (error) {
      console.error("❌ Failed to fetch product details:", error);
      toast.error("Error fetching product details.");
      get().resetProductDetails();
    }
  },

  // ---------------------
  // ✅ CALCULATE PRICE
  // ---------------------
  calculatePrice: (params) => {
    const { productDetails } = get();
    const sellingPrice = productDetails.sellingPrice || 0;
    
    const {
      unitConsumed = 0,
      packingCharges = 0,
      laborCharges = 0,
      electricityCharges = 0,
      others1 = 0,
      others2 = 0,
    } = params;

    const calculatedPrice =
      unitConsumed * sellingPrice +
      packingCharges +
      laborCharges +
      electricityCharges +
      others1 +
      others2;

    return calculatedPrice;
  },

  // ---------------------
  // ✅ CALCULATE DISCOUNT
  // ---------------------
  calculateDiscount: (price, mrp) => {
    if (mrp <= 0) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  },

  // ---------------------
  // ✅ UPDATE CALCULATED PRICING
  // ---------------------
  updateCalculatedPricing: (params) => {
    const state = get();
    
    // If price-related params are provided, calculate new price
    if (
      params.unitConsumed !== undefined ||
      params.packingCharges !== undefined ||
      params.laborCharges !== undefined ||
      params.electricityCharges !== undefined ||
      params.others1 !== undefined ||
      params.others2 !== undefined
    ) {
      const newPrice = state.calculatePrice({
        unitConsumed: params.unitConsumed ?? 0,
        packingCharges: params.packingCharges ?? 0,
        laborCharges: params.laborCharges ?? 0,
        electricityCharges: params.electricityCharges ?? 0,
        others1: params.others1 ?? 0,
        others2: params.others2 ?? 0,
      });

      const currentMrp = params.mrp ?? state.calculatedPricing.price;
      const newDiscount = state.calculateDiscount(newPrice, currentMrp);

      const newPricing = { price: newPrice, discount: newDiscount };
      set({ calculatedPricing: newPricing });
      return newPricing;
    }

    // If only price or mrp changed, recalculate discount
    if (params.price !== undefined || params.mrp !== undefined) {
      const price = params.price ?? state.calculatedPricing.price;
      const mrp = params.mrp ?? 0;
      const newDiscount = state.calculateDiscount(price, mrp);

      const newPricing = { price, discount: newDiscount };
      set({ calculatedPricing: newPricing });
      return newPricing;
    }

    return state.calculatedPricing;
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

  // ---------------------
  // ✅ RESET FUNCTIONS
  // ---------------------
  resetProductDetails: () => {
    set({ productDetails: initialProductDetails });
  },

  resetCalculatedPricing: () => {
    set({ calculatedPricing: initialCalculatedPricing });
  },
}));