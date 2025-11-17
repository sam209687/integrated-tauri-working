// src/actions/variant.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import Variant from "@/lib/models/variant";
import { variantSchema } from "@/lib/schemas";
import { z } from "zod";
import { Types } from "mongoose";

// ✅ NEW INTERFACE: For the stock update payload
interface StockUpdateItem {
  variantId: string | Types.ObjectId;
  quantity: number;
}

export interface VariantData {
  product: string;
  variantVolume: number;
  unit: string;
  unitConsumed: number;
  unitConsumedUnit: string;
  variantColor?: string;
  price: number;
  mrp: number;
  discount?: number;
  stockQuantity: number;
  stockAlertQuantity: number;
  image?: string;
  qrCode?: string;
  packingCharges?: number;
  laborCharges?: number;
  electricityCharges?: number;
  others1?: number;
  others2?: number;
}

export interface LowStockAlertData {
  _id: string;
  productName: string;
  variantVolume: number;
  unit: string;
  stockQuantity: number;
  stockAlertQuantity: number;
  variantColor: string;
}

// 💡 NEW: Minimal types for lean populated data
interface PopulatedProductLean {
    name?: string;
    productCode?: string;
}

interface PopulatedUnitLean {
    name?: string;
}

// Interface representing the lean variant document after population
interface LowStockVariantLean {
    _id: Types.ObjectId;
    product: PopulatedProductLean;
    unit: PopulatedUnitLean;
    variantVolume: number;
    stockQuantity: number;
    stockAlertQuantity: number;
    variantColor?: string;
}


// Fetch all variants
export const getVariants = async () => {
  try {
    await connectToDatabase();
    const variants = await Variant.find({}).populate("product unit unitConsumedUnit").lean();
    return { success: true, data: JSON.parse(JSON.stringify(variants)) };
  } catch (error) {
    console.error("Failed to fetch variants:", error);
    return { success: false, message: "Failed to fetch variants." };
  }
};

// Fetch a single variant by ID
export const getVariantById = async (id: string) => {
  try {
    await connectToDatabase();
    const variant = await Variant.findById(id).populate("product unit unitConsumedUnit").lean();
    if (!variant) {
      return { success: false, message: "Variant not found." };
    }
    return { success: true, data: JSON.parse(JSON.stringify(variant)) };
  } catch (error) {
    console.error("Failed to fetch variant:", error); 
    return { success: false, message: "Failed to fetch variant." };
  }
};

// Create a new variant
export const createVariant = async (data: VariantData) => {
  try {
    const validatedData = variantSchema.parse(data);
    await connectToDatabase();
    const newVariant = new Variant(validatedData);
    await newVariant.save();
    revalidatePath("/admin/variants");
    return { success: true, data: JSON.parse(JSON.stringify(newVariant)), message: "Variant created successfully!" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Failed to create variant:", error);
    return { success: false, message: "Failed to create variant." };
  }
};

// Update an existing variant
export const updateVariant = async (id: string, data: VariantData) => {
  try {
    const validatedData = variantSchema.parse(data);
    await connectToDatabase();
    const updatedVariant = await Variant.findByIdAndUpdate(
      id,
      validatedData,
      { new: true }
    );
    if (!updatedVariant) {
      return { success: false, message: "Variant not found." };
    }
    revalidatePath("/admin/variants");
    revalidatePath(`/admin/variants/${id}`);
    return { success: true, data: JSON.parse(JSON.stringify(updatedVariant)), message: "Variant updated successfully!" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Failed to update variant:", error);
    return { success: false, message: "Failed to update variant." };
  }
};

// Delete a variant
export const deleteVariant = async (id: string) => {
  try {
    await connectToDatabase();
    const deletedVariant = await Variant.findByIdAndDelete(id);
    if (!deletedVariant) {
      return { success: false, message: "Variant not found." };
    }
    revalidatePath("/admin/variants");
    return { success: true, message: "Variant deleted successfully!" };
  } catch (error) {
    console.error("Failed to delete variant:", error);
    return { success: false, message: "Failed to delete variant." };
  }
};

// ✅ NEW: Fetch all variants for a given product ID
export const getVariantsByProductId = async (productId: string) => {
  try {
    await connectToDatabase();
    // Fetch variants and populate the unit to get its name
    const variants = await Variant.find({ product: productId }).populate('unit').lean();
    return { success: true, data: JSON.parse(JSON.stringify(variants)) };
  } catch (error) {
    console.error("Failed to fetch variants by product ID:", error);
    return { success: false, message: "Failed to fetch variants." };
  }
};

export const getLowStockVariants = async () => {
  try {
    await connectToDatabase();
    
    // Core logic: find where stockQuantity is <= stockAlertQuantity
    const lowStockVariants = await Variant.find({
      $expr: { $lte: ["$stockQuantity", "$stockAlertQuantity"] }
    })
    .populate("product unit") // Populate product and unit
    // ❌ FIX 2: Use the new local interface to enforce type safety
    .lean<LowStockVariantLean[]>(); 
    
    // Structure the data for the frontend
    // The type for 'variant' is now inferred from the lean call, resolving the 'any' error.
    const alertData: LowStockAlertData[] = lowStockVariants.map((variant) => {
        
        let productName: string;
        
        // 💡 FIX: Check if product is populated and has a name. 
        // If not, use productCode (e.g., EO0002) as the fallback.
        if (variant.product && variant.product.name) {
            productName = variant.product.name;
        } else if (variant.product && variant.product.productCode) {
            // Assuming your Product model has a 'productCode' field
            productName = variant.product.productCode; 
        } else {
            productName = 'Product Code Missing'; 
        }

        return {
            _id: variant._id.toString(),
            productName: productName, // Use the determined name/code
            variantVolume: variant.variantVolume,
            // Assuming populated unit has a 'name' field
            unit: variant.unit.name || 'Unit', 
            stockQuantity: variant.stockQuantity,
            stockAlertQuantity: variant.stockAlertQuantity,
            variantColor: variant.variantColor || 'N/A'
        };
    });

    return { success: true, data: JSON.parse(JSON.stringify(alertData)) };
  } catch (error) {
    console.error("Failed to fetch low stock variants:", error);
    return { success: false, message: "Failed to fetch low stock variants." };
  }
};

// 💡 NEW FUNCTION: Get the total StockQuantity used for a specific packing capacity
export const getUsedPackingMaterialQuantity = async (volume: number, unitId: string): Promise<{ success: boolean; data: number; message?: string; }> => {
  try {
    await connectToDatabase();

    // Find all variants that use this specific volume and unit
    const variants = await Variant.find({
      variantVolume: volume,
      unit: unitId,
    }).select('stockQuantity').lean();

    // Sum up the stockQuantity of all matching variants
    const totalUsedQuantity = variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);

    return { success: true, data: totalUsedQuantity };
  } catch (error) {
    console.error("Failed to calculate used packing quantity:", error);
    return { success: false, data: 0, message: "Failed to calculate used packing quantity." };
  }
};


// ====================================================================
// ✅ NEW: DYNAMIC STOCK UPDATE FUNCTIONALITY
// ====================================================================

/**
 * Updates the stock quantity for multiple product variants in a single bulk operation
 * by decrementing the stockQuantity after a successful sale.
 * @param items Array of { variantId, quantity } sold to be decremented from stock.
 * @returns An object indicating success or failure.
 */
export async function updateStockQuantitiesInDB(items: StockUpdateItem[]) {
  try {
    await connectToDatabase();

    if (items.length === 0) {
        return { success: true, message: "No items to update." };
    }

    // Use bulkWrite to perform multiple atomic updates efficiently
    const bulkOperations = items.map(item => ({
      updateOne: {
        // Find the variant by its ID
        filter: { _id: item.variantId },
        // Use $inc with a negative value to decrement (reduce) the stockQuantity
        update: { $inc: { stockQuantity: -item.quantity } },
      },
    }));

    const result = await Variant.bulkWrite(bulkOperations);

    const modifiedCount = result.modifiedCount;

    // Optional: Revalidate POS product list to reflect new stock immediately
    revalidatePath("/pos"); 

    return { success: true, message: `Successfully reduced stock for ${modifiedCount} variants.` };
  } catch (error) {
    console.error("❌ Database error during stock update:", error);
    return { 
      success: false, 
      message: `Failed to update stocks: ${error instanceof Error ? error.message : "An unknown database error occurred"}` 
    };
  }
}