// src/actions/boardPrice.actions.ts
"use server";

import { connectToDatabase } from "@/lib/db";
import Variant from "@/lib/models/variant";
import Product from "@/lib/models/product";
import Category from "@/lib/models/category";
import { revalidatePath } from "next/cache";

export interface BoardPriceItem {
  _id: string;
  productName: string;
  categoryName?: string;
  productCode: string;
  baseUnit: { _id: string; name: string } | null;
  sellingPrice: number;
}

/**
 * ✅ NEW: Get edible oil category ID
 */
async function getEdibleOilCategoryId(): Promise<string | null> {
  try {
    const edibleOilCategory = await Category.findOne({
      name: { $regex: /edible.*oil/i }
    });
    return edibleOilCategory?._id.toString() || null;
  } catch (error) {
    console.error("❌ Error getting edible oil category:", error);
    return null;
  }
}

/**
 * Get board price products (ONLY Edible Oils - Sesame, Groundnut, etc.)
 */
export async function getBoardPriceProducts() {
  try {
    await connectToDatabase();

    // ✅ Get edible oil category
    const edibleOilCategoryId = await getEdibleOilCategoryId();

    if (!edibleOilCategoryId) {
      return {
        success: true,
        data: [],
        totalCount: 0,
        message: "No edible oil category found"
      };
    }

    // ✅ Get only edible oil products
    const edibleOilProducts = await Product.find({
      category: edibleOilCategoryId
    })
      .populate('category baseUnit')
      .lean();

    if (edibleOilProducts.length === 0) {
      return {
        success: true,
        data: [],
        totalCount: 0,
        message: "No edible oil products found"
      };
    }

    const productIds = edibleOilProducts.map(p => (p._id as any).toString());

    // Get variants for edible oil products only
    const variants = await Variant.find({
      product: { $in: productIds }
    })
      .populate({
        path: 'product',
        populate: { path: 'category baseUnit' }
      })
      .lean();

    const boardPriceItems: BoardPriceItem[] = variants.map((variant: any) => ({
      _id: variant._id.toString(),
      productName: variant.product?.productName || 'Unknown',
      categoryName: variant.product?.category?.name || 'Unknown',
      productCode: variant.product?.productCode || 'N/A',
      baseUnit: variant.product?.baseUnit ? {
        _id: variant.product.baseUnit._id.toString(),
        name: variant.product.baseUnit.name
      } : null,
      sellingPrice: variant.sellingPrice,
    }));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(boardPriceItems)),
      totalCount: boardPriceItems.length
    };
  } catch (error) {
    console.error("❌ Error fetching board prices:", error);
    return {
      success: false,
      message: "Failed to fetch board prices",
      data: [],
      totalCount: 0
    };
  }
}

/**
 * Update product selling price
 */
export async function updateProductSellingPrice(variantId: string, newSellingPrice: number) {
  try {
    await connectToDatabase();

    const variant = await Variant.findById(variantId);
    
    if (!variant) {
      return {
        success: false,
        message: "Product variant not found"
      };
    }

    variant.sellingPrice = newSellingPrice;
    await variant.save();

    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: "Selling price updated successfully"
    };
  } catch (error) {
    console.error("❌ Error updating selling price:", error);
    return {
      success: false,
      message: "Failed to update selling price"
    };
  }
}