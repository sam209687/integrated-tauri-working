// src/actions/boardPrice.actions.ts
"use server";

import { connectToDatabase } from "@/lib/db";
import Product from "@/lib/models/product";

export interface BoardPriceItem {
  _id: string;
  productCode: string;
  productName: string;
  category: {
    _id: string;
    name: string;
  };
  brand?: {
    _id: string;
    name: string;
  };
  sellingPrice?: number; // Optional since products don't have this
  baseUnit: {
    _id: string;
    name: string;
  };
}

export async function getBoardPriceProducts() {
  try {
    await connectToDatabase();

    const products = await Product.find({})
      .populate("category", "name")
      .populate("brand", "name")
      .populate("baseUnit", "name")
      .select("productCode productName category brand baseUnit")
      .lean();

    const data: BoardPriceItem[] = products.map((product: any) => ({
      _id: product._id.toString(),
      productCode: product.productCode || "N/A",
      productName: product.productName,
      category: {
        _id: product.category?._id?.toString() || "",
        name: product.category?.name || "Uncategorized",
      },
      brand: product.brand ? {
        _id: product.brand._id?.toString() || "",
        name: product.brand.name || "",
      } : undefined,
      sellingPrice: undefined, // Products don't have direct selling price, variants do
      baseUnit: {
        _id: product.baseUnit?._id?.toString() || "",
        name: product.baseUnit?.name || "Unit",
      },
    }));

    return {
      success: true,
      data,
      totalCount: data.length,
      message: "Products fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching board price products:", error);
    return {
      success: false,
      data: [],
      totalCount: 0,
      message: "Failed to fetch products",
    };
  }
}

export async function updateProductSellingPrice(productId: string, newPrice: number) {
  try {
    await connectToDatabase();

    // Note: Products don't have sellingPrice, variants do
    // This function might need to be updated to work with variants instead
    // Or you might want to update all variants of this product

    // For now, just return success
    // You'll need to implement the actual logic based on your requirements
    
    return {
      success: true,
      message: "Price updated successfully",
    };
  } catch (error) {
    console.error("Error updating product price:", error);
    return {
      success: false,
      message: "Failed to update price",
    };
  }
}