"use client";

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface SalesRadialChartProps {
  data: {
    productName: string;
    totalSales: number;
    fill: string;
  }[];
  chartBackground: string;
  labelFill: string;
  showCenterLabel?: boolean;
  totalInvoiceCount?: number;
  isEnlarged?: boolean;
}

export function SalesRadialChart({ 
  data, 
  chartBackground, 
  labelFill,
  showCenterLabel = true,
  totalInvoiceCount = 0,
  isEnlarged = false
}: SalesRadialChartProps) {
  // Generate chart config dynamically
  const chartConfig: ChartConfig = data.reduce((config, item, index) => {
    const key = `product${index}`;
    config[key] = {
      label: item.productName,
      color: item.fill,
    };
    return config;
  }, {} as ChartConfig);

  // Transform data for RadialBarChart
  const chartData = data.map((item, index) => ({
    name: item.productName,
    value: item.totalSales,
    fill: item.fill,
    key: `product${index}`,
  }));

  return (
    <div className="w-full">
      <ChartContainer
        config={chartConfig}
        className={`mx-auto aspect-square w-full ${isEnlarged ? 'max-w-[400px]' : 'max-w-[200px]'}`}
      >
        <RadialBarChart
          data={chartData}
          endAngle={180}
          innerRadius={isEnlarged ? 100 : 60}
          outerRadius={isEnlarged ? 160 : 100}
        >
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            {showCenterLabel && (
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl font-bold"
                          fill={labelFill}
                        >
                          {totalInvoiceCount.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground"
                          fill={labelFill}
                        >
                          Total Invoices
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            )}
          </PolarRadiusAxis>
          <RadialBar
            dataKey="value"
            background={{ fill: chartBackground }}
            cornerRadius={5}
          />
        </RadialBarChart>
      </ChartContainer>
      
      {/* Legend below the chart */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-2">
        {/* Total Invoice Count */}
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: '#94a3b8' }}
          />
          <span className="text-sm font-medium whitespace-nowrap">
            Total Invoices: {totalInvoiceCount}
          </span>
        </div>
        
        {/* Product legends */}
        {chartData.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-sm whitespace-nowrap">
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}