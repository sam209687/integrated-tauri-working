// src/actions/pos/pos.actions.ts

"use server";

import { connectToDatabase } from "@/lib/db";
import Variant from "@/lib/models/variant";
import { IProduct } from "@/lib/models/product";
import { IUnit } from "@/lib/models/unit";
import { IPopulatedVariant } from "@/lib/models/variant";

// Import models for side-effects to register them
import "@/lib/models/product";
import "@/lib/models/brand";
import "@/lib/models/category";
import "@/lib/models/unit";
import "@/lib/models/tax"; // ✅ NEW: Register Tax model

// 💡 FIX: Replace the redundant interface with a type alias.
export type IPosVariant = IPopulatedVariant;

interface GetVariantsResult {
  success: boolean;
  data: IPosVariant[];
  message: string;
}

export async function getVariantsForPOS(): Promise<GetVariantsResult> {
  try {
    await connectToDatabase();
    
    const variants = await Variant.find({})
      .populate<{ product: IProduct; unit: IUnit }>([
        {
          path: 'product',
          // ✅ UPDATED: Add 'tax' to the selection
          select: 'productName productCode stockQuantity brand category tax mrp',
          populate: [
            { path: 'brand', select: 'name' },
            { path: 'category', select: 'name' },
            // ✅ NEW: Populate the nested tax field
            { path: 'tax', select: 'gst hsn' }
          ]
        },
        {
          path: 'unit',
          select: 'name'
        }
      ])
      .lean();

    if (!variants || variants.length === 0) {
      return {
        success: false,
        data: [],
        message: "No variants found."
      };
    }
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(variants)),
      message: "Variants fetched successfully."
    };
  } catch (error) {
    console.error("Error fetching POS variants:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      data: [],
      message: `An unexpected error occurred while fetching variants: ${errorMessage}`
    };
  }
}