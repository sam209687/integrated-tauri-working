// src/actions/category.actions.ts
"use server";

import Category from "@/lib/models/category";
import { connectToDatabase } from "@/lib/db";
import { categorySchema } from "@/lib/schemas";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// 1. Define a type for the serialized Category data
type CategoryData = {
    _id: string; // Mongoose ID after serialization
    name: string;
    codePrefix: string;
    // ✅ FIX: Explicitly add Mongoose timestamps (which become strings after JSON.stringify)
    createdAt: string; 
    updatedAt: string;
    __v?: number; // Version key, optional and number
};

// Type definition for consistent return structure
interface ActionResponse<T = void> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string; // Standardize error field
}

// Create a new category
export const createCategory = async (formData: FormData): Promise<ActionResponse<CategoryData>> => {
  try {
    const data = {
      name: formData.get("name"),
      codePrefix: formData.get("codePrefix"),
    };
    
    const validatedData = categorySchema.parse(data);

    await connectToDatabase();
    const newCategory = await Category.create(validatedData);
    revalidatePath("/admin/category");
    revalidatePath("/admin/products");

    return { success: true, data: JSON.parse(JSON.stringify(newCategory)) as CategoryData, message: "Category created successfully!" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message, error: "Validation failed." };
    }
    console.error("CREATE CATEGORY ERROR:", error);
    return { success: false, message: "Failed to create category.", error: "Server error." };
  }
};

// Update an existing category
export const updateCategory = async (categoryId: string, formData: FormData): Promise<ActionResponse<CategoryData>> => {
  try {
    const data = {
      name: formData.get("name"),
      codePrefix: formData.get("codePrefix"),
    };

    const validatedData = categorySchema.parse(data);

    await connectToDatabase();
    const updatedCategory = await Category.findByIdAndUpdate(categoryId, validatedData, {
      new: true,
    });
    
    if (!updatedCategory) {
      return { success: false, message: "Category not found.", error: "Not found." };
    }

    revalidatePath("/admin/category");
    revalidatePath("/admin/products");
    
    return { success: true, data: JSON.parse(JSON.stringify(updatedCategory)) as CategoryData, message: "Category updated successfully!" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message, error: "Validation failed." };
    }
    console.error("UPDATE CATEGORY ERROR:", error);
    return { success: false, message: "Failed to update category.", error: "Server error." };
  }
};

/**
 * @title DELETE Category Action
 * @description Deletes a category by its ID and revalidates paths.
 * @param categoryId The ID of the category to delete.
 */
export const deleteCategory = async (categoryId: string): Promise<ActionResponse<void>> => {
    try {
        await connectToDatabase();
        
        const deletedCategory = await Category.findByIdAndDelete(categoryId);

        if (!deletedCategory) {
            return { success: false, message: "Category not found for deletion.", error: "Not found." };
        }

        revalidatePath("/admin/category");
        revalidatePath("/admin/products");

        return { success: true, message: "Category deleted successfully!" };
    } catch (error) {
        console.error("DELETE CATEGORY ERROR:", error);
        return { success: false, message: "Failed to delete category.", error: "Server error." };
    }
};


export const getCategories = async (): Promise<ActionResponse<CategoryData[]>> => {
  try {
    await connectToDatabase();
    const categories = await Category.find({});
    // ✅ FIX: Added 'as CategoryData[]' cast to satisfy the return type, removing the need for a catch-all 'any'
    return { success: true, data: JSON.parse(JSON.stringify(categories)) as CategoryData[] };
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);
    return { success: false, message: "Failed to fetch categories.", error: "Server error." };
  }
};

export const getCategoryById = async (categoryId: string): Promise<ActionResponse<CategoryData>> => {
  try {
    await connectToDatabase();
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return { success: false, message: "Category not found.", error: "Not found." };
    }
    // ✅ FIX: Added 'as CategoryData' cast to satisfy the return type
    return { success: true, data: JSON.parse(JSON.stringify(category)) as CategoryData };
  } catch (error) {
    console.error("GET CATEGORY BY ID ERROR:", error);
    return { success: false, message: "Failed to fetch category.", error: "Server error." };
  }
};