"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { TooltipProps } from "recharts";
import { motion } from "framer-motion";

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
      <div className="p-3 bg-gray-800 border border-gray-700 text-white shadow-lg rounded-md">
        <p className="font-bold text-lg mb-1">{`${label} Sales`}</p>
        <p className="text-sm">
          <span className="font-medium">Total Invoices:</span>{" "}
          <span className="text-yellow-400">{dataPoint.totalInvoice}</span>
        </p>
        <p className="text-sm">
          <span className="font-medium">Sales Amount:</span>{" "}
          <span className="text-yellow-400">
            ₹{dataPoint.salesAmount.toLocaleString("en-IN")}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export function MonthlySalesChart({ data }: MonthlySalesChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="w-full"
    >
      <Card className="bg-gray-900 text-white border-gray-700 shadow-lg h-[488px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Monthly Sales Performance
          </CardTitle>
        </CardHeader>

        {/* Increased height here */}
        <CardContent className="h-[300px] pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="month"
                stroke="#A1A1AA"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="salesAmount"
                stroke="#A1A1AA"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
              />
              <Bar
                dataKey="salesAmount"
                name="Sales Amount"
                fill="#FBBF24"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
