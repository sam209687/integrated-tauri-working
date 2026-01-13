// src/components/adminPanel/retailCards/RetailSalesMetrics.tsx
"use client";

import { motion } from 'framer-motion';
import { TrendingUp, ShoppingBag, DollarSign, Package, Banknote, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RetailSalesMetricsProps {
  totalRevenue: number;
  totalSales: number;
  avgOrderValue: number;
  totalProfit: number;
  totalDeposits: number;
  depositableCharges: number;
  onRetailSalesClick?: () => void;
}

export function RetailSalesMetrics({
  totalRevenue,
  totalSales,
  avgOrderValue,
  totalProfit,
  totalDeposits,
  depositableCharges,
  onRetailSalesClick
}: RetailSalesMetricsProps) {
  const metrics = [
    {
      title: 'Retail Sales',
      value: `₹${totalRevenue.toFixed(2)}`,
      icon: ShoppingBag,
      gradient: 'from-blue-500 to-cyan-500',
      clickable: true,
      onClick: onRetailSalesClick
    },
    {
      title: 'Total Sales',
      value: totalSales.toString(),
      icon: Package,
      gradient: 'from-purple-500 to-pink-500',
      clickable: false
    },
    {
      title: 'Avg Order Value',
      value: `₹${avgOrderValue.toFixed(2)}`,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-500',
      clickable: false
    },
    {
      title: 'Total Profit',
      value: `₹${totalProfit.toFixed(2)}`,
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-500',
      clickable: false
    },
    {
      title: 'Total Deposits',
      value: `₹${totalDeposits.toFixed(2)}`,
      icon: Banknote,
      gradient: 'from-indigo-500 to-blue-500',
      clickable: false
    },
    {
      title: 'Depositable Charges',
      value: `₹${depositableCharges.toFixed(2)}`,
      icon: Receipt,
      gradient: 'from-teal-500 to-cyan-500',
      clickable: false
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
    >
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const CardWrapper = metric.clickable ? motion.div : motion.div;
        
        return (
          <CardWrapper
            key={metric.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={metric.clickable ? { scale: 1.05 } : {}}
            onClick={metric.clickable ? metric.onClick : undefined}
            className={metric.clickable ? 'cursor-pointer' : ''}
          >
            <Card className="relative backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border-white/50 border rounded-2xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className={`absolute inset-0 bg-linear-to-br ${metric.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <CardContent className="p-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl bg-linear-to-br ${metric.gradient} shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  {metric.clickable && (
                    <div className="text-xs dark:text-gray-400 text-gray-600 group-hover:dark:text-white group-hover:text-gray-900 transition-colors">
                      Click to manage
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold dark:text-white text-gray-900 truncate">
                    {metric.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          </CardWrapper>
        );
      })}
    </motion.div>
  );
}