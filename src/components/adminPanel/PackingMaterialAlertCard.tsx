// src/components/adminPanel/dashboard/PackingMaterialAlertCard.tsx
"use client";

import { useEffect, useState } from "react";
import { usePackingAlertStore } from "@/store/packingAlert.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Package, Loader2, ExternalLink, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function PackingMaterialAlertCard() {
  const { 
    lowStockMaterials, 
    isLoading, 
    fetchLowStockMaterials,
    lastFetched
  } = usePackingAlertStore();

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const alertCount = lowStockMaterials.length;

  useEffect(() => {
    if (lastFetched === null) {
      fetchLowStockMaterials();
    }
  }, []); 

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLowStockMaterials();
    }, REFRESH_INTERVAL_MS); 
    
    return () => clearInterval(interval);
  }, [fetchLowStockMaterials]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="relative group"
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ 
          background: alertCount > 0 
            ? 'rgba(239, 68, 68, 0.3)' 
            : 'rgba(34, 197, 94, 0.3)' 
        }}
      />

      <Card className={`relative backdrop-blur-2xl dark:bg-white/10 bg-white/70 border rounded-3xl shadow-2xl overflow-hidden ${
        alertCount > 0 
          ? 'dark:border-red-500/30 border-red-300 shadow-red-500/20' 
          : 'dark:border-green-500/30 border-green-300'
      }`}>
        {/* Animated Background */}
        <motion.div
          className={`absolute inset-0 bg-linearto-br ${
            alertCount > 0
              ? 'dark:from-red-500/10 dark:to-orange-500/10 from-red-100 to-orange-100'
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
        <div className="relative z-10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: alertCount > 0 ? [1, 1.1, 1] : 1
                }}
                transition={{ 
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
                className={`p-2 rounded-xl bg-linearto-br shadow-lg ${
                  alertCount > 0
                    ? 'from-red-500 to-orange-500'
                    : 'from-green-500 to-emerald-500'
                }`}
              >
                <Package className="h-5 w-5 text-white" />
              </motion.div>
              <CardTitle className="text-lg font-bold dark:text-white text-gray-900">
                Packing Material Alerts
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            {/* Alert Count */}
            <div className="flex items-center gap-3 mb-4">
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-10 w-10 text-blue-500" />
                </motion.div>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="text-4xl font-bold dark:text-white text-gray-900"
                  >
                    {alertCount}
                  </motion.div>
                  <AnimatePresence mode="wait">
                    {alertCount > 0 ? (
                      <motion.div
                        key="alert"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                      >
                        <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="success"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                      >
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Status Message */}
            <AnimatePresence mode="wait">
              {alertCount > 0 ? (
                <motion.p
                  key="warning"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-sm text-red-500 font-medium mb-3"
                >
                  {alertCount} item{alertCount !== 1 ? 's are' : ' is'} running low or out of stock.
                </motion.p>
              ) : (
                <motion.p
                  key="success"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-sm text-green-500 font-medium mb-3"
                >
                  All packing materials are currently well-stocked.
                </motion.p>
              )}
            </AnimatePresence>

            {/* Material List */}
            {alertCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2 mb-4 max-h-40 overflow-y-auto rounded-xl dark:bg-white/5 bg-gray-50/50 p-3 backdrop-blur-sm border dark:border-white/10 border-gray-200"
              >
                <AnimatePresence>
                  {lowStockMaterials.slice(0, 5).map((material, index) => (
                    <motion.div
                      key={material._id.toString()}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onMouseEnter={() => setHoveredItem(material._id.toString())}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`flex justify-between items-center p-2 rounded-lg transition-all duration-300 ${
                        hoveredItem === material._id.toString()
                          ? 'dark:bg-red-500/20 bg-red-100 scale-105'
                          : 'dark:bg-white/5 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
                        <span className="text-sm font-medium dark:text-red-300 text-red-600 truncate">
                          {material.name}
                        </span>
                      </div>
                      <motion.span
                        animate={hoveredItem === material._id.toString() ? { scale: 1.1 } : { scale: 1 }}
                        className="font-bold text-sm dark:text-white text-gray-900 bg-linear-to-r from-red-500 to-orange-500 bg-clip-text shrink-0 ml-2"
                      >
                        Stock: {material.balance}
                      </motion.span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {alertCount > 5 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-center py-2 dark:text-yellow-400 text-yellow-600 font-semibold"
                  >
                    +{alertCount - 5} more items...
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Manage Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                asChild 
                className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/admin/packingProds" className="flex items-center justify-center gap-2">
                  <Package className="h-4 w-4" />
                  Manage Materials
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </motion.div>
          </CardContent>
        </div>

        {/* Corner Decorations */}
        <div className={`absolute -bottom-6 -right-6 w-24 h-24 bg-linearto-br ${
          alertCount > 0
            ? 'from-red-500 to-orange-500'
            : 'from-green-500 to-emerald-500'
        } opacity-20 rounded-full blur-2xl`} />
      </Card>
    </motion.div>
  );
}