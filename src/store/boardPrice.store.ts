// src/store/boardPrice.store.ts

import { create } from 'zustand';
import { toast } from 'sonner';
import { 
  getBoardPriceProducts, 
  updateProductSellingPrice, 
  BoardPriceItem 
} from '@/actions/product.actions'; 

// 💡 FIX: Changed interface to type alias to resolve the empty-object-type error.
// State type for a single product item in the board
export type BoardPriceProduct = BoardPriceItem;

// Store state interface
interface BoardPriceState {
  products: BoardPriceProduct[];
  totalProducts: number;
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  updatePrice: (id: string, newPrice: number) => Promise<void>;
}

export const useBoardPriceStore = create<BoardPriceState>((set, get) => ({
  products: [],
  totalProducts: 0,
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await getBoardPriceProducts();

      if (result.success && result.data) {
        set({
          // The BoardPriceItem[] type is now assignable to BoardPriceProduct[]
          products: result.data as BoardPriceProduct[], 
          totalProducts: result.totalCount,
          isLoading: false,
        });
      } else {
        set({ 
          isLoading: false, 
          error: result.message || 'Failed to fetch product prices.',
          products: [],
          totalProducts: 0,
        });
        toast.error(result.message || 'Failed to fetch product prices.');
      }
    } catch (err) {
      console.error("Error fetching board prices:", err);
      set({ isLoading: false, error: 'An unexpected error occurred.' });
      toast.error('An unexpected error occurred while fetching prices.');
    }
  },

  updatePrice: async (id, newPrice) => {
    // Basic validation
    if (newPrice <= 0 || isNaN(newPrice)) {
        toast.error("Invalid price entered.");
        return;
    }
    
    // Optimistic update
    const originalProducts = get().products;
    const originalProduct = originalProducts.find(p => p._id === id);
    if (originalProduct) {
        set(state => ({
            products: state.products.map(p => 
                p._id === id ? { ...p, sellingPrice: newPrice } : p
            )
        }));
    }

    try {
        const result = await updateProductSellingPrice(id, newPrice);

        if (result.success) {
            toast.success(result.message);
            // The state is already updated optimistically, so no need to update again unless 
            // the server returned a slightly different value (which is handled by refetch/next revalidate)
        } else {
            // Revert on failure
            if (originalProduct) {
                set(state => ({
                    products: state.products.map(p => 
                        p._id === id ? originalProduct : p
                    )
                }));
            }
            toast.error(result.message || 'Failed to update price.');
        }
    } catch (err) {
        // Revert on failure
        if (originalProduct) {
            set(state => ({
                products: state.products.map(p => 
                    p._id === id ? originalProduct : p
                )
            }));
        }
        console.error("Error updating price:", err);
        toast.error('An unexpected error occurred during price update.');
    }
  },
}));