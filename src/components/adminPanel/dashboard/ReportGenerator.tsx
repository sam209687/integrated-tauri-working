// src/components/adminPanel/dashboard/ReportGenerator.tsx
"use client";

import { useState } from "react";
import { FileText, Download, Loader2, Printer } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, startOfMonth } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { generateSalesReport } from "@/actions/report.actions";

interface ProductSalesItem {
  productName: string;
  variantVolume: number;
  unit: string;
  price: number;
  quantity: number;
  totalAmount: number;
}

interface SalesReportData {
  reportPeriod: string;
  fromDate: string;
  toDate: string;
  products: ProductSalesItem[];
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalRevenue: number;
  };
}

export function ReportGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [reportData, setReportData] = useState<SalesReportData | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const handleGenerateReport = async (filterType: string) => {
    setIsGenerating(true);
    let start: Date;
    let end: Date = endOfDay(new Date());

    try {
      switch (filterType) {
        case "today":
          start = startOfDay(new Date());
          break;
        case "last7days":
          start = startOfDay(subDays(new Date(), 7));
          break;
        case "thisMonth":
          start = startOfMonth(new Date());
          break;
        case "dateRange":
          if (!fromDate || !toDate) {
            toast.error("Please select both from and to dates");
            setIsGenerating(false);
            return;
          }
          start = startOfDay(fromDate);
          end = endOfDay(toDate);
          break;
        default:
          toast.error("Invalid filter type");
          setIsGenerating(false);
          return;
      }

      const result = await generateSalesReport(start, end);

      if (result.success && result.data) {
        setReportData(result.data);
        setShowReportDialog(true);
        toast.success("Report generated successfully!");
      } else {
        toast.error(result.message || "Failed to generate report");
      }
    } catch (error) {
      console.error("Report generation error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
      setIsOpen(false);
      setShowDateRange(false);
    }
  };

  const handleDateRangeSubmit = () => {
    handleGenerateReport("dateRange");
  };

  const handlePrintReport = () => {
    if (!reportData) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print/download PDF');
      return;
    }

    // Generate HTML content for PDF/Print
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Sales Report - ${reportData.reportPeriod}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              background: white;
              color: #000;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #333;
              padding-bottom: 20px;
            }
            
            .header h1 {
              font-size: 28px;
              margin-bottom: 10px;
              color: #1a1a1a;
            }
            
            .header .period {
              font-size: 18px;
              color: #666;
              margin-bottom: 5px;
            }
            
            .header .date-range {
              font-size: 14px;
              color: #888;
            }
            
            .summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin: 30px 0;
              padding: 20px;
              background: #f5f5f5;
              border-radius: 8px;
            }
            
            .summary-card {
              text-align: center;
              padding: 15px;
              background: white;
              border-radius: 6px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .summary-card .label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 8px;
              letter-spacing: 0.5px;
            }
            
            .summary-card .value {
              font-size: 24px;
              font-weight: bold;
              color: #1a1a1a;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            thead {
              background: #333;
              color: white;
            }
            
            th {
              padding: 12px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            th:nth-child(2),
            th:nth-child(3),
            th:nth-child(4),
            th:nth-child(5) {
              text-align: right;
            }
            
            tbody tr {
              border-bottom: 1px solid #e0e0e0;
            }
            
            tbody tr:hover {
              background: #f9f9f9;
            }
            
            tbody tr:last-child {
              border-bottom: 2px solid #333;
            }
            
            td {
              padding: 12px;
              font-size: 13px;
            }
            
            td:nth-child(2),
            td:nth-child(3),
            td:nth-child(4),
            td:nth-child(5) {
              text-align: right;
            }
            
            .product-name {
              font-weight: 600;
              color: #1a1a1a;
            }
            
            .total-amount {
              font-weight: 700;
              color: #2d5016;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #333;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            
            .grand-total {
              margin-top: 20px;
              padding: 20px;
              background: #333;
              color: white;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .grand-total .label {
              font-size: 18px;
              font-weight: 600;
            }
            
            .grand-total .value {
              font-size: 28px;
              font-weight: bold;
            }
            
            @media print {
              body {
                padding: 20px;
              }
              
              .no-print {
                display: none;
              }
              
              table {
                page-break-inside: auto;
              }
              
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              
              thead {
                display: table-header-group;
              }
            }
            
            @page {
              size: A4;
              margin: 15mm;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sales Report</h1>
            <div class="period">${reportData.reportPeriod}</div>
            <div class="date-range">${reportData.fromDate} - ${reportData.toDate}</div>
          </div>
          
          <div class="summary">
            <div class="summary-card">
              <div class="label">Total Products</div>
              <div class="value">${reportData.summary.totalProducts}</div>
            </div>
            <div class="summary-card">
              <div class="label">Total Quantity</div>
              <div class="value">${reportData.summary.totalQuantity}</div>
            </div>
            <div class="summary-card">
              <div class="label">Total Revenue</div>
              <div class="value">₹${reportData.summary.totalRevenue.toFixed(2)}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Volume</th>
                <th>Price</th>
                <th>Qty Sold</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.products.map(item => `
                <tr>
                  <td class="product-name">${item.productName}</td>
                  <td>${item.variantVolume} ${item.unit}</td>
                  <td>₹${item.price.toFixed(2)}</td>
                  <td>${item.quantity}</td>
                  <td class="total-amount">₹${item.totalAmount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="grand-total">
            <div class="label">GRAND TOTAL</div>
            <div class="value">₹${reportData.summary.totalRevenue.toFixed(2)}</div>
          </div>
          
          <div class="footer">
            <p>Generated on ${format(new Date(), 'PPpp')}</p>
            <p style="margin-top: 10px;">This is a computer-generated report. No signature required.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };

    toast.success('Print dialog opened');
  };

  const downloadReportAsCSV = () => {
    if (!reportData) return;

    const csvRows = [
      ["Sales Report"],
      [`Period: ${reportData.reportPeriod}`],
      [`From: ${reportData.fromDate}`],
      [`To: ${reportData.toDate}`],
      [],
      ["Product Name", "Volume", "Unit", "Price (₹)", "Quantity Sold", "Total Amount (₹)"],
    ];

    reportData.products.forEach((item) => {
      csvRows.push([
        item.productName,
        item.variantVolume.toString(),
        item.unit,
        item.price.toString(),
        item.quantity.toString(),
        item.totalAmount.toString(),
      ]);
    });

    csvRows.push([]);
    csvRows.push(["Summary"]);
    csvRows.push(["Total Products", reportData.summary.totalProducts.toString()]);
    csvRows.push(["Total Quantity Sold", reportData.summary.totalQuantity.toString()]);
    csvRows.push(["Total Revenue", `₹${reportData.summary.totalRevenue.toFixed(2)}`]);

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV report downloaded successfully!");
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Select Report Period</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <div className="flex flex-col gap-1 p-1">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleGenerateReport("today")}
            >
              Today&apos;s Sales
            </Button>
            
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleGenerateReport("last7days")}
            >
              Last 7 Days
            </Button>
            
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handleGenerateReport("thisMonth")}
            >
              This Month
            </Button>

            <DropdownMenuSeparator />
            
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => setShowDateRange(!showDateRange)}
            >
              Custom Date Range
            </Button>

            {showDateRange && (
              <div className="p-2 space-y-2 bg-muted/50 rounded-md mt-2">
                <div className="space-y-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !fromDate && "text-muted-foreground"
                        )}
                      >
                        {fromDate ? format(fromDate, "PPP") : "From Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fromDate}
                        onSelect={setFromDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !toDate && "text-muted-foreground"
                        )}
                      >
                        {toDate ? format(toDate, "PPP") : "To Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={toDate}
                        onSelect={setToDate}
                        disabled={[{ before: fromDate || new Date(0) }]}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    className="w-full"
                    onClick={handleDateRangeSubmit}
                    disabled={!fromDate || !toDate}
                  >
                    Generate Report
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Report Display Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Sales Report</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintReport}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print / PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadReportAsCSV}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              {reportData?.reportPeriod} ({reportData?.fromDate} - {reportData?.toDate})
            </DialogDescription>
          </DialogHeader>

          {reportData && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{reportData.summary.totalProducts}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Quantity</p>
                  <p className="text-2xl font-bold">{reportData.summary.totalQuantity}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">₹{reportData.summary.totalRevenue.toFixed(2)}</p>
                </div>
              </div>

              {/* Products Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-semibold">Product</th>
                      <th className="text-right p-3 font-semibold">Volume</th>
                      <th className="text-right p-3 font-semibold">Price</th>
                      <th className="text-right p-3 font-semibold">Qty Sold</th>
                      <th className="text-right p-3 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.products.map((item, index) => (
                      <tr key={index} className="border-t hover:bg-muted/50">
                        <td className="p-3">
                          {item.productName}
                        </td>
                        <td className="text-right p-3">
                          {item.variantVolume} {item.unit}
                        </td>
                        <td className="text-right p-3">₹{item.price}</td>
                        <td className="text-right p-3">{item.quantity}</td>
                        <td className="text-right p-3 font-semibold">
                          ₹{item.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}