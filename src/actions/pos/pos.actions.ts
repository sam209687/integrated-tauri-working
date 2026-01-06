// src/actions/pos/pos.actions.ts
"use server";

import { connectToDatabase } from "@/lib/db";
import Variant from "@/lib/models/variant";
import type { IPosVariant } from "@/types/pos.type";
// import type { IPosVariant } from "@/types/pos.types";

/* ------------------------------------------------------------------ */
/* HELPER */
/* ------------------------------------------------------------------ */

function toPlainObject<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/* ------------------------------------------------------------------ */
/* GET VARIANTS FOR POS */
/* ------------------------------------------------------------------ */

export const getVariantsForPOS = async () => {
  try {
    await connectToDatabase();

    const variants = await Variant.find({})
      .populate({
        path: "product",
        populate: [
          { path: "category", select: "name" },
          { path: "brand", select: "name" },
          { path: "tax", select: "gst hsn" },
        ],
        select: "productName productCode category brand tax",
      })
      .populate("unit", "name")
      .select(
        "product variantVolume unit sellingPrice purchasePrice mrp discount stockQuantity stockAlertQuantity variantColor image qrCode packingCharges laborCharges electricityCharges others1 others2 createdAt updatedAt"
      )
      .lean();

    if (!variants || variants.length === 0) {
      return {
        success: true,
        data: [],
        message: "No variants found.",
      };
    }

    // Map variants to IPosVariant format
    const mappedVariants: IPosVariant[] = variants.map((variant: any) => {
      const sellingPrice = variant.sellingPrice || 0;
      const variantVolume = variant.variantVolume || 1;
      
      return {
        _id: variant._id.toString(),
        product: {
          _id: variant.product?._id?.toString() || "",
          productName: variant.product?.productName || "Unknown Product",
          productCode: variant.product?.productCode || "",
          brand: variant.product?.brand
            ? {
                _id: variant.product.brand._id?.toString() || "",
                name: variant.product.brand.name || "",
              }
            : undefined,
          category: variant.product?.category
            ? {
                _id: variant.product.category._id?.toString() || "",
                name: variant.product.category.name || "",
              }
            : undefined,
          tax: variant.product?.tax
            ? {
                _id: variant.product.tax._id?.toString() || "",
                gst: variant.product.tax.gst || 0,
                hsn: variant.product.tax.hsn || "",
              }
            : undefined,
        },
        variantVolume,
        unit: {
          _id: variant.unit?._id?.toString() || "",
          name: variant.unit?.name || "Unit",
        },
        variantColor: variant.variantColor,
        
        // Price calculations
        price: sellingPrice,
        sellingPrice: sellingPrice,
        perUnitPrice: variantVolume > 0 ? sellingPrice / variantVolume : 0,
        
        mrp: variant.mrp,
        discount: variant.discount,
        stockQuantity: variant.stockQuantity || 0,
        stockAlertQuantity: variant.stockAlertQuantity || 0,
        
        // Media
        image: variant.image,
        qrCode: variant.qrCode,
        
        // Charges
        packingCharges: variant.packingCharges || 0,
        laborCharges: variant.laborCharges || 0,
        electricityCharges: variant.electricityCharges || 0,
        others1: variant.others1 || 0,
        others2: variant.others2 || 0,
        
        // Timestamps
        createdAt: variant.createdAt?.toString(),
        updatedAt: variant.updatedAt?.toString(),
      };
    });

    return {
      success: true,
      data: toPlainObject(mappedVariants),
      message: "Variants fetched successfully.",
    };
  } catch (error) {
    console.error("❌ Error fetching variants for POS:", error);
    return {
      success: false,
      data: [],
      message: "Failed to fetch variants for POS.",
    };
  }
};

// Export type for use in other files
export type { IPosVariant };