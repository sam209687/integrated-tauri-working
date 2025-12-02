"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';
import { TrendingUp, Package, X, Maximize2 } from 'lucide-react';

interface SalesOverviewChartProps {
  data: {
    productName: string;
    totalSales: number;
    fill: string;
  }[];
}

// Enhanced color palette for better visibility
const ENHANCED_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
];

export function SalesOverviewChart({ data }: SalesOverviewChartProps) {
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter out any data related to "Oil Expelling"
  const filteredData = useMemo(() => {
    return data.filter(item => !item.productName.includes("Oil Expelling"))
      .map((item, index) => ({
        ...item,
        fill: ENHANCED_COLORS[index % ENHANCED_COLORS.length]
      }));
  }, [data]);

  // Calculate total invoice count
  const totalInvoiceCount = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.totalSales, 0);
  }, [filteredData]);

  // Calculate percentage for each item
  const dataWithPercentage = useMemo(() => {
    return filteredData.map(item => ({
      ...item,
      percentage: ((item.totalSales / totalInvoiceCount) * 100).toFixed(1)
    }));
  }, [filteredData, totalInvoiceCount]);

  // Custom active shape for pie chart
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          className="drop-shadow-2xl"
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 16}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.3}
        />
      </g>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-xl dark:bg-gray-900/95 bg-white/95 dark:border-white/20 border-gray-200 border rounded-2xl p-4 shadow-2xl"
        >
          <p className="font-bold text-lg dark:text-white text-gray-900 mb-2">
            {payload[0].payload.productName}
          </p>
          <div className="space-y-1">
            <p className="text-sm dark:text-gray-300 text-gray-600">
              Sales: <span className="font-bold dark:text-white text-gray-900">{payload[0].value.toLocaleString()}</span>
            </p>
            <p className="text-sm dark:text-gray-300 text-gray-600">
              Share: <span className="font-bold" style={{ color: payload[0].payload.fill }}>
                {payload[0].payload.percentage}%
              </span>
            </p>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  // Render legend with enhanced styling
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="grid grid-cols-1 gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <motion.div
            key={`legend-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 cursor-pointer ${
              hoveredIndex === index 
                ? 'dark:bg-white/10 bg-gray-100 scale-105' 
                : 'dark:bg-white/5 bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <motion.div
                animate={hoveredIndex === index ? { scale: 1.2 } : { scale: 1 }}
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium dark:text-gray-200 text-gray-700 truncate">
                {entry.value}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold dark:text-white text-gray-900">
                {dataWithPercentage[index]?.totalSales.toLocaleString()}
              </span>
              <span className="text-xs dark:text-gray-400 text-gray-500 ml-2">
                ({dataWithPercentage[index]?.percentage}%)
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const ChartContent = ({ isEnlarged = false }: { isEnlarged?: boolean }) => (
    <div className="flex flex-col lg:flex-row gap-6 items-center">
      <div className={`${isEnlarged ? 'lg:w-2/3' : 'w-full'} relative`}>
        <ResponsiveContainer width="100%" height={isEnlarged ? 400 : 280}>
          <PieChart>
            <Pie
              data={dataWithPercentage}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={isEnlarged ? 140 : 100}
              innerRadius={isEnlarged ? 90 : 60}
              fill="#8884d8"
              dataKey="totalSales"
              activeIndex={activeIndex !== null ? activeIndex : undefined}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              animationBegin={0}
              animationDuration={800}
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill}
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-1"
          >
            <Package className="h-8 w-8 mx-auto dark:text-white text-gray-900" />
          </motion.div>
          <div className="text-3xl font-bold dark:text-white text-gray-900">
            {totalInvoiceCount.toLocaleString()}
          </div>
          <div className="text-xs dark:text-gray-400 text-gray-500 uppercase tracking-wider">
            Total Items
          </div>
        </motion.div>
      </div>

      {/* Legend Section */}
      {isEnlarged && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:w-1/3 w-full max-h-96 overflow-y-auto custom-scrollbar"
        >
          {renderLegend({ payload: dataWithPercentage.map((item, index) => ({
            value: item.productName,
            color: item.fill,
            type: 'square'
          })) })}
        </motion.div>
      )}
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative group"
      >
        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: 'rgba(139, 92, 246, 0.3)' }}
        />

        <Card className="relative backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border-white/50 border rounded-3xl shadow-2xl overflow-hidden">
          {/* Animated Background */}
          <motion.div
            className="absolute inset-0 bg-linear-to-br dark:from-purple-500/10 dark:to-pink-500/10 from-purple-100 to-pink-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          {/* Shimmer Effect */}
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
          />

          <div className="relative z-10">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </motion.div>
                  <CardTitle className="text-xl font-bold dark:text-white text-gray-900">
                    Total Items Sold
                  </CardTitle>
                </div>
                <p className="text-sm dark:text-gray-400 text-gray-500 mt-1">Last 7 days</p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEnlarged(true)}
                className="p-2 rounded-xl dark:bg-white/10 bg-gray-100 dark:hover:bg-white/20 hover:bg-gray-200 transition-all duration-300"
              >
                <Maximize2 className="h-5 w-5 dark:text-white text-gray-800" />
              </motion.button>
            </CardHeader>

            <CardContent>
              {filteredData.length > 0 ? (
                <div className="cursor-pointer" onClick={() => setIsEnlarged(true)}>
                  <ChartContent />
                  
                  {/* Quick Stats Below Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 grid grid-cols-3 gap-4"
                  >
                    <div className="text-center p-3 rounded-xl dark:bg-white/5 bg-gray-50">
                      <div className="text-2xl font-bold dark:text-white text-gray-900">
                        {filteredData.length}
                      </div>
                      <div className="text-xs dark:text-gray-400 text-gray-500">Products</div>
                    </div>
                    <div className="text-center p-3 rounded-xl dark:bg-white/5 bg-gray-50">
                      <div className="text-2xl font-bold dark:text-white text-gray-900">
                        {Math.round(totalInvoiceCount / filteredData.length).toLocaleString()}
                      </div>
                      <div className="text-xs dark:text-gray-400 text-gray-500">Avg/Product</div>
                    </div>
                    <div className="text-center p-3 rounded-xl dark:bg-white/5 bg-gray-50">
                      <div className="text-2xl font-bold text-purple-500">
                        {dataWithPercentage[0]?.percentage || 0}%
                      </div>
                      <div className="text-xs dark:text-gray-400 text-gray-500">Top Share</div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Package className="h-16 w-16 dark:text-gray-600 text-gray-300 mb-4" />
                  <p className="text-lg font-medium dark:text-gray-400 text-gray-500">No data to display</p>
                  <p className="text-sm dark:text-gray-500 text-gray-400 mt-2">
                    Sales data will appear here once available
                  </p>
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Enlarged Dialog */}
      <AnimatePresence>
        {isEnlarged && (
          <Dialog open={isEnlarged} onOpenChange={setIsEnlarged}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl dark:bg-gray-900/95 bg-white/95 dark:border-white/20 border-gray-200 rounded-3xl shadow-2xl">
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEnlarged(false)}
                className="absolute top-4 right-4 p-2 rounded-xl dark:bg-white/10 bg-gray-100 dark:hover:bg-white/20 hover:bg-gray-200 transition-all duration-300 z-50"
              >
                <X className="h-5 w-5 dark:text-white text-gray-800" />
              </motion.button>

              <DialogHeader>
                <DialogTitle className="text-2xl font-bold dark:text-white text-gray-900 pr-8">
                  Sales Overview - Detailed View
                </DialogTitle>
                <p className="text-sm dark:text-gray-400 text-gray-600">
                  Complete breakdown of sales by product
                </p>
              </DialogHeader>

              <div className="mt-6">
                <ChartContent isEnlarged={true} />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>
    </>
  );
}