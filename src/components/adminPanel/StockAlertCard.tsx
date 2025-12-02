// src/components/adminPanel/StockAlertCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { Loader2, Zap, AlertTriangle, TrendingDown, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LowStockVariant } from '@/store/stockAlert.store';
import { useState } from 'react';

interface StockAlertCardProps {
  data: LowStockVariant[];
  isLoading: boolean;
  error: string | null;
}

export function StockAlertCard({ data, isLoading, error }: StockAlertCardProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const totalAlerts = data.length;

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group h-full"
      >
        <motion.div
          className="absolute inset-0 rounded-3xl blur-xl opacity-50"
          style={{ background: 'rgba(234, 179, 8, 0.3)' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <Card className="relative backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border-white/50 border rounded-3xl shadow-2xl h-full flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-12 w-12 text-yellow-500" />
            </motion.div>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-lg font-medium dark:text-white text-gray-900"
            >
              Checking Stock Alerts...
            </motion.p>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group h-full"
      >
        <Card className="relative backdrop-blur-2xl dark:bg-red-500/10 bg-red-50/70 dark:border-red-500/30 border-red-300 border rounded-3xl shadow-2xl h-full flex items-center justify-center p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-500 font-semibold">Error: {error}</p>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full relative group"
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ 
          background: totalAlerts > 0 
            ? 'rgba(234, 179, 8, 0.3)' 
            : 'rgba(34, 197, 94, 0.3)' 
        }}
      />

      <Card className="relative backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border-white/50 border rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col">
        {/* Animated Background */}
        <motion.div
          className={`absolute inset-0 bg-linearto-br ${
            totalAlerts > 0
              ? 'dark:from-yellow-500/10 dark:to-orange-500/10 from-yellow-100 to-orange-100'
              : 'dark:from-green-500/10 dark:to-emerald-500/10 from-green-100 to-emerald-100'
          } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          <CardHeader className={`pb-4 ${totalAlerts > 0 ? 'border-b dark:border-yellow-500/20 border-yellow-300' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ 
                    scale: totalAlerts > 0 ? [1, 1.2, 1] : 1,
                    rotate: totalAlerts > 0 ? [0, -10, 10, 0] : 0
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`p-2 rounded-xl bg-linearto-br ${
                    totalAlerts > 0
                      ? 'from-yellow-500 to-orange-500'
                      : 'from-green-500 to-emerald-500'
                  } shadow-lg`}
                >
                  <Zap className="h-5 w-5 text-white" />
                </motion.div>
                <CardTitle className="text-xl font-bold dark:text-white text-gray-900">
                  Stock Alert
                </CardTitle>
              </div>

              {/* Alert Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className={`px-4 py-2 rounded-xl ${
                  totalAlerts > 0
                    ? 'dark:bg-yellow-500/20 bg-yellow-100 border dark:border-yellow-500/30 border-yellow-300'
                    : 'dark:bg-green-500/20 bg-green-100 border dark:border-green-500/30 border-green-300'
                }`}
              >
                <div className={`text-2xl font-bold ${
                  totalAlerts > 0 ? 'text-yellow-500' : 'text-green-500'
                }`}>
                  {totalAlerts}
                </div>
                <div className={`text-xs ${
                  totalAlerts > 0 ? 'dark:text-yellow-400 text-yellow-600' : 'dark:text-green-400 text-green-600'
                }`}>
                  Alert{totalAlerts !== 1 ? 's' : ''}
                </div>
              </motion.div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden flex flex-col">
            {totalAlerts === 0 ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center py-8"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-4 rounded-full dark:bg-green-500/20 bg-green-100 mb-4"
                >
                  <Package className="h-12 w-12 text-green-500" />
                </motion.div>
                <p className="text-lg font-semibold dark:text-green-400 text-green-600">
                  All stock levels are healthy!
                </p>
                <p className="text-sm dark:text-gray-400 text-gray-500 mt-2">
                  No items require attention
                </p>
              </motion.div>
            ) : (
              <div className="flex-1 overflow-hidden rounded-2xl dark:bg-white/5 bg-gray-50/50 backdrop-blur-sm border dark:border-white/10 border-gray-200">
                <div className="overflow-y-auto max-h-[350px]">
                  <Table>
                    <thead className="sticky top-0 z-10 dark:bg-gray-900/95 bg-white/95 backdrop-blur-md">
                      <TableRow className="border-b dark:border-gray-700 border-gray-300">
                        <TableHead className="dark:text-gray-300 text-gray-700 font-bold">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-yellow-500" />
                            Product (SKU)
                          </div>
                        </TableHead>
                        <TableHead className="text-right dark:text-gray-300 text-gray-700 font-bold">
                          <div className="flex items-center justify-end gap-2">
                            <TrendingDown className="h-4 w-4 text-orange-500" />
                            Stock
                          </div>
                        </TableHead>
                        <TableHead className="text-right dark:text-gray-300 text-gray-700 font-bold">
                          <div className="flex items-center justify-end gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            Alert
                          </div>
                        </TableHead>
                      </TableRow>
                    </thead>
                    <TableBody>
                      <AnimatePresence>
                        {data.map((variant, index) => (
                          <TableRow
                            key={variant._id}
                            onMouseEnter={() => setHoveredRow(variant._id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            className={`border-b dark:border-gray-800 border-gray-200 cursor-pointer transition-all duration-300 ${
                              hoveredRow === variant._id
                                ? 'dark:bg-yellow-500/10 bg-yellow-50 scale-[1.01]'
                                : ''
                            }`}
                          >
                            <TableCell className="font-medium dark:text-white text-gray-900">
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ 
                                  opacity: 1, 
                                  x: hoveredRow === variant._id ? 5 : 0 
                                }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-2"
                              >
                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                                {variant.productName} ({variant.variantVolume} {variant.unit})
                                {variant.variantColor && variant.variantColor !== 'N/A' && (
                                  <span className="text-xs dark:text-gray-400 text-gray-500">
                                    - {variant.variantColor}
                                  </span>
                                )}
                              </motion.div>
                            </TableCell>
                            <TableCell className="text-right">
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 + 0.1 }}
                                className="font-bold text-yellow-500 flex items-center justify-end gap-2"
                              >
                                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                                {variant.stockQuantity}
                              </motion.div>
                            </TableCell>
                            <TableCell className="text-right">
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 + 0.2 }}
                                className="font-bold text-red-500 flex items-center justify-end gap-2"
                              >
                                <span className="w-2 h-2 bg-red-500 rounded-full" />
                                {variant.stockAlertQuantity}
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Footer Stats */}
            {totalAlerts > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-4 flex items-center justify-between text-xs dark:text-gray-400 text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                  Requires immediate attention
                </div>
                <div className="px-3 py-1 rounded-lg dark:bg-white/5 bg-gray-100">
                  {totalAlerts} item{totalAlerts !== 1 ? 's' : ''} low
                </div>
              </motion.div>
            )}
          </CardContent>
        </div>

        {/* Corner Decorations */}
        <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-linearto-br ${
          totalAlerts > 0
            ? 'from-yellow-500 to-orange-500'
            : 'from-green-500 to-emerald-500'
        } opacity-20 rounded-full blur-3xl`} />
        <div className={`absolute -top-8 -left-8 w-32 h-32 bg-linearto-br ${
          totalAlerts > 0
            ? 'from-yellow-500 to-orange-500'
            : 'from-green-500 to-emerald-500'
        } opacity-20 rounded-full blur-3xl`} />
      </Card>
    </motion.div>
  );
}