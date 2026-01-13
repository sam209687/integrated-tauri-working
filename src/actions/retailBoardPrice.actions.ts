// src/actions/retailBoardPrice.actions.ts
"use server";

import { connectToDatabase } from "@/lib/db";
import Variant from "@/lib/models/variant";
import Product from "@/lib/models/product";
import Category from "@/lib/models/category";
import { revalidatePath } from "next/cache";

// ✅ Retail product item for board price
export interface RetailBoardPriceItem {
  _id: string;
  productName: string;
  categoryName: string;
  productCode: string;
  baseUnit: { _id: string; name: string } | null;
  sellingPrice: number;
  purchasePrice: number;
  profit: number;
  profitPercentage: number;
  lastPurchaseDate?: Date;
  nextPurchaseDate?: Date;
  purchaseFrequency?: 'daily' | 'weekly' | 'monthly';
  stockQuantity: number;
}

// ✅ Category-wise purchase summary
export interface CategoryPurchaseSummary {
  categoryName: string;
  totalPurchasePrice: number;
  totalSellingPrice: number;
  totalProfit: number;
  profitPercentage: number;
  itemCount: number;
  lastPurchaseDate?: Date;
  nextPurchaseDate?: Date;
  items: RetailBoardPriceItem[];
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
    console.error("❌ Error getting retail categories:", error);
    return [];
  }
}

/**
 * Get all retail products for board price (excluding edible oils)
 */
export async function getRetailBoardPriceProducts() {
  try {
    await connectToDatabase();

    const retailCategoryIds = await getRetailCategories();

    if (retailCategoryIds.length === 0) {
      return {
        success: true,
        data: [],
        totalCount: 0,
        message: "No retail categories found"
      };
    }

    // Get all products in retail categories
    const products = await Product.find({
      category: { $in: retailCategoryIds }
    })
      .populate('category baseUnit')
      .lean();

    if (products.length === 0) {
      return {
        success: true,
        data: [],
        totalCount: 0,
        message: "No retail products found"
      };
    }

    const productIds = products.map(p => (p._id as any).toString());

    // Get variants for these products
    const variants = await Variant.find({
      product: { $in: productIds }
    })
      .populate({
        path: 'product',
        populate: { path: 'category baseUnit' }
      })
      .lean();

    // Transform to board price items
    const boardPriceItems: RetailBoardPriceItem[] = variants.map((variant: any) => {
      const profit = variant.sellingPrice - variant.purchasePrice;
      const profitPercentage = variant.purchasePrice > 0 
        ? (profit / variant.purchasePrice) * 100 
        : 0;

      return {
        _id: variant._id.toString(),
        productName: variant.product?.productName || 'Unknown',
        categoryName: variant.product?.category?.name || 'Unknown',
        productCode: variant.product?.productCode || 'N/A',
        baseUnit: variant.product?.baseUnit ? {
          _id: variant.product.baseUnit._id.toString(),
          name: variant.product.baseUnit.name
        } : null,
        sellingPrice: variant.sellingPrice,
        purchasePrice: variant.purchasePrice,
        profit,
        profitPercentage,
        lastPurchaseDate: variant.lastPurchaseDate,
        nextPurchaseDate: variant.nextPurchaseDate,
        purchaseFrequency: variant.purchaseFrequency,
        stockQuantity: variant.stockQuantity,
      };
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(boardPriceItems)),
      totalCount: boardPriceItems.length
    };
  } catch (error) {
    console.error("❌ Error fetching retail board prices:", error);
    return {
      success: false,
      message: "Failed to fetch retail board prices",
      data: [],
      totalCount: 0
    };
  }
}

/**
 * Get category-wise purchase summary
 */
export async function getCategoryPurchaseSummary() {
  try {
    await connectToDatabase();

    const result = await getRetailBoardPriceProducts();
    
    if (!result.success || !result.data) {
      return {
        success: false,
        message: "Failed to get purchase data",
        data: []
      };
    }

    const items = result.data as RetailBoardPriceItem[];

    // Group by category
    const categoryMap = new Map<string, RetailBoardPriceItem[]>();
    
    items.forEach(item => {
      const existing = categoryMap.get(item.categoryName) || [];
      existing.push(item);
      categoryMap.set(item.categoryName, existing);
    });

    // Calculate summaries
    const summaries: CategoryPurchaseSummary[] = Array.from(categoryMap.entries()).map(
      ([categoryName, categoryItems]) => {
        const totalPurchasePrice = categoryItems.reduce((sum, item) => sum + item.purchasePrice, 0);
        const totalSellingPrice = categoryItems.reduce((sum, item) => sum + item.sellingPrice, 0);
        const totalProfit = totalSellingPrice - totalPurchasePrice;
        const profitPercentage = totalPurchasePrice > 0 
          ? (totalProfit / totalPurchasePrice) * 100 
          : 0;

        // Get latest and earliest dates
        const dates = categoryItems
          .map(item => item.nextPurchaseDate)
          .filter(d => d != null) as Date[];
        
        const nextPurchaseDate = dates.length > 0 
          ? new Date(Math.min(...dates.map(d => d.getTime())))
          : undefined;

        return {
          categoryName,
          totalPurchasePrice,
          totalSellingPrice,
          totalProfit,
          profitPercentage,
          itemCount: categoryItems.length,
          nextPurchaseDate,
          items: categoryItems.sort((a, b) => a.productName.localeCompare(b.productName))
        };
      }
    );

    // Sort by category name
    summaries.sort((a, b) => a.categoryName.localeCompare(b.categoryName));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(summaries))
    };
  } catch (error) {
    console.error("❌ Error getting purchase summary:", error);
    return {
      success: false,
      message: "Failed to get purchase summary",
      data: []
    };
  }
}

/**
 * Update selling price for a retail product variant
 */
export async function updateRetailProductPrice(variantId: string, newSellingPrice: number) {
  try {
    await connectToDatabase();

    const variant = await Variant.findById(variantId);
    
    if (!variant) {
      return {
        success: false,
        message: "Variant not found"
      };
    }

    variant.sellingPrice = newSellingPrice;
    await variant.save();

    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: "Price updated successfully"
    };
  } catch (error) {
    console.error("❌ Error updating retail price:", error);
    return {
      success: false,
      message: "Failed to update price"
    };
  }
}

/**
 * Update purchase details for a variant
 */
export async function updatePurchaseDetails(
  variantId: string,
  data: {
    lastPurchaseDate?: Date;
    nextPurchaseDate?: Date;
    purchaseFrequency?: 'daily' | 'weekly' | 'monthly';
    purchasePrice?: number;
    stockQuantity?: number; // Add new stock
  }
) {
  try {
    await connectToDatabase();

    const variant = await Variant.findById(variantId);
    
    if (!variant) {
      return {
        success: false,
        message: "Variant not found"
      };
    }

    // Update purchase tracking
    if (data.lastPurchaseDate) variant.lastPurchaseDate = data.lastPurchaseDate;
    if (data.nextPurchaseDate) variant.nextPurchaseDate = data.nextPurchaseDate;
    if (data.purchaseFrequency) variant.purchaseFrequency = data.purchaseFrequency;
    if (data.purchasePrice) variant.purchasePrice = data.purchasePrice;
    
    // Add new stock to existing
    if (data.stockQuantity && data.stockQuantity > 0) {
      variant.stockQuantity += data.stockQuantity;
    }

    await variant.save();

    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: "Purchase details updated successfully"
    };
  } catch (error) {
    console.error("❌ Error updating purchase details:", error);
    return {
      success: false,
      message: "Failed to update purchase details"
    };
  }
}

export async function updateVariantStock(
  updates: { variantId: string; addStock: number }[]
) {
  try {
    await connectToDatabase();

    const updatePromises = updates.map(async ({ variantId, addStock }) => {
      const variant = await Variant.findById(variantId);
      if (!variant) {
        throw new Error(`Variant ${variantId} not found`);
      }

      // Add to existing stock
      variant.stockQuantity = (variant.stockQuantity || 0) + addStock;
      
      // Update last purchase date
      variant.lastPurchaseDate = new Date();

      await variant.save();
      
      return {
        variantId,
        newStock: variant.stockQuantity
      };
    });

    const results = await Promise.all(updatePromises);

    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Successfully updated ${results.length} variants`,
      data: results
    };
  } catch (error) {
    console.error('❌ Error updating variant stock:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update stock',
      data: null
    };
  }
}

/**
 * Update variant prices (bulk update)
 */
export async function updateVariantPrices(
  updates: { variantId: string; purchasePrice?: number; sellingPrice?: number }[]
) {
  try {
    await connectToDatabase();

    const updatePromises = updates.map(async ({ variantId, purchasePrice, sellingPrice }) => {
      const variant = await Variant.findById(variantId);
      if (!variant) {
        throw new Error(`Variant ${variantId} not found`);
      }

      // Update prices if provided
      if (purchasePrice !== undefined) {
        variant.purchasePrice = purchasePrice;
      }
      if (sellingPrice !== undefined) {
        variant.sellingPrice = sellingPrice;
      }

      await variant.save();
      
      return {
        variantId,
        purchasePrice: variant.purchasePrice,
        sellingPrice: variant.sellingPrice
      };
    });

    const results = await Promise.all(updatePromises);

    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Successfully updated ${results.length} variant prices`,
      data: results
    };
  } catch (error) {
    console.error('❌ Error updating variant prices:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update prices',
      data: null
    };
  }
}