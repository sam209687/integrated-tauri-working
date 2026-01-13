// src/actions/retail.actions.ts
"use server";

import { connectToDatabase } from "@/lib/db";
import Invoice, { IInvoiceItem } from "@/lib/models/invoice";
import Variant from "@/lib/models/variant";
import Category from "@/lib/models/category";

// ✅ Interface for retail variant sales
export interface RetailVariantSalesData {
  productName: string;
  totalSales: number;
  totalRevenue: number;
  fill: string;
}

// ✅ Interface for retail metrics
export interface RetailMetrics {
  totalRevenue: number;
  totalSales: number;
  avgOrderValue: number;
  totalProfit: number;
  totalDeposits: number;
  depositableCharges: {
    packingCharges: number;
    laborCharges: number;
    electricityCharges: number;
    oecCharges: number;
  };
}

// ✅ Response interfaces
export interface GetRetailSalesDataResponse {
  success: boolean;
  data?: RetailVariantSalesData[];
  message?: string;
}

export interface GetRetailMetricsResponse {
  success: boolean;
  data?: RetailMetrics;
  message?: string;
}

/**
 * Get all variant IDs that belong to edible oil category
 */
async function getEdibleOilVariantIds(): Promise<string[]> {
  try {
    // Find the edible oil category (adjust the name based on your actual category name)
    const edibleOilCategory = await Category.findOne({
      name: { $regex: /edible.*oil/i } // Matches "Edible Oil", "edible oil", etc.
    });

    if (!edibleOilCategory) {
      console.log("⚠️ No edible oil category found");
      return [];
    }

    // Get all variants that belong to edible oil products
    const edibleOilVariants = await Variant.find()
      .populate({
        path: 'product',
        match: { category: edibleOilCategory._id },
        select: '_id'
      })
      .lean();

    // Filter out variants where product is null (didn't match the category)
    const variantIds = edibleOilVariants
      .filter((v: any) => v.product !== null)
      .map((v: any) => (v._id as any).toString());

    console.log(`📦 Found ${variantIds.length} edible oil variants to exclude`);
    return variantIds;
  } catch (error) {
    console.error("❌ Error getting edible oil variants:", error);
    return [];
  }
}

/**
 * Get retail sales data by variant (excluding edible oils)
 */
export async function getRetailSalesDataByVariant(
  fromDate?: Date,
  toDate?: Date
): Promise<GetRetailSalesDataResponse> {
  try {
    await connectToDatabase();

    // Get edible oil variant IDs to exclude
    const edibleOilVariantIds = await getEdibleOilVariantIds();

    const matchStage =
      fromDate && toDate
        ? {
            createdAt: {
              $gte: new Date(fromDate.toISOString()),
              $lte: new Date(toDate.toISOString()),
            },
            status: { $ne: "cancelled" },
          }
        : { status: { $ne: "cancelled" } };

    const salesData = await Invoice.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      // ✅ Exclude edible oil variants
      {
        $match: {
          "items.variantId": { 
            $nin: edibleOilVariantIds.map(id => new (require('mongoose').Types.ObjectId)(id))
          },
          // ✅ Also exclude Oil Expelling charges
          "items.name": { $not: { $regex: /oil expelling/i } }
        }
      },
      {
        $group: {
          _id: "$items.name",
          totalSales: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      {
        $project: {
          _id: 0,
          productName: "$_id",
          totalSales: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    console.log(`✅ Found ${salesData.length} retail products`);

    return { success: true, data: salesData as RetailVariantSalesData[] };
  } catch (error) {
    console.error("❌ Error fetching retail sales data:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch retail sales data.";
    return { success: false, message: errorMessage };
  }
}

/**
 * Get retail sales metrics (excluding edible oils)
 */
export async function getRetailSalesMetrics(
  fromDate?: Date,
  toDate?: Date
): Promise<GetRetailMetricsResponse> {
  try {
    await connectToDatabase();

    // Get edible oil variant IDs to exclude
    const edibleOilVariantIds = await getEdibleOilVariantIds();

    const matchStage =
      fromDate && toDate
        ? {
            createdAt: {
              $gte: new Date(fromDate.toISOString()),
              $lte: new Date(toDate.toISOString()),
            },
            status: { $ne: "cancelled" },
          }
        : { status: { $ne: "cancelled" } };

    // Get all invoices in the date range
    const invoices = await Invoice.find(matchStage).lean();

    let totalRevenue = 0;
    let totalProfit = 0;
    let invoiceCount = 0;
    let depositableCharges = {
      packingCharges: 0,
      laborCharges: 0,
      electricityCharges: 0,
      oecCharges: 0,
    };

    for (const invoice of invoices) {
      // Filter out edible oil items from each invoice
      const retailItems = invoice.items.filter((item: IInvoiceItem) => {
        const isEdibleOil = edibleOilVariantIds.includes(item.variantId.toString());
        const isOilExpelling = item.name.toLowerCase().includes('oil expelling');
        return !isEdibleOil && !isOilExpelling;
      });

      // Skip invoices with no retail items
      if (retailItems.length === 0) continue;

      invoiceCount++;

      // Calculate revenue from retail items only
      const invoiceRetailRevenue = retailItems.reduce(
        (sum: number, item: IInvoiceItem) => sum + (item.price * item.quantity),
        0
      );
      totalRevenue += invoiceRetailRevenue;

      // Calculate profit (assuming MRP exists and profit = revenue - cost)
      const invoiceProfit = retailItems.reduce((sum: number, item: IInvoiceItem) => {
        const revenue = item.price * item.quantity;
        const cost = (item.mrp || item.price) * item.quantity * 0.7; // Assuming 30% margin
        return sum + (revenue - cost);
      }, 0);
      totalProfit += invoiceProfit;

      // Add depositable charges (only for invoices with retail items)
      depositableCharges.packingCharges += invoice.packingChargeDiscount || 0;
      
      // Check for OEC charges in items (not edible oil related)
      const oecCharges = retailItems
        .filter((item: IInvoiceItem) => item.name.toLowerCase().includes('expelling'))
        .reduce((sum: number, item: IInvoiceItem) => sum + (item.price * item.quantity), 0);
      depositableCharges.oecCharges += oecCharges;
    }

    const avgOrderValue = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;
    const totalDeposits = Object.values(depositableCharges).reduce((a, b) => a + b, 0);

    const metrics: RetailMetrics = {
      totalRevenue,
      totalSales: invoiceCount,
      avgOrderValue,
      totalProfit,
      totalDeposits,
      depositableCharges,
    };

    console.log("✅ Retail metrics calculated:", metrics);

    return { success: true, data: metrics };
  } catch (error) {
    console.error("❌ Error fetching retail metrics:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch retail metrics.";
    return { success: false, message: errorMessage };
  }
}