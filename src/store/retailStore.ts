// src/store/retailStore.ts
import { create } from 'zustand';
import { 
  getRetailSalesDataByVariant, 
  getRetailSalesMetrics,
  RetailVariantSalesData,
  RetailMetrics 
} from '@/actions/retail.actions';

interface RetailStoreState {
  // Data
  salesData: RetailVariantSalesData[];
  metrics: RetailMetrics | null;
  
  // Loading states
  isLoading: boolean;
  isMetricsLoading: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchRetailData: (fromDate?: Date, toDate?: Date) => Promise<void>;
  fetchRetailMetrics: (fromDate?: Date, toDate?: Date) => Promise<void>;
  clearData: () => void;
}

export const useRetailStore = create<RetailStoreState>((set) => ({
  // Initial state
  salesData: [],
  metrics: null,
  isLoading: false,
  isMetricsLoading: false,
  error: null,

  // Fetch retail sales data (for chart)
  fetchRetailData: async (fromDate?: Date, toDate?: Date) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await getRetailSalesDataByVariant(fromDate, toDate);
      
      if (result.success && result.data) {
        set({ 
          salesData: result.data,
          isLoading: false 
        });
      } else {
        set({ 
          error: result.message || 'Failed to fetch retail sales data',
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Error fetching retail data:', error);
      set({ 
        error: 'An unexpected error occurred',
        isLoading: false 
      });
    }
  },

  // Fetch retail metrics (for cards)
  fetchRetailMetrics: async (fromDate?: Date, toDate?: Date) => {
    set({ isMetricsLoading: true, error: null });
    
    try {
      const result = await getRetailSalesMetrics(fromDate, toDate);
      
      if (result.success && result.data) {
        set({ 
          metrics: result.data,
          isMetricsLoading: false 
        });
      } else {
        set({ 
          error: result.message || 'Failed to fetch retail metrics',
          isMetricsLoading: false 
        });
      }
    } catch (error) {
      console.error('Error fetching retail metrics:', error);
      set({ 
        error: 'An unexpected error occurred',
        isMetricsLoading: false 
      });
    }
  },

  // Clear all data
  clearData: () => set({ 
    salesData: [],
    metrics: null,
    error: null 
  }),
}));