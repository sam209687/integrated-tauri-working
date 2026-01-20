// src/components/adminPanel/retailCards/RetailSalesContainer.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRetailStore } from '@/store/retailStore';
import { RetailSalesMetrics } from '@/components/adminPanel/retailCards/RetailSalesMetrics';
import { RetailSalesOverviewChart } from '@/components/adminPanel/retailCards/RetailSalesOverviewChart';
import { RetailSalesModal } from '@/components/adminPanel/retailCards/RetailSalesModal';
import { motion } from 'framer-motion';
import { Loader2, ShoppingCart } from 'lucide-react';

interface RetailSalesContainerProps {
  fromDate?: Date;
  toDate?: Date;
}

export function RetailSalesContainer({ fromDate, toDate }: RetailSalesContainerProps) {
  const { 
    salesData, 
    metrics, 
    isLoading, 
    isMetricsLoading,
    error,
    fetchRetailData,
    fetchRetailMetrics 
  } = useRetailStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch data when dates change
  useEffect(() => {
    fetchRetailData(fromDate, toDate);
    fetchRetailMetrics(fromDate, toDate);
  }, [fromDate, toDate, fetchRetailData, fetchRetailMetrics]);

  // Show loading state
  if (isLoading && isMetricsLoading) {
    return (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
          <p className="text-lg font-medium dark:text-gray-300 text-gray-700">
            Loading retail business data...
          </p>
        </motion.div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="text-red-500 text-center">
            <p className="text-lg font-medium mb-2">Error loading retail data</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3"
      >
        <div className="p-3 rounded-2xl bg-linear-to-br from-purple-500 to-pink-600 shadow-lg">
          <ShoppingCart className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold dark:text-white text-gray-900">
            Retail Business Tracking
          </h2>
          <p className="text-sm dark:text-gray-400 text-gray-600">
            Excluding edible oil products
          </p>
        </div>
      </motion.div>

      {/* Metrics Cards Row */}
      {metrics && (
        <RetailSalesMetrics
          totalRevenue={metrics.totalRevenue}
          totalSales={metrics.totalSales}
          avgOrderValue={metrics.avgOrderValue}
          totalProfit={metrics.totalProfit}
          totalDeposits={metrics.totalDeposits}
          depositableCharges={
            (metrics.depositableCharges?.packingCharges || 0) +
            (metrics.depositableCharges?.laborCharges || 0) +
            (metrics.depositableCharges?.electricityCharges || 0) +
            (metrics.depositableCharges?.oecCharges || 0)
          }
          onRetailSalesClick={() => setIsModalOpen(true)}
        />
      )}

      {/* Sales Chart - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 gap-4"
      >
        <div className="h-full">
          <RetailSalesOverviewChart data={salesData} />
        </div>
      </motion.div>

      {/* Retail Sales Modal */}
      <RetailSalesModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}