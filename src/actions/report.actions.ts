// src/actions/report.actions.ts
"use server";

import { connectToDatabase } from "@/lib/db";
import Invoice from "@/lib/models/invoice";
import Variant from "@/lib/models/variant";
import { format } from "date-fns";
import { Types } from "mongoose";

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

interface ServerActionResponse {
  success: boolean;
  message?: string;
  data?: SalesReportData;
}

// Type for invoice items from lean query
interface LeanInvoiceItem {
  name: string;
  price: number;
  quantity: number;
  variantId: Types.ObjectId | string;
  mrp?: number;
  gstRate?: number;
  hsn?: string;
}

// Type for lean invoice document
interface LeanInvoice {
  _id: Types.ObjectId;
  items: LeanInvoiceItem[];
  status: string;
  createdAt: Date;
  [key: string]: unknown;
}

// Type for lean variant with populated fields
interface LeanVariant {
  _id: Types.ObjectId;
  variantVolume: number;
  price: number;
  product: {
    _id: Types.ObjectId;
    productName: string; // Changed from 'name' to 'productName'
  };
  unit: {
    _id: Types.ObjectId;
    name: string;
    abbreviation?: string;
  };
  [key: string]: unknown;
}

export async function generateSalesReport(
  fromDate: Date,
  toDate: Date
): Promise<ServerActionResponse> {
  try {
    await connectToDatabase();

    // Fetch all active invoices within the date range
    const invoices = await Invoice.find({
      status: "active",
      createdAt: {
        $gte: fromDate,
        $lte: toDate,
      },
    }).lean<LeanInvoice[]>();

    if (!invoices || invoices.length === 0) {
      return {
        success: true,
        message: "No sales data found for the selected period",
        data: {
          reportPeriod: getReportPeriod(fromDate, toDate),
          fromDate: format(fromDate, "PPP"),
          toDate: format(toDate, "PPP"),
          products: [],
          summary: {
            totalProducts: 0,
            totalQuantity: 0,
            totalRevenue: 0,
          },
        },
      };
    }

    // Aggregate sales data by variantId
    const variantSalesMap = new Map<
      string,
      {
        variantId: string;
        quantity: number;
        totalAmount: number;
      }
    >();

    // Process all invoice items
    invoices.forEach((invoice) => {
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach((item) => {
          const variantId = typeof item.variantId === 'string' 
            ? item.variantId 
            : item.variantId.toString();
          const existing = variantSalesMap.get(variantId);

          if (existing) {
            existing.quantity += item.quantity;
            existing.totalAmount += item.price * item.quantity;
          } else {
            variantSalesMap.set(variantId, {
              variantId,
              quantity: item.quantity,
              totalAmount: item.price * item.quantity,
            });
          }
        });
      }
    });

    // Fetch variant details with populated product and unit info
    const variantIds = Array.from(variantSalesMap.keys());
    const variants = await Variant.find({
      _id: { $in: variantIds },
    })
      .populate({
        path: "product",
        select: "productName", // Changed from 'name' to 'productName'
      })
      .populate({
        path: "unit",
        select: "name abbreviation",
      })
      .lean<LeanVariant[]>();

    // Build the product sales report
    const products: ProductSalesItem[] = variants.map((variant) => {
      const salesData = variantSalesMap.get(variant._id.toString());
      
      if (!salesData) {
        throw new Error(`Sales data not found for variant ${variant._id}`);
      }

      return {
        productName: variant.product?.productName || "Unknown Product", // Changed from 'name' to 'productName'
        variantVolume: variant.variantVolume,
        unit: variant.unit?.abbreviation || variant.unit?.name || "Unit",
        price: variant.price,
        quantity: salesData.quantity,
        totalAmount: salesData.totalAmount,
      };
    });

    // Sort by total amount (highest first)
    products.sort((a, b) => b.totalAmount - a.totalAmount);

    // Calculate summary
    const summary = {
      totalProducts: products.length,
      totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
      totalRevenue: products.reduce((sum, p) => sum + p.totalAmount, 0),
    };

    return {
      success: true,
      data: {
        reportPeriod: getReportPeriod(fromDate, toDate),
        fromDate: format(fromDate, "PPP"),
        toDate: format(toDate, "PPP"),
        products,
        summary,
      },
    };
  } catch (error) {
    console.error("❌ Report generation error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to generate report",
    };
  }
}

function getReportPeriod(fromDate: Date, toDate: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);
  
  const to = new Date(toDate);
  to.setHours(0, 0, 0, 0);

  // Check if it's today
  if (from.getTime() === today.getTime() && to.getTime() === today.getTime()) {
    return "Today's Sales";
  }

  // Check if it's last 7 days
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  if (from.getTime() === sevenDaysAgo.getTime() && to.getTime() === today.getTime()) {
    return "Last 7 Days";
  }

  // Check if it's current month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  if (from.getTime() === startOfMonth.getTime() && to.getTime() === today.getTime()) {
    return "This Month";
  }

  // Custom range
  return "Custom Date Range";
}