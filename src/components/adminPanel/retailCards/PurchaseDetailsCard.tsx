// src/components/adminPanel/retailCards/PurchaseDetailsCard.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ShoppingBag, TrendingUp, AlertCircle, Calendar, Package, DollarSign, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { getCategoryPurchaseSummary, CategoryPurchaseSummary } from '@/actions/retailBoardPrice.actions';

export function PurchaseDetailsCard() {
  const [summaries, setSummaries] = useState<CategoryPurchaseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryPurchaseSummary | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCategoryPurchaseSummary();
      if (result.success && result.data) {
        setSummaries(result.data);
      } else {
        setError(result.message || "Failed to load data");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCardClick = (summary: CategoryPurchaseSummary) => {
    setSelectedCategory(summary);
    setIsEnlarged(true);
  };

  // Calculate totals across all categories
  const totals = summaries.reduce(
    (acc, cat) => ({
      totalPurchase: acc.totalPurchase + cat.totalPurchasePrice,
      totalSelling: acc.totalSelling + cat.totalSellingPrice,
      totalProfit: acc.totalProfit + cat.totalProfit,
    }),
    { totalPurchase: 0, totalSelling: 0, totalProfit: 0 }
  );

  if (isLoading) {
    return (
      <Card className="backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border rounded-3xl shadow-2xl h-full flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-lg font-medium dark:text-white text-gray-900">
            Loading Purchase Details...
          </p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="backdrop-blur-2xl dark:bg-red-500/10 bg-red-50/70 dark:border-red-500/30 border rounded-3xl shadow-2xl h-full flex items-center justify-center p-6 min-h-[200px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-500 font-semibold">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative group"
      >
        <Card className="relative backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border-white/50 border rounded-3xl shadow-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b dark:border-gray-700/50 border-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 shadow-lg">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold dark:text-white text-gray-900">
                    Purchase Details
                  </CardTitle>
                  <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">
                    Category-wise purchase summary
                  </p>
                </div>
              </div>

              {/* Total Summary Badge */}
              <div className="px-4 py-2 rounded-xl dark:bg-white/10 bg-gray-100">
                <div className="text-sm font-bold dark:text-white text-gray-900">
                  ₹ {totals.totalProfit.toFixed(0)}
                </div>
                <div className="text-xs dark:text-gray-400 text-gray-500">
                  Total Profit
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {summaries.length > 0 ? (
              <div className="space-y-3">
                {summaries.map((summary, index) => (
                  <motion.div
                    key={summary.categoryName}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleCardClick(summary)}
                    className="p-4 rounded-xl dark:bg-white/5 bg-gray-50 hover:dark:bg-white/10 hover:bg-gray-100 cursor-pointer transition-all duration-300 border dark:border-gray-700 border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-blue-500" />
                          <h4 className="font-bold dark:text-white text-gray-900">
                            {summary.categoryName}
                          </h4>
                          <span className="text-xs dark:text-gray-400 text-gray-500">
                            ({summary.itemCount} items)
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs dark:text-gray-400 text-gray-500">Purchase</p>
                            <p className="font-semibold dark:text-white text-gray-900">
                              ₹ {summary.totalPurchasePrice.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs dark:text-gray-400 text-gray-500">Selling</p>
                            <p className="font-semibold dark:text-white text-gray-900">
                              ₹ {summary.totalSellingPrice.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs dark:text-gray-400 text-gray-500">Profit</p>
                            <p className={`font-bold ${
                              summary.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              ₹ {summary.totalProfit.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {summary.nextPurchaseDate && (
                          <div className="mt-2 flex items-center gap-2 text-xs dark:text-gray-400 text-gray-500">
                            <Calendar className="h-3 w-3" />
                            Next purchase: {format(new Date(summary.nextPurchaseDate), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>

                      <div className="ml-4">
                        <TrendingUp className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Overall Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: summaries.length * 0.1 }}
                  className="p-4 rounded-xl bg-linear-to-r dark:from-blue-500/20 dark:to-cyan-500/20 from-blue-100 to-cyan-100 border-2 dark:border-blue-500/30 border-blue-300 mt-4"
                >
                  <h4 className="font-bold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                    Overall Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs dark:text-gray-300 text-gray-600">Total Purchase</p>
                      <p className="text-lg font-bold dark:text-white text-gray-900">
                        ₹ {totals.totalPurchase.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs dark:text-gray-300 text-gray-600">Total Selling</p>
                      <p className="text-lg font-bold dark:text-white text-gray-900">
                        ₹ {totals.totalSelling.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs dark:text-gray-300 text-gray-600">Total Profit</p>
                      <p className="text-lg font-bold text-green-500">
                        ₹ {totals.totalProfit.toFixed(2)}
                      </p>
                      <p className="text-xs text-green-400">
                        {totals.totalPurchase > 0 
                          ? `+${((totals.totalProfit / totals.totalPurchase) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <ShoppingBag className="h-16 w-16 dark:text-gray-600 text-gray-300 mb-4" />
                <p className="text-lg font-medium dark:text-gray-400 text-gray-500">
                  No purchase data available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Enlarged Detail Dialog */}
      <AnimatePresence>
        {isEnlarged && selectedCategory && (
          <Dialog open={isEnlarged} onOpenChange={setIsEnlarged}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl dark:bg-gray-900/95 bg-white/95 dark:border-white/20 border-gray-200 rounded-3xl shadow-2xl">
              <button
                onClick={() => setIsEnlarged(false)}
                className="absolute top-4 right-4 p-2 rounded-xl dark:bg-white/10 bg-gray-100 dark:hover:bg-white/20 hover:bg-gray-200 transition-all duration-300 z-50"
              >
                <X className="h-5 w-5 dark:text-white text-gray-800" />
              </button>

              <DialogHeader>
                <DialogTitle className="text-2xl font-bold dark:text-white text-gray-900 pr-8">
                  {selectedCategory.categoryName} - Detailed View
                </DialogTitle>
                <p className="text-sm dark:text-gray-400 text-gray-600">
                  Complete purchase and profit breakdown
                </p>
              </DialogHeader>

              <div className="mt-6 space-y-4">
                {/* Category Summary */}
                <div className="p-6 rounded-2xl bg-linear-to-r dark:from-blue-500/20 dark:to-cyan-500/20 from-blue-100 to-cyan-100 border dark:border-blue-500/30 border-blue-300">
                  <h3 className="text-lg font-bold dark:text-white text-gray-900 mb-4">
                    Your total purchase of {selectedCategory.categoryName}
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm dark:text-gray-300 text-gray-600 mb-1">Total Selling Price</p>
                      <p className="text-3xl font-bold dark:text-white text-gray-900">
                        ₹ {selectedCategory.totalSellingPrice.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm dark:text-gray-300 text-gray-600 mb-1">Your Profit Should Be</p>
                      <p className="text-3xl font-bold text-green-500">
                        ₹ {selectedCategory.totalProfit.toFixed(2)}
                      </p>
                      <p className="text-sm text-green-400 mt-1">
                        Profit Margin: {selectedCategory.profitPercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Individual Items */}
                <div className="space-y-2">
                  <h4 className="font-bold dark:text-white text-gray-900 mb-3">
                    Individual Products ({selectedCategory.items.length})
                  </h4>
                  {selectedCategory.items.map((item, idx) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-gray-700 border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-semibold dark:text-white text-gray-900">
                            {item.productName}
                          </h5>
                          <p className="text-xs dark:text-gray-400 text-gray-500 mt-1">
                            Code: {item.productCode}
                          </p>
                          {item.lastPurchaseDate && (
                            <p className="text-xs dark:text-gray-400 text-gray-500 mt-1">
                              Last Purchase: {format(new Date(item.lastPurchaseDate), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-6 text-right">
                          <div>
                            <p className="text-xs dark:text-gray-400 text-gray-500">Purchase</p>
                            <p className="font-semibold dark:text-white text-gray-900">
                              ₹ {item.purchasePrice.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs dark:text-gray-400 text-gray-500">Selling</p>
                            <p className="font-semibold dark:text-white text-gray-900">
                              ₹ {item.sellingPrice.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs dark:text-gray-400 text-gray-500">Profit</p>
                            <p className={`font-bold ${
                              item.profit >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              ₹ {item.profit.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}