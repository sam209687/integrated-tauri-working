// src/store/adminPanelStore.ts
import { create } from 'zustand';
import { getDashboardData } from '@/actions/adminPanel.Actions';
import { 
  getSalesDataByVariant,
  type VariantSalesData,
} from '@/actions/sales.actions';
import { getSalesMetrics } from '@/actions/salesTracking.actions';
import { getFinancialMetrics } from '@/actions/invoice.actions';
import { toast } from 'sonner';

// ✅ Export the interface so it can be imported by other files
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

export interface DepositableCharges {
  packingCharges: number;
  laborCharges: number;
  electricityCharges: number;
  oecCharges: number;
}

export interface AllMetrics {
  totalRevenue: number;
  totalSales: number;
  avgOrderValue: number;
  totalProfit: number;
  totalDeposits: number;
  depositableCharges: DepositableCharges; 
}

interface AdminPanelState {
  dashboardData: DashboardData | null;
  isLoading: boolean;
  
  // New state for filtered data
  salesData: VariantSalesData[];
  allMetrics: AllMetrics;
  isFilteredDataLoading: boolean;
  
  // Actions
  fetchDashboardData: () => Promise<void>;
  fetchStaticData: (initialData: DashboardData | null) => Promise<void>;
  fetchFilteredData: (fromDate?: Date, toDate?: Date) => Promise<void>;
  refreshData: () => void;
}

// Chart colors defined at module level (stable reference)
const chartColors = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#AF19FF",
  "#FF008C",
];

export const useAdminPanelStore = create<AdminPanelState>((set, get) => ({
  dashboardData: null,
  isLoading: false,
  salesData: [],
  allMetrics: {
    totalRevenue: 0,
    totalSales: 0,
    avgOrderValue: 0,
    totalProfit: 0,
    totalDeposits: 0,
    depositableCharges: {
      packingCharges: 0,
      laborCharges: 0,
      electricityCharges: 0,
      oecCharges: 0,
    },
  },
  isFilteredDataLoading: false,

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

  // Fetch static data that doesn't depend on date filters (runs once on mount)
  fetchStaticData: async (initialData: DashboardData | null) => {
    if (initialData) {
      set({
        dashboardData: initialData,
        isLoading: false,
      });
    }
    // Note: Other static data fetches (monthly sales, customers, etc.) 
    // stay in their respective stores as they're already separated
  },

  // Fetch filtered data based on date range
  fetchFilteredData: async (fromDate?: Date, toDate?: Date) => {
    set({ isFilteredDataLoading: true });
    
    try {
      const [salesResult, basicMetricsResult, financialResult] = await Promise.all([
        getSalesDataByVariant(fromDate, toDate),
        getSalesMetrics(fromDate, toDate),
        getFinancialMetrics(fromDate, toDate),
      ]);

      const totalProfit =
        financialResult.success && financialResult.data
          ? financialResult.data.totalProfit
          : 0;

      const totalDeposits =
        financialResult.success && financialResult.data
          ? financialResult.data.totalDeposits
          : 0;

      const newDepositableCharges = 
        financialResult.success && financialResult.data && financialResult.data.depositableCharges
          ? financialResult.data.depositableCharges
          : null;

      let processedSalesData: VariantSalesData[] = [];
      if (salesResult.success && salesResult.data) {
        processedSalesData = salesResult.data.map((item, index) => ({
          ...item,
          fill: chartColors[index % chartColors.length],
        }));
      }

      const currentMetrics = get().allMetrics;
      let updatedMetrics: AllMetrics;

      if (basicMetricsResult.success && basicMetricsResult.data) {
        updatedMetrics = {
          ...basicMetricsResult.data,
          totalProfit,
          totalDeposits,
          depositableCharges: newDepositableCharges || currentMetrics.depositableCharges,
        };
      } else {
        updatedMetrics = {
          ...currentMetrics,
          totalProfit,
          totalDeposits,
          depositableCharges: newDepositableCharges || currentMetrics.depositableCharges,
        };
      }

      set({
        salesData: processedSalesData,
        allMetrics: updatedMetrics,
        isFilteredDataLoading: false,
      });

    } catch (err) {
      console.error("❌ Dashboard filtered data fetch error:", err);
      toast.error("Failed to fetch filtered data");
      set({ isFilteredDataLoading: false });
    }
  },

  refreshData: () => {
    set({ isLoading: true });
    // This will trigger a re-fetch in the component
  },
}));