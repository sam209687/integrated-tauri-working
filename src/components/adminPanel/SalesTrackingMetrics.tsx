// src/components/adminPanel/SalesTrackingMetrics.tsx

"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingBag, TrendingUp, Wallet, Banknote, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator'; 
import { useEnlargement } from '@/lib/useEnlargement'; 
import { useState } from 'react';

// Define the structure for the depositable charges breakdown
interface DepositableCharges {
    packingCharges: number;
    laborCharges: number;
    electricityCharges: number;
    oecCharges: number;
}

interface SalesMetricsProps {
  totalRevenue: number;
  totalSales: number;
  avgOrderValue: number;
  totalProfit: number; 
  totalDeposits: number; 
  depositableCharges: DepositableCharges; 
}

export function SalesTrackingMetrics({ 
    totalRevenue, 
    totalSales, 
    avgOrderValue, 
    totalProfit, 
    totalDeposits,
    depositableCharges 
}: SalesMetricsProps) {
  
  const { isEnlarged, setIsEnlarged } = useEnlargement(); 
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const metrics = [
    {
      id: 1,
      title: "Total Revenue",
      value: totalRevenue,
      change: "+20.1%",
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-600",
      glowColor: "rgba(16, 185, 129, 0.3)",
      bgGradient: "dark:from-emerald-500/20 dark:to-teal-600/20 from-emerald-100 to-teal-100"
    },
    {
      id: 2,
      title: "Total Sales",
      value: totalSales,
      change: "+180.1%",
      icon: ShoppingBag,
      gradient: "from-blue-500 to-indigo-600",
      glowColor: "rgba(59, 130, 246, 0.3)",
      bgGradient: "dark:from-blue-500/20 dark:to-indigo-600/20 from-blue-100 to-indigo-100",
      isCount: true
    },
    {
      id: 3,
      title: "Avg. Order Value",
      value: avgOrderValue,
      change: "+19%",
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-600",
      glowColor: "rgba(168, 85, 247, 0.3)",
      bgGradient: "dark:from-purple-500/20 dark:to-pink-600/20 from-purple-100 to-pink-100"
    },
    {
      id: 4,
      title: "Net Profit",
      value: totalProfit,
      change: "+12.5%",
      icon: Wallet,
      gradient: "from-orange-500 to-red-600",
      glowColor: "rgba(249, 115, 22, 0.3)",
      bgGradient: "dark:from-orange-500/20 dark:to-red-600/20 from-orange-100 to-red-100",
      isProfit: true
    },
    {
      id: 5,
      title: "Total Deposits",
      value: totalDeposits,
      change: "+8.2%",
      icon: Banknote,
      gradient: "from-cyan-500 to-blue-600",
      glowColor: "rgba(6, 182, 212, 0.3)",
      bgGradient: "dark:from-cyan-500/20 dark:to-blue-600/20 from-cyan-100 to-blue-100",
      clickable: true
    }
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid gap-4 md:grid-cols-3 lg:grid-cols-5"
      >
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isHovered = hoveredCard === metric.id;

          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring" as const,
                stiffness: 100,
                damping: 15,
                delay: index * 0.1
              }}
              whileHover={{ 
                scale: 1.05,
                y: -8,
                transition: { type: "spring" as const, stiffness: 300 }
              }}
              onHoverStart={() => setHoveredCard(metric.id)}
              onHoverEnd={() => setHoveredCard(null)}
              onClick={() => metric.clickable && setIsEnlarged(true)}
              className={`relative group ${metric.clickable ? 'cursor-pointer' : ''}`}
            >
              {/* Glow Effect */}
              <motion.div
                className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: metric.glowColor }}
                animate={isHovered ? {
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Card */}
              <Card className="relative backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border-white/50 border rounded-3xl shadow-2xl overflow-hidden h-full">
                {/* Animated Background Gradient */}
                <motion.div
                  className={`absolute inset-0 bg-linear-to-br ${metric.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  animate={isHovered ? {
                    rotate: [0, 360],
                  } : {}}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />

                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 5
                  }}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Header */}
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider dark:text-gray-300 text-gray-600">
                      {metric.title}
                    </CardTitle>

                    {/* Icon with gradient background */}
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.5 }}
                      className={`p-3 rounded-2xl bg-linear-to-br ${metric.gradient} shadow-lg`}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </motion.div>
                  </CardHeader>

                  <CardContent>
                    {/* Value */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                      className={`text-2xl md:text-3xl font-bold mb-2 ${
                        metric.isProfit 
                          ? (totalProfit >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400')
                          : 'dark:text-white text-gray-900'
                      }`}
                    >
                      {metric.isCount 
                        ? metric.value?.toLocaleString() || '0'
                        : `₹ ${metric.value?.toLocaleString() || '0'}`
                      }
                    </motion.div>

                    {/* Change Indicator */}
                    <motion.div 
                      className="flex items-center gap-2"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ChevronRight className="h-4 w-4 text-green-500" />
                      </motion.div>
                      <span className="text-sm font-semibold text-green-500">
                        {metric.change}
                      </span>
                      <span className="text-xs dark:text-gray-400 text-gray-500">
                        from last month
                      </span>
                    </motion.div>

                    {/* Click indicator for deposits */}
                    {metric.clickable && (
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="mt-2 text-xs dark:text-gray-400 text-gray-500"
                      >
                        Click for details →
                      </motion.div>
                    )}
                  </CardContent>
                </div>

                {/* Corner Decoration */}
                <div className={`absolute -bottom-6 -right-6 w-24 h-24 bg-linear-to-br ${metric.gradient} opacity-20 rounded-full blur-2xl`} />
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Enlarged Dialog for Deposits */}
      <Dialog open={isEnlarged} onOpenChange={setIsEnlarged}>
        <DialogContent className="sm:max-w-lg backdrop-blur-2xl dark:bg-gray-900/95 bg-white/95 dark:border-white/20 border-gray-200 rounded-3xl shadow-2xl">
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsEnlarged(false)}
            className="absolute top-4 right-4 p-2 rounded-xl dark:bg-white/10 bg-gray-100 dark:hover:bg-white/20 hover:bg-gray-200 transition-all duration-300 z-50"
          >
            <X className="h-5 w-5 dark:text-white text-gray-800" />
          </motion.button>

          {/* Header */}
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold dark:text-white text-gray-900 pr-8">
              Total Deposits Details
            </DialogTitle>
            <p className="text-sm dark:text-gray-400 text-gray-600">
              Breakdown of depositable charges
            </p>
          </DialogHeader>

          {/* Breakdown */}
          <div className="space-y-4 mt-4">
            {Object.entries(depositableCharges).map(([key, value], index) => (
              <motion.div
                key={key}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-2xl dark:bg-white/5 bg-gray-50 dark:hover:bg-white/10 hover:bg-gray-100 transition-all duration-300"
              >
                <span className="font-medium capitalize dark:text-gray-300 text-gray-700">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="text-lg font-bold bg-linear-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent"
                >
                  ₹ {value?.toFixed(2) || '0.00'}
                </motion.span>
              </motion.div>
            ))}

            <Separator className="dark:bg-gray-700 bg-gray-300 my-4" />

            {/* Total */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-2xl bg-linear-to-r dark:from-cyan-500/20 dark:to-blue-500/20 from-cyan-100 to-blue-100 border dark:border-cyan-500/30 border-cyan-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold dark:text-white text-gray-900">
                  Total Amount to Deposit
                </span>
                <motion.span
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-2xl font-bold bg-linear-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
                >
                  ₹ {totalDeposits?.toFixed(2) || '0.00'}
                </motion.span>
              </div>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}