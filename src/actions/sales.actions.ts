// src/actions/sales.actions.ts
"use server";

import { connectToDatabase } from "@/lib/db";
import Invoice from "@/lib/models/invoice";
import Category from "@/lib/models/category";
import Variant from "@/lib/models/variant";

// ✅ Interface for each variant sales record
export interface VariantSalesData {
  productName: string;
  totalSales: number;
  totalRevenue: number;
  fill: string;
}

// ✅ Interface for response
export interface GetSalesDataByVariantResponse {
  success: boolean;
  data?: VariantSalesData[];
  message?: string;
}

/**
 * ✅ Get edible oil variant IDs
 */
async function getEdibleOilVariantIds(): Promise<string[]> {
  try {
    const edibleOilCategory = await Category.findOne({
      name: { $regex: /edible.*oil/i }
    });

    if (!edibleOilCategory) {
      console.log("⚠️ No edible oil category found");
      return [];
    }

    const edibleOilVariants = await Variant.find()
      .populate({
        path: 'product',
        match: { category: edibleOilCategory._id },
        select: '_id'
      })
      .lean();

    const variantIds = edibleOilVariants
      .filter((v: any) => v.product !== null)
      .map((v: any) => (v._id as any).toString());

    console.log(`📦 Found ${variantIds.length} edible oil variants`);
    return variantIds;
  } catch (error) {
    console.error("❌ Error getting edible oil variants:", error);
    return [];
  }
}

/**
 * ✅ Get sales data by variant (EDIBLE OILS ONLY)
 */
export async function getSalesDataByVariant(
  fromDate?: Date,
  toDate?: Date
): Promise<GetSalesDataByVariantResponse> {
  try {
    await connectToDatabase();

    // ✅ Get edible oil variant IDs to INCLUDE
    const edibleOilVariantIds = await getEdibleOilVariantIds();

    if (edibleOilVariantIds.length === 0) {
      return {
        success: true,
        data: [],
        message: "No edible oil variants found"
      };
    }

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
      // ✅ INCLUDE only edible oil variants
      {
        $match: {
          "items.variantId": { 
            $in: edibleOilVariantIds.map(id => new (require('mongoose').Types.ObjectId)(id))
          },
          // Exclude Oil Expelling charges
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

    console.log(`✅ Found ${salesData.length} edible oil products in sales`);

    return { success: true, data: salesData as VariantSalesData[] };
  } catch (error) {
    console.error("❌ [getSalesDataByVariant] Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch sales data (unknown error).";
    
    return {
      success: false,
      message: errorMessage,
    };
  }
}