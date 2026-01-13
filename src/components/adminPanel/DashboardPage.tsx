// src/components/adminPanel/dashboard/DashboardPage.tsx (UPDATED)
"use client";

import { useAdminPanelStore, DashboardData } from "@/store/adminPanelStore";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { subDays, startOfDay, endOfDay } from "date-fns"; 

import { MonthlySalesChart } from "./MonthlySalesChart";
import { CustomerDetailsTable } from "./CustomerDetailsTable"; 
import { SalesTrackingMetrics } from "./SalesTrackingMetrics";
import { DashboardFilter } from "./DashboardFilter";
import { StockAlertCard } from "./StockAlertCard";
import { BoardPriceCard } from "./BoardPriceCard"; 
import { ReportGenerator } from "./dashboard/ReportGenerator";
import { RetailBusinessReport } from "@/components/reports/retail-business-report";
// import { RetailSalesContainer } from "../retailCards/RetailSalesContainer"; // ✅ NEW

import { useMonthlySalesStore } from "@/store/monthlySales.store"; 
import { useCustomerDetailsStore } from "@/store/customerDetails.store"; 
import { useStockAlertStore } from "@/store/stockAlert.store"; 
import { useBoardPriceStore } from "@/store/boardPrice.store"; 
import { PackingMaterialAlertCard } from "./PackingMaterialAlertCard";
import { PermanentCalendarCard } from "./PermanentCalendarCard";
import { DashboardLoading } from "./DashboardLoading";
import { RetailSalesContainer } from "./retailCards/RetailSalesContainer";

const DynamicSalesOverviewChart = dynamic(
  () => import("./SaleOverviewChart").then((mod) => mod.SalesOverviewChart),
  { ssr: false }
);

interface DashboardPageProps {
  initialData: DashboardData | null;
}

// Helper functions for initializing the default 'Last 7 Days' filter
const getStartOfLast7Days = () => startOfDay(subDays(new Date(), 7));
const getEndOfToday = () => endOfDay(new Date());

export function DashboardPage({ initialData }: DashboardPageProps) {
  // Main dashboard store
  const { 
    dashboardData, 
    isLoading, 
    salesData, 
    allMetrics, 
    isFilteredDataLoading,
    fetchStaticData, 
    fetchFilteredData,
    refreshData 
  } = useAdminPanelStore();

  // Other stores for static data
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
  
  // Effect 1: Run ONCE on mount for static data
  useEffect(() => {
    // Fetch static dashboard data
    fetchStaticData(initialData);
    
    // Fetch other static data from their respective stores
    fetchMonthlySales();
    fetchCustomerDetails(); 
    fetchLowStockAlerts(); 
    fetchBoardPrices(); 
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array = run once on mount

  // Effect 2: Run when date filters change
  useEffect(() => {
    fetchFilteredData(fromDate, toDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]); // Only re-run when dates change

  if (isLoading || !dashboardData || isMonthlySalesLoading || isCustomerLoading || isStockAlertLoading || isBoardPriceLoading) {
    return <div>
      <DashboardLoading/>
    </div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        {/* All filter and action buttons in a single row */}
        <div className="flex items-center space-x-4">
          
          <DashboardFilter 
            onFilterChange={handleFilterChange} 
            activeFilterType={activeFilterType}
            currentFromDate={fromDate}
            currentToDate={toDate}
            key={activeFilterType} 
          />
          
          {/* Report Generator Button */}
          <ReportGenerator />
          
          <Button onClick={refreshData} disabled={isLoading || isFilteredDataLoading}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh Data
          </Button>
        </div>
      </div>

      {/* ============================================ */}
      {/* EDIBLE OIL BUSINESS TRACKING */}
      {/* ============================================ */}
      
      {/* KPI Cards - Edible Oil */}
      <SalesTrackingMetrics
        totalRevenue={allMetrics.totalRevenue}
        totalSales={allMetrics.totalSales}
        avgOrderValue={allMetrics.avgOrderValue}
        totalProfit={allMetrics.totalProfit}
        totalDeposits={allMetrics.totalDeposits}
        depositableCharges={allMetrics.depositableCharges}
      />

      {/* Charts + Calendar - Edible Oil */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <DynamicSalesOverviewChart data={salesData} />
        </div>
        <div className="lg:col-span-2">
          <PermanentCalendarCard
            selectedDate={toDate}
            onDateChange={handleCalendarDateChange}
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* RETAIL BUSINESS TRACKING (NEW) */}
      {/* ============================================ */}
      
      <RetailSalesContainer 
        fromDate={fromDate} 
        toDate={toDate} 
      />

      {/* ============================================ */}
      {/* GENERAL REPORTS & ANALYTICS */}
      {/* ============================================ */}

      {/* ROW 1: Monthly Sales Chart and Customer Details Table (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlySalesChart data={monthlySales} /> 
        
        <CustomerDetailsTable 
            data={newCustomers}
            totalCustomerCount={totalCustomerCount}
            isLoading={isCustomerLoading}
        />
      </div>
      
      {/* Retail Business Report (Full Width) */}
      <div className="grid grid-cols-1 gap-4">
        <RetailBusinessReport />
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