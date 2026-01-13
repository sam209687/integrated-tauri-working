// src/actions/retail-business.actions.ts
"use server";

import { connectToDatabase } from "@/lib/db";
import Invoice from "@/lib/models/invoice";
import Category from "@/lib/models/category";
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from "date-fns";

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
  start: Date;
  end: Date;
}

/**
 * Get retail categories (excluding Edible Oil)
 */
async function getRetailCategories(): Promise<string[]> {
  try {
    const edibleOilCategory = await Category.findOne({
      name: { $regex: /edible.*oil/i }
    });

    const categories = await Category.find({
      _id: { $ne: edibleOilCategory?._id }
    }).select('_id').lean();

    return categories.map((c: any) => c._id.toString());
  } catch (error) {
    console.error("Error getting retail categories:", error);
    return [];
  }
}

export async function getRetailBusinessData(
  filter: "today" | "last7days" | "thisMonth" | "custom",
  customRange?: DateRange
) {
  try {
    await connectToDatabase();

    let startDate: Date;
    let endDate: Date;

    // Determine date range
    switch (filter) {
      case "today":
        startDate = startOfDay(new Date());
        endDate = endOfDay(new Date());
        break;
      case "last7days":
        startDate = startOfDay(subDays(new Date(), 7));
        endDate = endOfDay(new Date());
        break;
      case "thisMonth":
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
        break;
      case "custom":
        if (!customRange) {
          throw new Error("Custom range required");
        }
        startDate = startOfDay(customRange.start);
        endDate = endOfDay(customRange.end);
        break;
      default:
        startDate = startOfDay(new Date());
        endDate = endOfDay(new Date());
    }

    // Get retail category IDs (excluding edible oil)
    const retailCategoryIds = await getRetailCategories();

    // Fetch invoices in date range
    const invoices = await Invoice.find({
      createdAt: { $gte: startDate, $lte: endDate },
      type: "retail",
      paymentStatus: { $in: ["paid", "partial"] }
    })
      .populate({
        path: "items.variant",
        populate: [
          {
            path: "product",
            populate: {
              path: "category",
              select: "name _id"
            }
          },
          {
            path: "unit"
          }
        ]
      })
      .lean();

    // Aggregate data by variant
    const variantMap = new Map<string, {
      productName: string;
      categoryId: string;
      variantVolume: number;
      unit: string;
      purchasePrice: number;
      sellingPrice: number;
      quantitySold: number;
    }>();

    invoices.forEach((invoice: any) => {
      invoice.items?.forEach((item: any) => {
        if (!item.variant?.product) return;

        const variant = item.variant;
        const product = variant.product;
        const categoryId = product.category?._id?.toString() || "";

        // Skip if not in retail categories
        if (!retailCategoryIds.includes(categoryId)) {
          return;
        }

        const variantKey = variant._id.toString();

        if (!variantMap.has(variantKey)) {
          variantMap.set(variantKey, {
            productName: product.name || product.productName,
            categoryId,
            variantVolume: variant.variantVolume || 1,
            unit: variant.unit?.name || "unit",
            purchasePrice: variant.purchasePrice || 0,
            sellingPrice: variant.sellingPrice || 0,
            quantitySold: 0
          });
        }

        const variantData = variantMap.get(variantKey)!;
        variantData.quantitySold += item.quantity || 0;
      });
    });

    // Calculate business metrics
    const businessData: RetailBusinessData[] = Array.from(variantMap.values()).map(data => {
      const totalPurchaseCost = data.purchasePrice * data.quantitySold;
      const totalRevenue = data.sellingPrice * data.quantitySold;
      const netProfit = totalRevenue - totalPurchaseCost;
      const profitMargin = totalPurchaseCost > 0 
        ? (netProfit / totalPurchaseCost) * 100 
        : 0;

      return {
        productName: data.productName,
        variantVolume: data.variantVolume,
        unit: data.unit,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        quantitySold: data.quantitySold,
        totalPurchaseCost,
        totalRevenue,
        netProfit,
        profitMargin
      };
    });

    // Calculate totals
    const totals = businessData.reduce(
      (acc, item) => ({
        totalPurchaseCost: acc.totalPurchaseCost + item.totalPurchaseCost,
        totalRevenue: acc.totalRevenue + item.totalRevenue,
        netProfit: acc.netProfit + item.netProfit
      }),
      { totalPurchaseCost: 0, totalRevenue: 0, netProfit: 0 }
    );

    return {
      success: true,
      data: {
        items: businessData.sort((a, b) => b.netProfit - a.netProfit),
        totals,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    };
  } catch (error) {
    console.error("Error fetching retail business data:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch data",
      data: null
    };
  }
}