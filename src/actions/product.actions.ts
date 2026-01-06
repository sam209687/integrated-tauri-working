// src/actions/product.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { generateProductCode } from "@/lib/generate-prod-code";
import { connectToDatabase } from "@/lib/db";

import Product, { IProduct, IPopulatedProduct } from "@/lib/models/product";
import Category, { ICategory } from "@/lib/models/category";
import Brand, { IBrand } from "@/lib/models/brand";
import Tax, { ITax } from "@/lib/models/tax";
import Unit, { IUnit } from "@/lib/models/unit";

import { getCategoryById } from "./category.actions";
import { productSchema } from "@/lib/schemas";
import { z } from "zod";

// Ensure models are registered
import "@/lib/models/brand";
import "@/lib/models/category";
import "@/lib/models/tax";
import "@/lib/models/unit";

/* -------------------------------------------------------------------------- */
/*                                HELPERS                                     */
/* -------------------------------------------------------------------------- */

function toPlainObject<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface ProductData {
  category: string;
  brand: string;
  productCode?: string;
  productName: string;
  description?: string;
  tax?: string;
  sellingTypes: ("FIXED" | "WEIGHT" | "VOLUME" | "VALUE")[];
  baseUnit: string;
  allowLooseSale: boolean;
}

/* -------------------------------------------------------------------------- */
/*                           PRODUCT CODE GENERATOR                            */
/* -------------------------------------------------------------------------- */

export const generateProductCodeForUI = async (categoryId: string) => {
  try {
    const categoryResult = await getCategoryById(categoryId);

    if (
      !categoryResult.success ||
      !categoryResult.data ||
      !categoryResult.data.codePrefix
    ) {
      return {
        success: false,
        message: "Category not found or missing code prefix",
      };
    }

    const code = await generateProductCode(categoryResult.data.codePrefix);
    return { success: true, data: code };
  } catch (error) {
    console.error("Product code generation failed:", error);
    return { success: false, message: "Failed to generate product code" };
  }
};

/* -------------------------------------------------------------------------- */
/*                              MASTER FETCHERS                                */
/* -------------------------------------------------------------------------- */

export const getCategories = async () => {
  try {
    await connectToDatabase();
    const categories = await Category.find({}).lean();
    return { 
      success: true, 
      data: toPlainObject(categories) as unknown as ICategory[]
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to fetch categories" };
  }
};

export const getBrands = async () => {
  try {
    await connectToDatabase();
    const brands = await Brand.find({}).lean();
    return { 
      success: true, 
      data: toPlainObject(brands) as unknown as IBrand[]
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to fetch brands" };
  }
};

export const getTaxes = async () => {
  try {
    await connectToDatabase();
    const taxes = await Tax.find({}).lean();
    return { 
      success: true, 
      data: toPlainObject(taxes) as unknown as ITax[]
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to fetch taxes" };
  }
};

export const getUnits = async () => {
  try {
    await connectToDatabase();
    const units = await Unit.find({}).lean();
    return { 
      success: true, 
      data: toPlainObject(units) as unknown as IUnit[]
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to fetch units" };
  }
};

export const getUnitsForSellingType = async (
  sellingType: "FIXED" | "WEIGHT" | "VOLUME" | "VALUE"
) => {
  try {
    await connectToDatabase();
    
    const unitTypeMap = {
      WEIGHT: ["grams", "kg", "g", "kilogram"],
      VOLUME: ["ml", "liter", "litre", "l"],
      FIXED: ["pieces", "nos", "pcs", "box", "packet"],
      VALUE: ["rupees", "rs", "₹", "currency"]
    };

    const searchTerms = unitTypeMap[sellingType] || [];
    
    const units = await Unit.find({
      name: { $in: searchTerms.map(t => new RegExp(t, 'i')) }
    }).lean();

    return { 
      success: true, 
      data: toPlainObject(units) as unknown as IUnit[]
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to fetch units for selling type" };
  }
};

/* -------------------------------------------------------------------------- */
/*                                PRODUCT CRUD                                 */
/* -------------------------------------------------------------------------- */

export const getProducts = async () => {
  try {
    await connectToDatabase();
    const products = await Product.find({})
      .populate("category brand tax baseUnit")
      .lean();

    return {
      success: true,
      data: toPlainObject(products) as unknown as IPopulatedProduct[],
    };
  } catch (error) {
    console.error("Fetch products failed:", error);
    return { success: false, message: "Failed to fetch products" };
  }
};

export const getProductById = async (id: string) => {
  try {
    await connectToDatabase();

    const product = await Product.findById(id)
      .populate("category brand tax baseUnit")
      .lean();

    if (!product) {
      return { success: false, message: "Product not found" };
    }

    return { 
      success: true, 
      data: toPlainObject(product) as unknown as IPopulatedProduct
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to fetch product" };
  }
};

export const createProduct = async (data: ProductData) => {
  try {
    const validated = productSchema.parse(data);
    await connectToDatabase();

    // Auto-generate product code if missing
    if (!validated.productCode) {
      const category = await Category.findById(validated.category);
      if (!category?.codePrefix) {
        throw new Error("Category missing code prefix");
      }
      validated.productCode = await generateProductCode(category.codePrefix);
    }

    const product = new Product(validated);
    await product.save();

    revalidatePath("/admin/products");

    return {
      success: true,
      data: toPlainObject(product.toObject()) as unknown as IProduct,
      message: "Product created successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Create product failed:", error);
    return { success: false, message: "Failed to create product" };
  }
};

export const updateProduct = async (id: string, data: ProductData) => {
  try {
    const validated = productSchema.parse(data);
    await connectToDatabase();

    const updated = await Product.findByIdAndUpdate(id, validated, {
      new: true,
    });

    if (!updated) {
      return { success: false, message: "Product not found" };
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);

    return {
      success: true,
      data: toPlainObject(updated.toObject()) as unknown as IProduct,
      message: "Product updated successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error(error);
    return { success: false, message: "Failed to update product" };
  }
};

export const deleteProduct = async (id: string) => {
  try {
    await connectToDatabase();

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return { success: false, message: "Product not found" };
    }

    revalidatePath("/admin/products");

    return { success: true, message: "Product deleted successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to delete product" };
  }
};