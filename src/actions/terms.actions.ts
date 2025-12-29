// src/actions/terms.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import Terms, { ITerms } from "@/lib/models/terms";
import { termsSchema } from "@/lib/schemas";
import { z } from "zod";

interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

type TermsData = {
  _id: string;
  terms: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Get active terms and conditions
export const getActiveTerms = async (): Promise<ActionResponse<TermsData | null>> => {
  try {
    await connectToDatabase();
    const terms = await Terms.findOne({ isActive: true }).lean();
    
    if (!terms) {
      return { success: true, data: null, message: "No active terms found." };
    }
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(terms)) as TermsData 
    };
  } catch (error) {
    console.error("GET ACTIVE TERMS ERROR:", error);
    return { 
      success: false, 
      message: "Failed to fetch terms and conditions.", 
      error: "Server error." 
    };
  }
};

// Get all terms (for admin management)
export const getAllTerms = async (): Promise<ActionResponse<TermsData[]>> => {
  try {
    await connectToDatabase();
    const terms = await Terms.find({}).sort({ createdAt: -1 }).lean();
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(terms)) as TermsData[] 
    };
  } catch (error) {
    console.error("GET ALL TERMS ERROR:", error);
    return { 
      success: false, 
      message: "Failed to fetch terms and conditions.", 
      error: "Server error.",
      data: []
    };
  }
};

// Get terms by ID
export const getTermsById = async (id: string): Promise<ActionResponse<TermsData>> => {
  try {
    await connectToDatabase();
    const terms = await Terms.findById(id).lean();
    
    if (!terms) {
      return { 
        success: false, 
        message: "Terms not found.", 
        error: "Not found." 
      };
    }
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(terms)) as TermsData 
    };
  } catch (error) {
    console.error("GET TERMS BY ID ERROR:", error);
    return { 
      success: false, 
      message: "Failed to fetch terms and conditions.", 
      error: "Server error." 
    };
  }
};

// Create new terms and conditions
export const createTerms = async (formData: FormData): Promise<ActionResponse<TermsData>> => {
  try {
    const data = {
      terms: formData.get("terms") as string,
      isActive: formData.get("isActive") === "true",
    };
    
    const validatedData = termsSchema.parse(data);
    
    await connectToDatabase();
    const newTerms = await Terms.create(validatedData);
    
    revalidatePath("/admin/terms");
    revalidatePath("/admin/store-settings");
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(newTerms)) as TermsData, 
      message: "Terms and conditions created successfully!" 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        message: error.errors[0].message, 
        error: "Validation failed." 
      };
    }
    console.error("CREATE TERMS ERROR:", error);
    return { 
      success: false, 
      message: "Failed to create terms and conditions.", 
      error: "Server error." 
    };
  }
};

// Update terms and conditions
export const updateTerms = async (
  id: string, 
  formData: FormData
): Promise<ActionResponse<TermsData>> => {
  try {
    const data = {
      terms: formData.get("terms") as string,
      isActive: formData.get("isActive") === "true",
    };
    
    const validatedData = termsSchema.parse(data);
    
    await connectToDatabase();
    const updatedTerms = await Terms.findByIdAndUpdate(
      id,
      validatedData,
      { new: true }
    );
    
    if (!updatedTerms) {
      return { 
        success: false, 
        message: "Terms not found.", 
        error: "Not found." 
      };
    }
    
    revalidatePath("/admin/terms");
    revalidatePath("/admin/store-settings");
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(updatedTerms)) as TermsData, 
      message: "Terms and conditions updated successfully!" 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        message: error.errors[0].message, 
        error: "Validation failed." 
      };
    }
    console.error("UPDATE TERMS ERROR:", error);
    return { 
      success: false, 
      message: "Failed to update terms and conditions.", 
      error: "Server error." 
    };
  }
};

// Delete terms and conditions
export const deleteTerms = async (id: string): Promise<ActionResponse<void>> => {
  try {
    await connectToDatabase();
    
    const deletedTerms = await Terms.findByIdAndDelete(id);
    
    if (!deletedTerms) {
      return { 
        success: false, 
        message: "Terms not found.", 
        error: "Not found." 
      };
    }
    
    revalidatePath("/admin/terms");
    revalidatePath("/admin/store-settings");
    
    return { 
      success: true, 
      message: "Terms and conditions deleted successfully!" 
    };
  } catch (error) {
    console.error("DELETE TERMS ERROR:", error);
    return { 
      success: false, 
      message: "Failed to delete terms and conditions.", 
      error: "Server error." 
    };
  }
};

// Set active terms
export const setActiveTerms = async (id: string): Promise<ActionResponse<void>> => {
  try {
    await connectToDatabase();
    
    // Deactivate all terms
    await Terms.updateMany({}, { isActive: false });
    
    // Activate selected terms
    const updatedTerms = await Terms.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );
    
    if (!updatedTerms) {
      return { 
        success: false, 
        message: "Terms not found.", 
        error: "Not found." 
      };
    }
    
    revalidatePath("/admin/terms");
    revalidatePath("/admin/store-settings");
    
    return { 
      success: true, 
      message: "Active terms updated successfully!" 
    };
  } catch (error) {
    console.error("SET ACTIVE TERMS ERROR:", error);
    return { 
      success: false, 
      message: "Failed to set active terms.", 
      error: "Server error." 
    };
  }
};