// src/actions/oec.actions.ts
"use server";

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import Oec from '@/lib/models/oec';
import Product from '@/lib/models/product';
import { oecSchema } from '@/lib/schemas';
import { z } from 'zod';
import mongoose from 'mongoose';

// Helper function to fetch products for the dropdown
export const getProductsForOec = async () => {
  try {
    await connectToDatabase();
    const products = await Product.find({}, 'productName productCode').sort({ productName: 1 });
    return { success: true, data: JSON.parse(JSON.stringify(products)) };
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return { success: false, message: "Failed to fetch products." };
  }
};

// GET all OECs
export const getOecs = async () => {
  try {
    await connectToDatabase();
    const oecs = await Oec.find({})
      .populate({ path: 'product', select: 'productName productCode' })
      .sort({ createdAt: -1 });
      const validOecs = oecs.filter(oec => oec.product !== null);
    return { success: true, data: JSON.parse(JSON.stringify(validOecs)) };
  } catch (error) {
    console.error("Failed to fetch OECs:", error);
    return { success: false, message: "Failed to fetch OECs." };
  }
};

// GET a single OEC by ID
export const getOecById = async (oecId: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(oecId)) {
      return { success: false, message: "Invalid OEC ID." };
    }
    await connectToDatabase();
    const oec = await Oec.findById(oecId)
      .populate({ path: 'product', select: 'productName productCode' });
      
    if (!oec) {
      return { success: false, message: "OEC not found." };
    }
    return { success: true, data: JSON.parse(JSON.stringify(oec)) };
  } catch (error) {
    console.error("Failed to fetch OEC by ID:", error);
    return { success: false, message: "Failed to fetch OEC." };
  }
};

// POST a new OEC
export const createOec = async (formData: FormData) => {
  try {
    const data = {
      product: formData.get("product"),
      oilExpellingCharges: formData.get("oilExpellingCharges"),
    };
    
    const validatedData = oecSchema.parse(data);

    await connectToDatabase();
    
    // Check if an entry for this product already exists
    const existingOec = await Oec.findOne({ product: validatedData.product });
    if (existingOec) {
      return { success: false, message: "An OEC entry for this product already exists." };
    }

    const newOec = await Oec.create(validatedData);

    revalidatePath("/admin/oec");

    return { success: true, data: JSON.parse(JSON.stringify(newOec)), message: "OEC created successfully!" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Failed to create OEC:", error);
    return { success: false, message: "Failed to create OEC." };
  }
};

// PUT (update) an existing OEC
export const updateOec = async (oecId: string, formData: FormData) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(oecId)) {
      return { success: false, message: "Invalid OEC ID." };
    }

    const data = {
      product: formData.get("product"),
      oilExpellingCharges: formData.get("oilExpellingCharges"),
    };
    
    const validatedData = oecSchema.parse(data);

    await connectToDatabase();

    const updatedOec = await Oec.findByIdAndUpdate(oecId, validatedData, {
      new: true,
    });
    
    if (!updatedOec) {
      return { success: false, message: "OEC not found." };
    }

    revalidatePath("/admin/oec");

    return { success: true, data: JSON.parse(JSON.stringify(updatedOec)), message: "OEC updated successfully!" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Failed to update OEC:", error);
    return { success: false, message: "Failed to update OEC." };
  }
};


// DELETE an OEC
export const deleteOec = async (oecId: string) => {
  try {
    await connectToDatabase();
    const deletedOec = await Oec.findByIdAndDelete(oecId);

    if (!deletedOec) {
      return { success: false, message: "OEC not found." };
    }
    revalidatePath("/admin/oec");
    return { success: true, message: "OEC deleted successfully!" };
  } catch (error) {
    console.error("Failed to delete OEC:", error);
    return { success: false, message: "Failed to delete OEC." };
  }
};