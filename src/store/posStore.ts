// src/store/posStore.ts
import { create } from "zustand";
import { getVariantsForPOS, IPosVariant } from "@/actions/pos/pos.actions";
import { updateStockQuantitiesInDB } from "@/actions/variant.actions";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { IOecCartItem, IPosCartItem } from "@/types/pos.type";
// import type { IPosVariant, IPosCartItem, IOecCartItem } from "@/types/pos.types";

interface PosState {
  products: IPosVariant[];
  cart: IPosCartItem[];
  searchQuery: string;
  isLoading: boolean;
  isGstEnabled: boolean;
  
  setSearchQuery: (query: string) => void;
  fetchProducts: () => Promise<void>;
  addToCart: (product: IPosVariant) => void;
  addOecToCart: (item: IOecCartItem) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleGst: () => void;
  updateStocksAfterSale: (items: { variantId: string; quantity: number }[]) => Promise<void>;
  checkout: () => Promise<void>;
}

export const usePosStore = create<PosState>((set, get) => ({
  products: [],
  cart: [],
  searchQuery: "",
  isLoading: false,
  isGstEnabled: false,

  // Search
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Fetch product variants
  fetchProducts: async () => {
    set({ isLoading: true });
    try {
      const { success, data, message } = await getVariantsForPOS();

      if (!success || !data?.length) {
        console.warn("No products or variants found:", message);
        set({ products: [], isLoading: false });
        return;
      }

      set({ products: data, isLoading: false });
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      set({ products: [], isLoading: false });
    }
  },

  // Add variant to cart with stock validation
  addToCart: (product) => {
    const existingItem = get().cart.find((item) => item._id === product._id);
    const availableStock = product.stockQuantity ?? 0;

    if (availableStock <= 0) {
      toast.error(`${product.product.productName} is out of stock!`);
      return;
    }

    if (existingItem) {
      if (existingItem.quantity + 1 > availableStock) {
        toast.error("Not enough stock available!");
        return;
      }
      get().updateCartQuantity(product._id, existingItem.quantity + 1);
    } else {
      set((state) => ({
        cart: [
          ...state.cart,
          {
            _id: product._id,
            product: {
              productName: product.product.productName,
              productCode: product.product.productCode,
              tax: product.product.tax ? {
                _id: product.product.tax._id,
                gst: product.product.tax.gst,
                hsn: product.product.tax.hsn,
              } : undefined,
            },
            quantity: 1,
            price: product.price,
            mrp: product.mrp,
            variantVolume: product.variantVolume,
            unit: product.unit,
            variantColor: product.variantColor,
            type: "variant" as const,
            retailBillingData: product.retailBillingData,
          },
        ],
      }));
    }
  },

  // Add OEC item
  addOecToCart: (item) => {
    const newOecItem: IPosCartItem = {
      _id: uuidv4(),
      product: { 
        productName: item.productName,
        productCode: undefined,
        tax: undefined,
      },
      price: item.price,
      quantity: item.quantity,
      type: "oec",
    };
    set((state) => ({ cart: [...state.cart, newOecItem] }));
  },

  // Update quantity
  updateCartQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }

    const product = get().products.find((p) => p._id === productId);
    if (product && quantity > (product.stockQuantity ?? 0)) {
      toast.error("Not enough stock available!");
      return;
    }

    set((state) => ({
      cart: state.cart.map((item) =>
        item._id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  // Remove from cart
  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item._id !== productId),
    }));
  },

  // Clear cart
  clearCart: () => set({ cart: [], isGstEnabled: false }),

  // Toggle GST
  toggleGst: () => set((state) => ({ isGstEnabled: !state.isGstEnabled })),

  // Update stocks after sale
  updateStocksAfterSale: async (items) => {
    if (items.length === 0) return;

    try {
      const result = await updateStockQuantitiesInDB(items);
      
      if (!result.success) {
        toast.error(result.message || "Failed to update stocks in the database.");
      } else {
        console.log(result.message);
      }
    } catch (error) {
      console.error("❌ Error updating stocks:", error);
      toast.error("An unexpected error occurred during stock update.");
    }
  },

  // Checkout placeholder
  checkout: async () => {
    // Kept for interface compatibility
  },
}));

// Export types for convenience
export type { IPosVariant, IPosCartItem, IOecCartItem };