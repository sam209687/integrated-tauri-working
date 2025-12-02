"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { TooltipProps } from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3, DollarSign } from "lucide-react";
import { useState, useMemo } from "react";

interface MonthlySalesData {
  month: string;
  totalInvoice: number;
  salesAmount: number;
}

interface MonthlySalesChartProps {
  data: MonthlySalesData[];
}

interface PayloadItem {
  name: string;
  value: number;
  payload: MonthlySalesData;
}

type CustomTooltipProps = Omit<
  TooltipProps<number, string>,
  "payload" | "label" | "active"
> & {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string | number;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="backdrop-blur-xl dark:bg-gray-900/95 bg-white/95 dark:border-white/20 border-gray-200 border rounded-2xl p-4 shadow-2xl"
      >
        <p className="font-bold text-lg mb-2 dark:text-white text-gray-900">{`${label} Sales`}</p>
        <div className="space-y-1">
          <p className="text-sm dark:text-gray-300 text-gray-600 flex items-center justify-between gap-4">
            <span className="font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              Total Invoices:
            </span>
            <span className="font-bold dark:text-blue-400 text-blue-600">{dataPoint.totalInvoice}</span>
          </p>
          <p className="text-sm dark:text-gray-300 text-gray-600 flex items-center justify-between gap-4">
            <span className="font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
              Sales Amount:
            </span>
            <span className="font-bold dark:text-yellow-400 text-yellow-600">
              ₹{dataPoint.salesAmount.toLocaleString("en-IN")}
            </span>
          </p>
        </div>
      </motion.div>
    );
  }
  return null;
};

export function MonthlySalesChart({ data }: MonthlySalesChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSales = data.reduce((sum, item) => sum + item.salesAmount, 0);
    const totalInvoices = data.reduce((sum, item) => sum + item.totalInvoice, 0);
    const avgSales = totalSales / data.length;
    const maxSales = Math.max(...data.map(item => item.salesAmount));
    const bestMonth = data.find(item => item.salesAmount === maxSales)?.month || '';
    
    return { totalSales, totalInvoices, avgSales, bestMonth };
  }, [data]);

  // Generate colors based on value (gradient effect)
  const getBarColor = (value: number, index: number) => {
    const maxValue = Math.max(...data.map(d => d.salesAmount));
    const intensity = (value / maxValue);
    
    if (hoveredBar === index) {
      return `rgba(251, 191, 36, ${0.7 + intensity * 0.3})`; // Yellow on hover
    }
    return `rgba(251, 191, 36, ${0.4 + intensity * 0.6})`; // Yellow gradient
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="w-full relative group"
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'rgba(251, 191, 36, 0.3)' }}
      />

      <Card className="relative backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border-white/50 border rounded-3xl shadow-2xl overflow-hidden h-[488px]">
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 bg-linear-to-br dark:from-yellow-500/10 dark:to-orange-500/10 from-yellow-100 to-orange-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
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
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ 
                    y: [0, -5, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-2 rounded-xl bg-linear-to-br from-yellow-500 to-orange-500 shadow-lg"
                >
                  <BarChart3 className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <CardTitle className="text-xl font-bold dark:text-white text-gray-900">
                    Monthly Sales Performance
                  </CardTitle>
                  <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">
                    Last 12 months overview
                  </p>
                </div>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1.5 rounded-xl dark:bg-white/10 bg-gray-100 flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs font-semibold dark:text-white text-gray-900">
                  Peak: {stats.bestMonth}
                </span>
              </motion.div>
            </div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-3 mt-4"
            >
              <div className="p-3 rounded-xl dark:bg-white/5 bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs dark:text-gray-400 text-gray-500">Total Sales</span>
                </div>
                <p className="text-lg font-bold dark:text-white text-gray-900">
                  ₹{(stats.totalSales / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="p-3 rounded-xl dark:bg-white/5 bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs dark:text-gray-400 text-gray-500">Total Invoices</span>
                </div>
                <p className="text-lg font-bold dark:text-white text-gray-900">
                  {stats.totalInvoices.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl dark:bg-white/5 bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs dark:text-gray-400 text-gray-500">Avg/Month</span>
                </div>
                <p className="text-lg font-bold dark:text-white text-gray-900">
                  ₹{(stats.avgSales / 1000).toFixed(0)}K
                </p>
              </div>
            </motion.div>
          </CardHeader>

          <CardContent className="flex-1 pt-0 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onMouseMove={(state) => {
                  if (state.isTooltipActive) {
                    setActiveIndex(state.activeTooltipIndex ?? null);
                  } else {
                    setActiveIndex(null);
                  }
                }}
                onMouseLeave={() => {
                  setActiveIndex(null);
                  setHoveredBar(null);
                }}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke="currentColor"
                  className="dark:text-gray-400 text-gray-600"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  dataKey="salesAmount"
                  stroke="currentColor"
                  className="dark:text-gray-400 text-gray-600"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ 
                    fill: "rgba(251, 191, 36, 0.1)",
                    radius: 8
                  }}
                />
                <Bar
                  dataKey="salesAmount"
                  name="Sales Amount"
                  radius={[8, 8, 0, 0]}
                  onMouseEnter={(_, index) => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={hoveredBar === index ? "url(#barGradient)" : getBarColor(entry.salesAmount, index)}
                      className="transition-all duration-300"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Animated Bar Indicators */}
            {data.map((item, index) => (
              activeIndex === index && (
                <motion.div
                  key={`indicator-${index}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                >
                  <div className="px-4 py-2 rounded-full bg-linear-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold shadow-lg">
                    {item.month}: ₹{item.salesAmount.toLocaleString()}
                  </div>
                </motion.div>
              )
            ))}
          </CardContent>
        </div>

        {/* Corner Decoration */}
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-linear-to-br from-yellow-500 to-orange-500 opacity-20 rounded-full blur-3xl" />
        <div className="absolute -top-8 -left-8 w-32 h-32 bg-linear-to-br from-yellow-500 to-orange-500 opacity-20 rounded-full blur-3xl" />
      </Card>
    </motion.div>
  );
}