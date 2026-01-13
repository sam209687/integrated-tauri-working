// src/components/adminPanel/retailCards/RetailSalesOverviewChart.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useMemo, useCallback, memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { TrendingUp, Package, X, Maximize2 } from 'lucide-react';

interface RetailSalesOverviewChartProps {
  data: {
    productName: string;
    totalSales: number;
    fill: string;
  }[];
}

const ENHANCED_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', 
  '#ec4899', '#06b6d4', '#f97316', '#6366f1',
];

const MemoizedPieChart = memo(({ 
  dataWithPercentage, 
  isEnlarged, 
  activeIndex,
  onMouseEnter,
  onMouseLeave,
  renderActiveShape
}: any) => {
  return (
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
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          animationBegin={0}
          animationDuration={800}
          isAnimationActive={false}
        >
          {dataWithPercentage.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
});

MemoizedPieChart.displayName = 'MemoizedPieChart';

export function RetailSalesOverviewChart({ data }: RetailSalesOverviewChartProps) {
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const filteredData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: ENHANCED_COLORS[index % ENHANCED_COLORS.length]
    }));
  }, [data]);

  const totalInvoiceCount = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.totalSales, 0);
  }, [filteredData]);

  const dataWithPercentage = useMemo(() => {
    return filteredData.map(item => ({
      ...item,
      percentage: ((item.totalSales / totalInvoiceCount) * 100).toFixed(1)
    }));
  }, [filteredData, totalInvoiceCount]);

  const handlePieMouseEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const handlePieMouseLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const handleLegendMouseEnter = useCallback((index: number) => {
    setHoveredIndex(index);
  }, []);

  const handleLegendMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const renderActiveShape = useCallback((props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
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
  }, []);

  const renderLegend = useCallback((payload: any[]) => {
    return (
      <div className="grid grid-cols-1 gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div
            key={`legend-${index}`}
            onMouseEnter={() => handleLegendMouseEnter(index)}
            onMouseLeave={handleLegendMouseLeave}
            className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 cursor-pointer ${
              hoveredIndex === index 
                ? 'dark:bg-white/10 bg-gray-100 scale-105' 
                : 'dark:bg-white/5 bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-4 h-4 rounded-full transition-transform"
                style={{ 
                  backgroundColor: entry.color,
                  transform: hoveredIndex === index ? 'scale(1.2)' : 'scale(1)'
                }}
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
          </div>
        ))}
      </div>
    );
  }, [dataWithPercentage, hoveredIndex, handleLegendMouseEnter, handleLegendMouseLeave]);

  const ChartContent = useCallback(({ isEnlarged = false }: { isEnlarged?: boolean }) => (
    <div className="flex flex-col lg:flex-row gap-6 items-center">
      <div className={`${isEnlarged ? 'lg:w-2/3' : 'w-full'} relative`}>
        <MemoizedPieChart
          dataWithPercentage={dataWithPercentage}
          isEnlarged={isEnlarged}
          activeIndex={activeIndex}
          onMouseEnter={handlePieMouseEnter}
          onMouseLeave={handlePieMouseLeave}
          renderActiveShape={renderActiveShape}
        />

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="mb-1">
            <Package className="h-8 w-8 mx-auto dark:text-white text-gray-900" />
          </div>
          <div className="text-3xl font-bold dark:text-white text-gray-900">
            {totalInvoiceCount.toLocaleString()}
          </div>
          <div className="text-xs dark:text-gray-400 text-gray-500 uppercase tracking-wider">
            Retail Items
          </div>
        </div>
      </div>

      {isEnlarged && (
        <div className="lg:w-1/3 w-full max-h-96 overflow-y-auto custom-scrollbar">
          {renderLegend(dataWithPercentage.map((item) => ({
            value: item.productName,
            color: item.fill,
            type: 'square'
          })))}
        </div>
      )}
    </div>
  ), [dataWithPercentage, activeIndex, handlePieMouseEnter, handlePieMouseLeave, renderActiveShape, totalInvoiceCount, renderLegend]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative"
      >
        <Card className="relative backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border-white/50 border rounded-3xl shadow-2xl overflow-hidden">
          <div className="relative z-10">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-xl font-bold dark:text-white text-gray-900">
                    Retail Items Sold
                  </CardTitle>
                </div>
                <p className="text-sm dark:text-gray-400 text-gray-500 mt-1">Excluding edible oils</p>
              </div>
              
              <button
                onClick={() => setIsEnlarged(true)}
                className="p-2 rounded-xl dark:bg-white/10 bg-gray-100 dark:hover:bg-white/20 hover:bg-gray-200 transition-all duration-300"
              >
                <Maximize2 className="h-5 w-5 dark:text-white text-gray-800" />
              </button>
            </CardHeader>

            <CardContent>
              {filteredData.length > 0 ? (
                <div>
                  <ChartContent isEnlarged={false} />
                  
                  <div className="mt-6 grid grid-cols-3 gap-4">
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
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Package className="h-16 w-16 dark:text-gray-600 text-gray-300 mb-4" />
                  <p className="text-lg font-medium dark:text-gray-400 text-gray-500">No retail data</p>
                  <p className="text-sm dark:text-gray-500 text-gray-400 mt-2">
                    Retail sales data will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {isEnlarged && (
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
                  Retail Sales - Detailed View
                </DialogTitle>
                <p className="text-sm dark:text-gray-400 text-gray-600">
                  Complete breakdown of retail product sales
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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="backdrop-blur-xl dark:bg-gray-900/95 bg-white/95 dark:border-white/20 border-gray-200 border rounded-2xl p-4 shadow-2xl">
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
      </div>
    );
  }
  return null;
};