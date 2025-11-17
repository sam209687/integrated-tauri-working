// src/actions/pos-suggestions.actions.ts
"use server";

import { connectToDatabase } from "@/lib/db";
import Variant from "@/lib/models/variant";


export const getVariantsByMaxPrice = async (price: number) => {
  try {
    await connectToDatabase();
    // Find variants where the price is less than or equal to the provided price
    // and sort by price descending. Limit to a reasonable number, e.g., 5.
    const variants = await Variant.find({ price: { $lte: price } })
      .populate({ 
          path: 'product', 
          select: 'productName productCode',
          populate: { path: 'tax', select: 'gst' }
        })
      .populate({ path: 'unit', select: 'name' })
      .sort({ price: -1 })
      .limit(5)
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(variants)) };
  } catch (error) {
    console.error("Failed to fetch suggested variants:", error);
    return { success: false, message: "Failed to fetch suggestions." };
  }
};