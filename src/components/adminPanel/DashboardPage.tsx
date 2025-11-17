// src/components/adminPanel/dashboard/DashboardPage.tsx
"use client";

import { useAdminPanelStore, DashboardData } from "@/store/adminPanelStore";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { subDays, startOfDay, endOfDay } from "date-fns"; 

import {
  getSalesDataByVariant,
  type VariantSalesData,
} from "@/actions/sales.actions";
import { getSalesMetrics } from "@/actions/salesTracking.actions";
import { getFinancialMetrics } from "@/actions/invoice.actions";

import { MonthlySalesChart } from "./MonthlySalesChart";
import { CustomerDetailsTable } from "./CustomerDetailsTable"; 
import { SalesTrackingMetrics } from "./SalesTrackingMetrics";
import { DashboardFilter } from "./DashboardFilter";
// 💡 IMPORTANT: Ensure this import path is correct based on your file structure
// import { PermanentCalendarCard } from "../PermanentCalendarCard"; 
import { StockAlertCard } from "./StockAlertCard";
import { BoardPriceCard } from "./BoardPriceCard"; 

import { useMonthlySalesStore } from "@/store/monthlySales.store"; 
import { useCustomerDetailsStore } from "@/store/customerDetails.store"; 
import { useStockAlertStore } from "@/store/stockAlert.store"; 
import { useBoardPriceStore } from "@/store/boardPrice.store"; 
import { PackingMaterialAlertCard } from "./PackingMaterialAlertCard";
import { PermanentCalendarCard } from "./PermanentCalendarCard";


const DynamicSalesOverviewChart = dynamic(
  () => import("./SaleOverviewChart").then((mod) => mod.SalesOverviewChart),
  { ssr: false }
);

interface DashboardPageProps {
  initialData: DashboardData | null;
}

interface DepositableCharges {
  packingCharges: number;
  laborCharges: number;
  electricityCharges: number;
  oecCharges: number;
}

interface AllMetrics {
  totalRevenue: number;
  totalSales: number;
  avgOrderValue: number;
  totalProfit: number;
  totalDeposits: number;
  depositableCharges: DepositableCharges; 
}

// Helper functions for initializing the default 'Last 7 Days' filter
const getStartOfLast7Days = () => startOfDay(subDays(new Date(), 7));
const getEndOfToday = () => endOfDay(new Date());

// 💡 FIX: Move chartColors definition outside the component
const chartColors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#AF19FF",
    "#FF008C",
];


export function DashboardPage({ initialData }: DashboardPageProps) {
  const { dashboardData, isLoading, refreshData } = useAdminPanelStore();

  const { monthlySales, isLoading: isMonthlySalesLoading, fetchMonthlySales } = useMonthlySalesStore(); 
  
  const { 
    products: boardPriceProducts, 
    totalProducts,
    isLoading: isBoardPriceLoading, 
    error: boardPriceError, 
    fetchProducts: fetchBoardPrices 
  } = useBoardPriceStore();

  const { 
    newCustomers, 
    totalCustomerCount, 
    isLoading: isCustomerLoading, 
    fetchCustomerDetails 
  } = useCustomerDetailsStore(); 

  const { 
    lowStockVariants, 
    isLoading: isStockAlertLoading, 
    error: stockAlertError, 
    fetchLowStockAlerts 
  } = useStockAlertStore();

  const [salesData, setSalesData] = useState<VariantSalesData[]>([]);
  
  const [allMetrics, setAllMetrics] = useState<AllMetrics>({
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
  });

  // State initialized to 'last7days' for default rendering
  const [activeFilterType, setActiveFilterType] = useState<string>('last7days');
  const [fromDate, setFromDate] = useState<Date | undefined>(getStartOfLast7Days());
  const [toDate, setToDate] = useState<Date | undefined>(getEndOfToday());

  
  // Callback to update filter dates and type when DashboardFilter changes
  const handleFilterChange = useCallback(
    (filterType: string, newFromDate?: Date, newToDate?: Date) => {
      setActiveFilterType(filterType); 
      setFromDate(newFromDate);
      setToDate(newToDate);
    },
    []
  );

  const handleCalendarDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      setActiveFilterType('custom-card'); 
      const start = startOfDay(date);
      const end = endOfDay(date);
      setFromDate(start);
      setToDate(end);
    }
  }, []);
  
  // Effect runs on mount and whenever fromDate or toDate changes to fetch data
  useEffect(() => {
    if (initialData) {
      useAdminPanelStore.setState({
        dashboardData: initialData,
        isLoading: false,
      });
    }

    // Fetch dynamic data for the new components
    fetchMonthlySales();
    fetchCustomerDetails(); 
    fetchLowStockAlerts(); 
    fetchBoardPrices(); 

    const fetchAllData = async () => {
      try {
        // Use the current fromDate and toDate state values for API calls
        const [salesResult, basicMetricsResult, financialResult] =
          await Promise.all([
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
            
        // Check if new depositable charges exist. If not, we fall back to the existing charges.
        const newDepositableCharges = 
            financialResult.success && financialResult.data && financialResult.data.depositableCharges
            ? financialResult.data.depositableCharges
            : null; // Set to null to clearly indicate no new data

        if (salesResult.success && salesResult.data) {
          const processedData = salesResult.data.map((item, index) => ({
            ...item,
            fill: chartColors[index % chartColors.length],
          }));
          setSalesData(processedData);
        }

        if (basicMetricsResult.success && basicMetricsResult.data) {
            // Use functional update to safely access previous state
            setAllMetrics((prev) => ({
                ...basicMetricsResult.data,
                totalProfit,
                totalDeposits,
                // Use new charges if available, otherwise use previous state's charges
                depositableCharges: newDepositableCharges || prev.depositableCharges, 
            }));
        } else {
            // Use functional update to safely access previous state
            setAllMetrics((prev) => ({
                ...prev,
                totalProfit,
                totalDeposits,
                // Use new charges if available, otherwise use previous state's charges
                depositableCharges: newDepositableCharges || prev.depositableCharges,
            }));
        }

      } catch (err) {
        console.error("❌ Dashboard fetch error:", err);
      }
    };

    fetchAllData();
  }, [
    initialData, 
    fromDate, 
    toDate,   
    fetchMonthlySales, 
    fetchCustomerDetails,
    fetchLowStockAlerts,
    fetchBoardPrices,
    // chartColors is now stable and does not need to be listed
  ]); 

  if (isLoading || !dashboardData || isMonthlySalesLoading || isCustomerLoading || isStockAlertLoading || isBoardPriceLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        {/* All filter elements are in this single row div */}
        <div className="flex items-center space-x-4">
          
          <DashboardFilter 
            onFilterChange={handleFilterChange} 
            activeFilterType={activeFilterType}
            currentFromDate={fromDate}
            currentToDate={toDate}
            // 🛠️ FIX: Add key prop to force remount/reset of local state when filter type changes.
            key={activeFilterType} 
          />
          
          <Button onClick={refreshData} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh Data
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <SalesTrackingMetrics
        totalRevenue={allMetrics.totalRevenue}
        totalSales={allMetrics.totalSales}
        avgOrderValue={allMetrics.avgOrderValue}
        totalProfit={allMetrics.totalProfit}
        totalDeposits={allMetrics.totalDeposits}
        depositableCharges={allMetrics.depositableCharges}
      />

      {/* Charts + Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <DynamicSalesOverviewChart data={salesData} />
        </div>
        <div className="lg:col-span-2">
          {/* 🟢 FIX: Props are correctly passed here and accepted by PermanentCalendarCard */}
          <PermanentCalendarCard
            selectedDate={toDate}
            onDateChange={handleCalendarDateChange}
          />
        </div>
      </div>

      {/* ROW 1: Monthly Sales Chart and Customer Details Table (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlySalesChart data={monthlySales} /> 
        
        <CustomerDetailsTable 
            data={newCustomers}
            totalCustomerCount={totalCustomerCount}
            isLoading={isCustomerLoading}
        />
      </div>
      
      {/* Stock and Packing Material Alert Cards (2 equal columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock Alert Card (takes 1/2 width on large screens) */}
        <StockAlertCard
            data={lowStockVariants} 
            isLoading={isStockAlertLoading}
            error={stockAlertError}
        />
        {/* Packing Material Alert Card (takes 1/2 width on large screens) */}
        <PackingMaterialAlertCard />
      </div>

      {/* ROW 3: Board Price Card (1 column, full width) */}
      <div className="grid grid-cols-1 gap-4">
        <BoardPriceCard
            data={boardPriceProducts}
            totalCount={totalProducts}
            isLoading={isBoardPriceLoading}
            error={boardPriceError}
        />
      </div>
      
    </div>
  );
}