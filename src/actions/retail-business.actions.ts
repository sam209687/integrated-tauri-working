// src/actions/retail-business.actions.ts
"use server";

import { connectToDatabase } from "@/lib/db";
import Variant from "@/lib/models/variant";
import Invoice from "@/lib/models/invoice";

/* ------------------------------------------------------------------ */
/* TYPES */
/* ------------------------------------------------------------------ */

export interface RetailBusinessData {
  productName: string;
  variantVolume: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  quantitySold: number;
  totalPurchaseCost: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

/* ------------------------------------------------------------------ */
/* HELPER FUNCTIONS */
/* ------------------------------------------------------------------ */

function getDateRange(filter: string, customRange?: { start: Date; end: Date }): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case "today":
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };

    case "last7days":
      const last7Days = new Date(today);
      last7Days.setDate(last7Days.getDate() - 7);
      return {
        startDate: last7Days,
        endDate: now,
      };

    case "thisMonth":
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: firstDayOfMonth,
        endDate: now,
      };

    case "custom":
      if (!customRange) {
        throw new Error("Custom range requires start and end dates");
      }
      return {
        startDate: customRange.start,
        endDate: customRange.end,
      };

    default:
      return {
        startDate: today,
        endDate: now,
      };
  }
}

function toPlainObject<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/* ------------------------------------------------------------------ */
/* GET RETAIL BUSINESS DATA */
/* ------------------------------------------------------------------ */

export const getRetailBusinessData = async (
  filter: "today" | "last7days" | "thisMonth" | "custom",
  customRange?: { start: Date; end: Date }
) => {
  try {
    await connectToDatabase();

    const { startDate, endDate } = getDateRange(filter, customRange);

    // Fetch all active invoices within the date range
    const invoices = await Invoice.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: "active", // Only active invoices (exclude cancelled)
    })
      .select("items")
      .lean();

    // Get all unique variant IDs from invoices
    const variantIds = new Set<string>();
    invoices.forEach((invoice: any) => {
      invoice.items?.forEach((item: any) => {
        if (item.variantId) {
          variantIds.add(item.variantId.toString());
        }
      });
    });

    // Fetch all variants with their details
    const variants = await Variant.find({
      _id: { $in: Array.from(variantIds) },
    })
      .populate({
        path: "product",
        select: "productName productCode",
      })
      .populate({
        path: "unit",
        select: "name",
      })
      .lean();

    // Create a map for quick variant lookup
    const variantMap = new Map(
      variants.map((v: any) => [v._id.toString(), v])
    );

    // Aggregate sales data by variant
    const variantSalesMap = new Map<string, {
      variant: any;
      quantitySold: number;
      totalRevenue: number;
    }>();

    invoices.forEach((invoice: any) => {
      invoice.items?.forEach((item: any) => {
        if (!item.variantId) return;

        const variantId = item.variantId.toString();
        const variant = variantMap.get(variantId);
        
        if (!variant) return;

        const existing = variantSalesMap.get(variantId);

        if (existing) {
          existing.quantitySold += item.quantity || 0;
          existing.totalRevenue += (item.price || 0) * (item.quantity || 0);
        } else {
          variantSalesMap.set(variantId, {
            variant,
            quantitySold: item.quantity || 0,
            totalRevenue: (item.price || 0) * (item.quantity || 0),
          });
        }
      });
    });

    // Build the retail business data array
    const businessData: RetailBusinessData[] = [];

    variantSalesMap.forEach((salesData) => {
      const variant = salesData.variant;
      const purchasePrice = variant.purchasePrice || 0;
      const sellingPrice = variant.sellingPrice || 0;
      const quantitySold = salesData.quantitySold;
      const totalRevenue = salesData.totalRevenue;
      const totalPurchaseCost = purchasePrice * quantitySold;
      const netProfit = totalRevenue - totalPurchaseCost;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      businessData.push({
        productName: variant.product?.productName || "Unknown Product",
        variantVolume: variant.variantVolume || 0,
        unit: variant.unit?.name || "Unit",
        purchasePrice,
        sellingPrice,
        quantitySold,
        totalPurchaseCost,
        totalRevenue,
        netProfit,
        profitMargin,
      });
    });

    // Sort by net profit (descending)
    businessData.sort((a, b) => b.netProfit - a.netProfit);

    // Calculate totals
    const totals = businessData.reduce(
      (acc, item) => ({
        totalPurchaseCost: acc.totalPurchaseCost + item.totalPurchaseCost,
        totalRevenue: acc.totalRevenue + item.totalRevenue,
        netProfit: acc.netProfit + item.netProfit,
      }),
      { totalPurchaseCost: 0, totalRevenue: 0, netProfit: 0 }
    );

    return {
      success: true,
      data: {
        items: toPlainObject(businessData),
        totals: toPlainObject(totals),
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    };
  } catch (error) {
    console.error("❌ Failed to fetch retail business data:", error);
    return {
      success: false,
      message: "Failed to fetch retail business data.",
    };
  }
};