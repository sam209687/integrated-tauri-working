// src/actions/currency.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import Currency from "@/lib/models/currency";

// Define a type for the Currency document to help with type safety
interface ICurrency {
  _id: string;
  sNo: string;
  currencySymbol: string;
  createdAt: Date;
}

export const getCurrencySymbol = async () => {
  try {
    await connectToDatabase();
    // ✅ FIX: Use findOne to get a single document and be explicit with type
    const currency = await Currency.findOne({ sNo: "1" }).lean() as ICurrency | null;
    
    if (currency && currency.currencySymbol) {
      return { success: true, data: currency.currencySymbol, message: "Currency symbol fetched successfully." };
    }
    
    return { success: false, message: "Currency symbol not found." };
  } catch (error) {
    console.error("Failed to fetch currency symbol:", error);
    return { success: false, message: "Failed to fetch currency symbol." };
  }
};

// Fetch all currencies
export const getCurrencies = async () => {
  try {
    await connectToDatabase();
    const currencies = await Currency.find({}).lean();
    return { success: true, data: JSON.parse(JSON.stringify(currencies)) };
  } catch (error) {
    // 💡 FIX: Log the error to use the 'error' variable and suppress the warning
    console.error("Failed to fetch currencies:", error);
    return { success: false, message: "Failed to fetch currencies." };
  }
};

// Create a new currency
export const createCurrency = async (formData: FormData) => {
  try {
    await connectToDatabase();
    const data = Object.fromEntries(formData);
    const newCurrency = new Currency(data);
    await newCurrency.save();
    revalidatePath("/admin/currency");
    return { success: true, data: JSON.parse(JSON.stringify(newCurrency)), message: "Currency created successfully." };
  } catch (error) {
    console.error("Failed to create currency:", error);
    return { success: false, message: "Failed to create currency." };
  }
};

// Update an existing currency
export const updateCurrency = async (id: string, formData: FormData) => {
  try {
    await connectToDatabase();
    const data = Object.fromEntries(formData);
    const updatedCurrency = await Currency.findByIdAndUpdate(id, data, { new: true });
    if (!updatedCurrency) {
      return { success: false, message: "Currency not found." };
    }
    revalidatePath("/admin/currency");
    return { success: true, data: JSON.parse(JSON.stringify(updatedCurrency)), message: "Currency updated successfully." };
  } catch (error) {
    console.error("Failed to update currency:", error);
    return { success: false, message: "Failed to update currency." };
  }
};

// Delete a currency
export const deleteCurrency = async (id: string) => {
  try {
    await connectToDatabase();
    const deletedCurrency = await Currency.findByIdAndDelete(id);
    if (!deletedCurrency) {
      return { success: false, message: "Currency not found." };
    }
    revalidatePath("/admin/currency");
    return { success: true, message: "Currency deleted successfully." };
  } catch (error) {
    console.error("Failed to delete currency:", error);
    return { success: false, message: "Failed to delete currency." };
  }
};