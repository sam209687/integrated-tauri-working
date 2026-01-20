// src/components/adminPanel/retailCards/RetailSalesModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Loader2, 
  X, 
  Package, 
  TrendingUp, 
  AlertCircle,
  Save,
  Download,
  CalendarIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  getCategoryPurchaseSummary, 
  CategoryPurchaseSummary,
  updateVariantStock,
  updateVariantPrices,
  RetailBoardPriceItem
} from '@/actions/retailBoardPrice.actions';
import { getRetailBusinessData, RetailBusinessData } from '@/actions/retail-business.actions';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface RetailSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RetailSalesModal({ isOpen, onClose }: RetailSalesModalProps) {
  const [categories, setCategories] = useState<CategoryPurchaseSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categoryData, setCategoryData] = useState<CategoryPurchaseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({});
  const [priceUpdates, setPriceUpdates] = useState<Record<string, { purchasePrice?: number; sellingPrice?: number }>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Report states
  const [reportFilter, setReportFilter] = useState<"today" | "last7days" | "thisMonth" | "custom">("today");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<{
    items: RetailBusinessData[];
    totals: any;
    dateRange: { start: string; end: string };
  } | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const result = await getCategoryPurchaseSummary();
        if (result.success && result.data) {
          // Filter out edible oil category
          const filtered = result.data.filter(
            (cat: CategoryPurchaseSummary) => cat.categoryName.toLowerCase() !== 'edible oil'
          );
          setCategories(filtered);
        } else {
          toast.error(result.message || "Failed to load categories");
        }
      } catch (err) {
        toast.error("An unexpected error occurred");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Load selected category data
  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(cat => cat.categoryName === selectedCategory);
      setCategoryData(category || null);
      
      // Initialize stock updates with current stock
      if (category) {
        const initialStocks: Record<string, number> = {};
        const initialPrices: Record<string, { purchasePrice?: number; sellingPrice?: number }> = {};
        category.items.forEach(item => {
          initialStocks[item._id] = 0; // Default to 0 additional stock
          initialPrices[item._id] = {
            purchasePrice: item.purchasePrice,
            sellingPrice: item.sellingPrice
          };
        });
        setStockUpdates(initialStocks);
        setPriceUpdates(initialPrices);
      }
    }
  }, [selectedCategory, categories]);

  const handleStockChange = (variantId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setStockUpdates(prev => ({
      ...prev,
      [variantId]: Math.max(0, numValue) // Ensure non-negative
    }));
  };

  const handlePriceChange = (variantId: string, field: 'purchasePrice' | 'sellingPrice', value: string) => {
    const numValue = parseFloat(value) || 0;
    setPriceUpdates(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: Math.max(0, numValue) // Ensure non-negative
      }
    }));
  };

  const handleSaveStocks = async () => {
    if (!categoryData) return;

    setIsSaving(true);
    try {
      // Prepare stock updates
      const stockUpdateList = Object.entries(stockUpdates)
        .filter(([_, addStock]) => addStock > 0)
        .map(([variantId, addStock]) => ({
          variantId,
          addStock
        }));

      // Prepare price updates (only changed prices)
      const priceUpdateList = Object.entries(priceUpdates)
        .filter(([variantId, prices]) => {
          const originalItem = categoryData.items.find(item => item._id === variantId);
          if (!originalItem) return false;
          return prices.purchasePrice !== originalItem.purchasePrice || 
                 prices.sellingPrice !== originalItem.sellingPrice;
        })
        .map(([variantId, prices]) => ({
          variantId,
          ...prices
        }));

      if (stockUpdateList.length === 0 && priceUpdateList.length === 0) {
        toast.info("No changes to save");
        setIsSaving(false);
        return;
      }

      // Update stocks if any
      if (stockUpdateList.length > 0) {
        const stockResult = await updateVariantStock(stockUpdateList);
        if (!stockResult.success) {
          toast.error(stockResult.message || "Failed to update stock");
          setIsSaving(false);
          return;
        }
      }

      // Update prices if any
      if (priceUpdateList.length > 0) {
        const priceResult = await updateVariantPrices(priceUpdateList);
        if (!priceResult.success) {
          toast.error(priceResult.message || "Failed to update prices");
          setIsSaving(false);
          return;
        }
      }

      toast.success(`Updated ${stockUpdateList.length} stock${stockUpdateList.length !== 1 ? 's' : ''} and ${priceUpdateList.length} price${priceUpdateList.length !== 1 ? 's' : ''}`);
      
      // Refresh categories
      const refreshResult = await getCategoryPurchaseSummary();
      if (refreshResult.success && refreshResult.data) {
        const filtered = refreshResult.data.filter(
          (cat: CategoryPurchaseSummary) => cat.categoryName.toLowerCase() !== 'edible oil'
        );
        setCategories(filtered);
      }
      
      // Reset stock updates
      const resetStocks: Record<string, number> = {};
      categoryData.items.forEach(item => {
        resetStocks[item._id] = 0;
      });
      setStockUpdates(resetStocks);
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateReport = async () => {
    if (reportFilter === "custom" && (!startDate || !endDate)) {
      toast.error("Please select both start and end dates");
      return;
    }

    setIsGeneratingReport(true);

    try {
      const result = await getRetailBusinessData(
        reportFilter,
        reportFilter === "custom" && startDate && endDate
          ? { start: startDate, end: endDate }
          : undefined
      );

      if (!result.success || !result.data) {
        toast.error(result.message || "Failed to generate report");
        return;
      }

      // If category is selected, filter the results
      if (selectedCategory && result.data.items) {
        const categoryItems = categoryData?.items.map(i => i.productName) || [];
        result.data.items = result.data.items.filter(item => 
          categoryItems.includes(item.productName)
        );
        
        // Recalculate totals
        result.data.totals = result.data.items.reduce(
          (acc, item) => ({
            totalPurchaseCost: acc.totalPurchaseCost + item.totalPurchaseCost,
            totalRevenue: acc.totalRevenue + item.totalRevenue,
            netProfit: acc.netProfit + item.netProfit
          }),
          { totalPurchaseCost: 0, totalRevenue: 0, netProfit: 0 }
        );
      }

      setReportData(result.data);
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generatePDF = () => {
    if (!reportData || !selectedCategory) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`${selectedCategory} - Business Report`, pageWidth / 2, 15, { align: "center" });

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
          "Purchase",
          "Selling",
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

    // Save the PDF
    const fileName = `${selectedCategory.replace(/\s+/g, '-')}-report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
    doc.save(fileName);
    toast.success("PDF downloaded successfully!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto backdrop-blur-2xl dark:bg-gray-900/95 bg-white/95 dark:border-white/20 border-gray-200 rounded-3xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold dark:text-white text-gray-900">
            Retail Sales Management
          </DialogTitle>
          <p className="text-sm dark:text-gray-400 text-gray-600">
            Manage stock and generate reports by category
          </p>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Select Category
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={isLoading}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.categoryName} value={cat.categoryName}>
                    {cat.categoryName} ({cat.itemCount} items)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Data Display */}
          {categoryData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Category Summary */}
              <div className="p-6 rounded-2xl bg-linear-to-r dark:from-blue-500/20 dark:to-cyan-500/20 from-blue-100 to-cyan-100 border dark:border-blue-500/30 border-blue-300">
                <h3 className="text-lg font-bold dark:text-white text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {categoryData.categoryName}
                  <span className="text-sm font-normal dark:text-gray-300 text-gray-600">
                    ({categoryData.itemCount} items)
                  </span>
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm dark:text-gray-300 text-gray-600 mb-1">Purchase Price</p>
                    <p className="text-2xl font-bold dark:text-white text-gray-900">
                      ₹ {categoryData.totalPurchasePrice.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm dark:text-gray-300 text-gray-600 mb-1">Selling Price</p>
                    <p className="text-2xl font-bold dark:text-white text-gray-900">
                      ₹ {categoryData.totalSellingPrice.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm dark:text-gray-300 text-gray-600 mb-1">Expected Profit</p>
                    <p className="text-2xl font-bold text-green-500">
                      ₹ {categoryData.totalProfit.toFixed(2)}
                    </p>
                    <p className="text-sm text-green-400 mt-1">
                      {categoryData.profitPercentage.toFixed(1)}% margin
                    </p>
                  </div>
                </div>
              </div>

              {/* Stock Management */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold dark:text-white text-gray-900 text-lg">
                    Stock Management
                  </h4>
                  <Button 
                    onClick={handleSaveStocks}
                    disabled={isSaving || (Object.values(stockUpdates).every(v => v === 0) && 
                              Object.keys(priceUpdates).length === 0)}
                    size="sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Stock Updates
                      </>
                    )}
                  </Button>
                </div>

                {categoryData.items.map((item, idx) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-xl dark:bg-white/5 bg-gray-50 border dark:border-gray-700 border-gray-200"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Product Info */}
                      <div className="col-span-2">
                        <h5 className="font-semibold dark:text-white text-gray-900">
                          {item.productName}
                        </h5>
                        <p className="text-xs dark:text-gray-400 text-gray-500 mt-1">
                          Code: {item.productCode}
                        </p>
                      </div>

                      {/* Editable Prices */}
                      <div className="col-span-2">
                        <Label htmlFor={`purchase-${item._id}`} className="text-xs mb-1 block dark:text-gray-400 text-gray-500">
                          Purchase Price
                        </Label>
                        <Input
                          id={`purchase-${item._id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={priceUpdates[item._id]?.purchasePrice ?? item.purchasePrice}
                          onChange={(e) => handlePriceChange(item._id, 'purchasePrice', e.target.value)}
                          className="text-center font-semibold"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`selling-${item._id}`} className="text-xs mb-1 block dark:text-gray-400 text-gray-500">
                          Selling Price
                        </Label>
                        <Input
                          id={`selling-${item._id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={priceUpdates[item._id]?.sellingPrice ?? item.sellingPrice}
                          onChange={(e) => handlePriceChange(item._id, 'sellingPrice', e.target.value)}
                          className="text-center font-semibold"
                        />
                      </div>

                      {/* Profit Display */}
                      <div className="col-span-2 text-center">
                        <p className="text-xs dark:text-gray-400 text-gray-500 mb-1">Profit</p>
                        <p className={`font-bold ${
                          ((priceUpdates[item._id]?.sellingPrice ?? item.sellingPrice) - 
                           (priceUpdates[item._id]?.purchasePrice ?? item.purchasePrice)) >= 0 
                            ? 'text-green-500' 
                            : 'text-red-500'
                        }`}>
                          ₹{((priceUpdates[item._id]?.sellingPrice ?? item.sellingPrice) - 
                             (priceUpdates[item._id]?.purchasePrice ?? item.purchasePrice)).toFixed(2)}
                        </p>
                      </div>

                      {/* Stock Fields */}
                      <div className="col-span-1 text-center">
                        <p className="text-xs dark:text-gray-400 text-gray-500 mb-1">Current</p>
                        <p className="text-center font-bold dark:text-white text-gray-900 p-2 rounded dark:bg-white/10 bg-gray-100">
                          {item.stockQuantity || 0}
                        </p>
                      </div>

                      <div className="col-span-2">
                        <Label htmlFor={`stock-${item._id}`} className="text-xs mb-1 block dark:text-gray-400 text-gray-500">
                          Add Stock
                        </Label>
                        <Input
                          id={`stock-${item._id}`}
                          type="number"
                          min="0"
                          step="1"
                          value={stockUpdates[item._id] || 0}
                          onChange={(e) => handleStockChange(item._id, e.target.value)}
                          className="text-center font-semibold"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        <p className="text-xs dark:text-gray-400 text-gray-500 mb-1">New Total</p>
                        <p className="text-center font-bold text-green-500 p-2 rounded dark:bg-green-500/10 bg-green-50">
                          {(item.stockQuantity || 0) + (stockUpdates[item._id] || 0)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Report Generation Section */}
              <div className="p-6 rounded-2xl dark:bg-white/5 bg-gray-50 border dark:border-gray-700 border-gray-200 space-y-4">
                <h4 className="font-bold dark:text-white text-gray-900 text-lg">
                  Generate Business Report
                </h4>

                {/* Report Filter */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm mb-2 block">Report Period</Label>
                    <Select
                      value={reportFilter}
                      onValueChange={(value: any) => setReportFilter(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="last7days">Last 7 Days</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {reportFilter === "custom" && (
                    <>
                      <div>
                        <Label className="text-sm mb-2 block">Start Date</Label>
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
                              {startDate ? format(startDate, "PPP") : "Pick date"}
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
                        <Label className="text-sm mb-2 block">End Date</Label>
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
                              {endDate ? format(endDate, "PPP") : "Pick date"}
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
                    </>
                  )}

                  <div className="flex items-end">
                    <Button
                      onClick={handleGenerateReport}
                      disabled={isGeneratingReport}
                      className="w-full"
                    >
                      {isGeneratingReport ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Report"
                      )}
                    </Button>
                  </div>
                </div>

                {/* Report Preview */}
                {reportData && reportData.items.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold dark:text-white text-gray-900">Report Summary</h4>
                      <Button onClick={generatePDF} variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl dark:bg-white/10 bg-gray-100">
                        <p className="text-sm dark:text-gray-400 text-gray-600">Total Cost</p>
                        <p className="text-xl font-bold dark:text-white text-gray-900">
                          ₹{reportData.totals.totalPurchaseCost.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl dark:bg-white/10 bg-gray-100">
                        <p className="text-sm dark:text-gray-400 text-gray-600">Total Revenue</p>
                        <p className="text-xl font-bold dark:text-white text-gray-900">
                          ₹{reportData.totals.totalRevenue.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl dark:bg-green-500/10 bg-green-50">
                        <p className="text-sm text-green-600">Net Profit</p>
                        <p className="text-xl font-bold text-green-600">
                          ₹{reportData.totals.netProfit.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {reportData && reportData.items.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                    <p className="text-lg font-medium dark:text-white text-gray-900">
                      No sales data found for this period
                    </p>
                    <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">
                      Try selecting a different date range
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
              <p className="text-lg font-medium dark:text-white text-gray-900">
                Loading categories...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}