"use client";

import { create } from "zustand";
import { getAllStoreDashboardData } from "@/actions/storeReferesh.action";
import { getSalesDataByVariant } from "@/actions/sales.actions";
import { getLatestCustomersAndCount } from "@/actions/customer.actions";
import { getLowStockProducts, getBoardPriceProducts } from "@/actions/product.actions";

// ------------------------------------------------------
// Types
// ------------------------------------------------------

interface DashboardData {
  dashboard: Awaited<ReturnType<typeof getAllStoreDashboardData>>;
  sales: Awaited<ReturnType<typeof getSalesDataByVariant>>;
  customers: Awaited<ReturnType<typeof getLatestCustomersAndCount>>;
  stockAlerts: Awaited<ReturnType<typeof getLowStockProducts>>;
  boardPrices: Awaited<ReturnType<typeof getBoardPriceProducts>>;
}

interface DashboardState {
  dashboardData: DashboardData | null;
  isLoading: boolean;
  refreshData: (fromDate?: Date, toDate?: Date) => Promise<void>;
}

// ------------------------------------------------------
// ✅ Admin Refresh Store
// ------------------------------------------------------

export const useAdminPanelStore = create<DashboardState>((set) => ({
  dashboardData: null,
  isLoading: false,

  refreshData: async (fromDate?: Date, toDate?: Date) => {
    set({ isLoading: true });

    try {
      const [
        dashboard,
        sales,
        customers,
        stockAlerts,
        boardPrices,
      ] = await Promise.all([
        getAllStoreDashboardData(fromDate, toDate),
        getSalesDataByVariant(fromDate, toDate),
        getLatestCustomersAndCount(),
        getLowStockProducts(),
        getBoardPriceProducts(),
      ]);

      set({
        dashboardData: {
          dashboard,
          sales,
          customers,
          stockAlerts,
          boardPrices,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error("❌ Error refreshing admin dashboard data:", error);
      set({ isLoading: false });
    }
  },
}));
