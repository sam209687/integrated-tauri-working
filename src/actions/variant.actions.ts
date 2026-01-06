// src/actions/variant.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import Variant, { IPopulatedVariant } from "@/lib/models/variant";
import { variantSchema } from "@/lib/schemas";
import { z } from "zod";
import { Types } from "mongoose";

/* ------------------------------------------------------------------ */
/* HELPER */
/* ------------------------------------------------------------------ */

function toPlainObject<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/* ------------------------------------------------------------------ */
/* TYPES */
/* ------------------------------------------------------------------ */

interface StockUpdateItem {
  variantId: string | Types.ObjectId;
  quantity: number;
}

export interface VariantData {
  product: string;
  variantVolume: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  discount: number;
  stockQuantity: number;
  stockAlertQuantity: number;
  variantColor?: string;
  image?: string;
  qrCode?: string;
  packingCharges: number;
  laborCharges: number;
  electricityCharges: number;
  others1: number;
  others2: number;
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

/* ------------------------------------------------------------------ */
/* LEAN POPULATED TYPES */
/* ------------------------------------------------------------------ */

interface ProductLean {
  productName?: string;
  productCode?: string;
  sellingTypes?: string[];
}

interface UnitLean {
  name?: string;
}

interface LowStockVariantLean {
  _id: Types.ObjectId;
  product: ProductLean;
  unit: UnitLean;
  variantVolume: number;
  stockQuantity: number;
  stockAlertQuantity: number;
  variantColor?: string;
}

/* ------------------------------------------------------------------ */
/* FETCH ALL VARIANTS */
/* ------------------------------------------------------------------ */

export const getVariants = async () => {
  try {
    await connectToDatabase();

    const variants = await Variant.find({})
      .populate({
        path: "product",
        populate: { path: "category brand tax baseUnit" }
      })
      .populate("unit")
      .lean();

    return {
      success: true,
      data: toPlainObject(variants) as unknown as IPopulatedVariant[],
    };
  } catch (error) {
    console.error("❌ Failed to fetch variants:", error);
    return { success: false, message: "Failed to fetch variants." };
  }
};

/* ------------------------------------------------------------------ */
/* FETCH VARIANT BY ID */
/* ------------------------------------------------------------------ */

export const getVariantById = async (id: string) => {
  try {
    await connectToDatabase();

    const variant = await Variant.findById(id)
      .populate({
        path: "product",
        populate: { path: "category brand tax baseUnit" }
      })
      .populate("unit")
      .lean();

    if (!variant) {
      return { success: false, message: "Variant not found." };
    }

    return {
      success: true,
      data: toPlainObject(variant) as unknown as IPopulatedVariant,
    };
  } catch (error) {
    console.error("❌ Failed to fetch variant:", error);
    return { success: false, message: "Failed to fetch variant." };
  }
};

/* ------------------------------------------------------------------ */
/* CREATE VARIANT */
/* ------------------------------------------------------------------ */

export const createVariant = async (data: VariantData) => {
  try {
    const validatedData = variantSchema.parse(data);
    await connectToDatabase();

    const newVariant = new Variant(validatedData);
    await newVariant.save();

    revalidatePath("/admin/variants");

    return {
      success: true,
      data: toPlainObject(newVariant.toObject()) as unknown as IPopulatedVariant,
      message: "Variant created successfully!",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("❌ Failed to create variant:", error);
    return { success: false, message: "Failed to create variant." };
  }
};

/* ------------------------------------------------------------------ */
/* UPDATE VARIANT */
/* ------------------------------------------------------------------ */

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

    return {
      success: true,
      data: toPlainObject(updatedVariant.toObject()) as unknown as IPopulatedVariant,
      message: "Variant updated successfully!",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("❌ Failed to update variant:", error);
    return { success: false, message: "Failed to update variant." };
  }
};

/* ------------------------------------------------------------------ */
/* DELETE VARIANT */
/* ------------------------------------------------------------------ */

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
    console.error("❌ Failed to delete variant:", error);
    return { success: false, message: "Failed to delete variant." };
  }
};

/* ------------------------------------------------------------------ */
/* FETCH VARIANTS BY PRODUCT */
/* ------------------------------------------------------------------ */

export const getVariantsByProductId = async (productId: string) => {
  try {
    await connectToDatabase();

    const variants = await Variant.find({ product: productId })
      .populate("unit")
      .lean();

    return {
      success: true,
      data: toPlainObject(variants) as unknown as IPopulatedVariant[],
    };
  } catch (error) {
    console.error("❌ Failed to fetch variants by product ID:", error);
    return { success: false, message: "Failed to fetch variants." };
  }
};

/* ------------------------------------------------------------------ */
/* LOW STOCK VARIANTS */
/* ------------------------------------------------------------------ */

export const getLowStockVariants = async () => {
  try {
    await connectToDatabase();

    const lowStockVariants = await Variant.find({
      $expr: { $lte: ["$stockQuantity", "$stockAlertQuantity"] },
    })
      .populate("product unit")
      .lean<LowStockVariantLean[]>();

    const alertData: LowStockAlertData[] = lowStockVariants.map((variant) => ({
      _id: variant._id.toString(),
      productName:
        variant.product?.productName ||
        variant.product?.productCode ||
        "Unknown Product",
      variantVolume: variant.variantVolume,
      unit: variant.unit?.name || "Unit",
      stockQuantity: variant.stockQuantity,
      stockAlertQuantity: variant.stockAlertQuantity,
      variantColor: variant.variantColor || "N/A",
    }));

    return {
      success: true,
      data: toPlainObject(alertData),
    };
  } catch (error) {
    console.error("❌ Failed to fetch low stock variants:", error);
    return { success: false, message: "Failed to fetch low stock variants." };
  }
};

/* ------------------------------------------------------------------ */
/* PACKING MATERIAL USAGE */
/* ------------------------------------------------------------------ */

export const getUsedPackingMaterialQuantity = async (
  volume: number,
  unitId: string
) => {
  try {
    await connectToDatabase();

    const variants = await Variant.find({
      variantVolume: volume,
      unit: unitId,
    })
      .select("stockQuantity")
      .lean();

    const totalUsedQuantity = variants.reduce(
      (sum, v: any) => sum + v.stockQuantity,
      0
    );

    return { success: true, data: totalUsedQuantity };
  } catch (error) {
    console.error("❌ Failed to calculate used packing quantity:", error);
    return {
      success: false,
      data: 0,
      message: "Failed to calculate used packing quantity.",
    };
  }
};

/* ------------------------------------------------------------------ */
/* BULK STOCK UPDATE (POS) */
/* ------------------------------------------------------------------ */

export async function updateStockQuantitiesInDB(items: StockUpdateItem[]) {
  try {
    await connectToDatabase();

    if (!items.length) {
      return { success: true, message: "No items to update." };
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.variantId },
        update: { $inc: { stockQuantity: -item.quantity } },
      },
    }));

    const result = await Variant.bulkWrite(bulkOps);

    revalidatePath("/pos");

    return {
      success: true,
      message: `Stock updated for ${result.modifiedCount} variants.`,
    };
  } catch (error) {
    console.error("❌ Stock update failed:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unknown stock update error",
    };
  }
}