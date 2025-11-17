// src/store/adminPanelStore.ts
import { create } from 'zustand';
import { getDashboardData } from '@/actions/adminPanel.Actions';
import { toast } from 'sonner';

// ✅ FIX: Export the interface so it can be imported by other files
export interface DashboardData {
  totalBalance: number;
  totalSales: number;
  analyticsPerformance: { year: string; sales: number; }[];
  saleOverview: { month: string; sales: number; }[];
  income: number;
  expense: number;
  transactionHistory: ITransaction[];
}

export interface ITransaction {
  name: string;
  date: string;
  type: "Withdrawal" | "Deposit";
  amount: number;
  status: "Complete" | "Pending";
}

interface AdminPanelState {
  dashboardData: DashboardData | null;
  isLoading: boolean;
  fetchDashboardData: () => Promise<void>;
  refreshData: () => void;
}

export const useAdminPanelStore = create<AdminPanelState>((set) => ({
  dashboardData: null,
  isLoading: false,
  fetchDashboardData: async () => {
    set({ isLoading: true });
    try {
      const result = await getDashboardData();
      if (result.success) {
        set({ dashboardData: result.data, isLoading: false });
      } else {
        toast.error(result.message);
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to fetch data due to an unexpected error.");
      set({ isLoading: false });
    }
  },
  refreshData: () => {
    set((state) => ({ ...state, isLoading: true }));
    // This will trigger a re-fetch in the component
  },
}));