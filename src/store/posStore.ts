// src/store/posStore.ts
import { create } from "zustand";
import { getVariantsForPOS, IPosVariant } from "@/actions/pos/pos.actions";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

// ✅ NEW: Import the real stock update action
import { updateStockQuantitiesInDB } from "@/actions/variant.actions"; 

// ❌ REMOVED: The mockUpdateStockQuantitiesInDB constant is now removed.

export interface ICartItem {
  _id: string;
  quantity: number;
  price: number;
  product: {
    productName: string;
    productCode?: string;
    tax?: {
      gst: number;
      hsn: string;
    };
  };
  mrp?: number;
  discountPercentage?: number;
  variantVolume?: number;
  unit?: { _id: string; name: string };
  variantColor?: string;
  type: "variant" | "oec";
}

export interface OecCartItem {
  productName: string;
  quantity: number;
  price: number;
}

interface PosState {
  products: IPosVariant[];
  cart: ICartItem[];
  searchQuery: string;
  isLoading: boolean;
  isGstEnabled: boolean;
  setSearchQuery: (query: string) => void;
  fetchProducts: () => Promise<void>;
  addToCart: (product: IPosVariant) => void;
  addOecToCart: (item: OecCartItem) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleGst: () => void;
  // ✅ NEW: Dedicated function to update stock in DB after a successful sale.
  updateStocksAfterSale: (items: { variantId: string; quantity: number }[]) => Promise<void>; 
  checkout: () => Promise<void>;
}

export const usePosStore = create<PosState>((set, get) => ({
  products: [],
  cart: [],
  searchQuery: "",
  isLoading: false,
  isGstEnabled: false,

  // ✅ Search
  setSearchQuery: (query) => set({ searchQuery: query }),

  // ✅ Fetch product variants
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

  // ✅ Add variant to cart with stock validation
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
            product: product.product,
            quantity: 1,
            price: product.price,
            mrp: product.mrp,
            variantVolume: product.variantVolume,
            unit: product.unit,
            variantColor: product.variantColor,
            type: "variant",
          },
        ],
      }));
    }
  },

  // ✅ Add custom item
  addOecToCart: (item) => {
    const newOecItem: ICartItem = {
      _id: uuidv4(),
      product: { productName: item.productName },
      price: item.price,
      quantity: item.quantity,
      type: "oec",
    };
    set((state) => ({ cart: [...state.cart, newOecItem] }));
  },

  // ✅ Update quantity
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

  // ✅ Remove from cart
  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item._id !== productId),
    }));
  },

  // ✅ Clear cart
  clearCart: () => set({ cart: [], isGstEnabled: false }),

  // ✅ Toggle GST
  toggleGst: () => set((state) => ({ isGstEnabled: !state.isGstEnabled })),

  // ✅ UPDATED: Update stocks after sale action now uses the real backend function
  updateStocksAfterSale: async (items) => {
    if (items.length === 0) return;

    try {
      // 💡 Call the actual server action to reduce stock quantity
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

  // ✅ Checkout (Retaining the signature, but removing the confusing body)
  checkout: async () => {
    // This function is kept for interface compatibility but is not the primary checkout path.
  },
}));