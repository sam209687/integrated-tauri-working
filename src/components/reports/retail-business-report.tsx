// src/components/reports/retail-business-report.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getRetailBusinessData, RetailBusinessData } from "@/actions/retail-business.actions";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface RetailBusinessReportProps {
  className?: string;
}

export function RetailBusinessReport({ className }: RetailBusinessReportProps) {
  const [filter, setFilter] = useState<"today" | "last7days" | "thisMonth" | "custom">("today");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<{
    items: RetailBusinessData[];
    totals: any;
    dateRange: { start: string; end: string };
  } | null>(null);

  const handleGenerateReport = async () => {
    if (filter === "custom" && (!startDate || !endDate)) {
      toast.error("Please select both start and end dates");
      return;
    }

    setLoading(true);

    try {
      const result = await getRetailBusinessData(
        filter,
        filter === "custom" && startDate && endDate
          ? { start: startDate, end: endDate }
          : undefined
      );

      if (!result.success || !result.data) {
        toast.error(result.message || "Failed to generate report");
        return;
      }

      setReportData(result.data);
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Retail Business Data Report", pageWidth / 2, 15, { align: "center" });

    // Date Range
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const dateRangeText = `Period: ${format(new Date(reportData.dateRange.start), "dd MMM yyyy")} - ${format(new Date(reportData.dateRange.end), "dd MMM yyyy")}`;
    doc.text(dateRangeText, pageWidth / 2, 23, { align: "center" });

    // Generate table data
    const tableData = reportData.items.map((item) => [
      item.productName,
      `${item.variantVolume} ${item.unit}`,
      `₹${item.purchasePrice.toFixed(2)}`,
      `₹${item.sellingPrice.toFixed(2)}`,
      item.quantitySold.toString(),
      `₹${item.totalPurchaseCost.toFixed(2)}`,
      `₹${item.totalRevenue.toFixed(2)}`,
      `₹${item.netProfit.toFixed(2)}`,
      `${item.profitMargin.toFixed(2)}%`,
    ]);

    // Add table
    autoTable(doc, {
      head: [
        [
          "Product",
          "Variant",
          "Purchase Price",
          "Selling Price",
          "Qty Sold",
          "Total Cost",
          "Revenue",
          "Net Profit",
          "Margin %",
        ],
      ],
      body: tableData,
      startY: 30,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 20 },
        2: { cellWidth: 18, halign: "right" },
        3: { cellWidth: 18, halign: "right" },
        4: { cellWidth: 12, halign: "center" },
        5: { cellWidth: 20, halign: "right" },
        6: { cellWidth: 20, halign: "right" },
        7: { cellWidth: 20, halign: "right" },
        8: { cellWidth: 15, halign: "right" },
      },
    });

    // Add summary section
    const finalY = (doc as any).lastAutoTable.finalY || 30;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, finalY + 15);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Purchase Cost: ₹${reportData.totals.totalPurchaseCost.toFixed(2)}`, 14, finalY + 23);
    doc.text(`Total Revenue: ₹${reportData.totals.totalRevenue.toFixed(2)}`, 14, finalY + 30);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(reportData.totals.netProfit >= 0 ? 0 : 255, reportData.totals.netProfit >= 0 ? 150 : 0, 0);
    doc.text(`Net Profit: ₹${reportData.totals.netProfit.toFixed(2)}`, 14, finalY + 37);

    // Add detailed analysis
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Profit Analysis by Product:", 14, finalY + 50);

    let yPos = finalY + 58;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    reportData.items.forEach((item) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      const profitText = `You purchased ${item.productName} (${item.variantVolume} ${item.unit}) for ₹${item.purchasePrice.toFixed(2)} and sold for ₹${item.sellingPrice.toFixed(2)}. Your net profit on ${item.productName} selling is ₹${item.netProfit.toFixed(2)} (${item.quantitySold} units sold).`;
      
      const lines = doc.splitTextToSize(profitText, pageWidth - 28);
      doc.text(lines, 14, yPos);
      yPos += lines.length * 5 + 3;
    });

    // Save the PDF
    const fileName = `retail-business-report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
    doc.save(fileName);
    toast.success("PDF downloaded successfully!");
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Retail Business Data Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Selection */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Period</label>
            <Select
              value={filter}
              onValueChange={(value: any) => setFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today's Sales</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {filter === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Report"
            )}
          </Button>
        </div>

        {/* Report Preview */}
        {reportData && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Report Preview</h3>
              <Button onClick={generatePDF} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Total Cost</div>
                  <div className="text-2xl font-bold">
                    ₹{reportData.totals.totalPurchaseCost.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                  <div className="text-2xl font-bold">
                    ₹{reportData.totals.totalRevenue.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Net Profit</div>
                  <div className={cn(
                    "text-2xl font-bold",
                    reportData.totals.netProfit >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    ₹{reportData.totals.netProfit.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-left">Variant</th>
                      <th className="px-4 py-3 text-right">Purchase</th>
                      <th className="px-4 py-3 text-right">Selling</th>
                      <th className="px-4 py-3 text-right">Qty Sold</th>
                      <th className="px-4 py-3 text-right">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-3">{item.productName}</td>
                        <td className="px-4 py-3">{item.variantVolume} {item.unit}</td>
                        <td className="px-4 py-3 text-right">₹{item.purchasePrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">₹{item.sellingPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">{item.quantitySold}</td>
                        <td className={cn(
                          "px-4 py-3 text-right font-medium",
                          item.netProfit >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          ₹{item.netProfit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}