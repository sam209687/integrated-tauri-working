// src/actions/tax.actions.ts
"use server";

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import Tax from '@/lib/models/tax';
import { taxSchema } from '@/lib/schemas';

// GET all taxes
export async function getTaxes() {
  try {
    await connectToDatabase();
    // Fetch taxes and map to the expected ITax interface with taxName
    const taxes = await Tax.find({});
    const formattedTaxes = taxes.map(tax => ({
      ...tax.toObject(),
      taxName: tax.name,
    }));
    return { success: true, data: JSON.parse(JSON.stringify(formattedTaxes)) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to fetch taxes: ${errorMessage}` };
  }
}

// POST a new tax
export async function createTax(formData: FormData) {
  try {
    await connectToDatabase();

    const name = formData.get('name') as string;
    const hsn = formData.get('hsn') as string;
    const gst = formData.get('gst') as string;

    const validation = taxSchema.safeParse({ name, hsn, gst });
    if (!validation.success) {
      return { success: false, message: "Invalid form data.", errors: validation.error.flatten().fieldErrors };
    }

    const newTax = new Tax({ name: validation.data.name, hsn: validation.data.hsn, gst: validation.data.gst });
    await newTax.save();
    
    revalidatePath('/admin/tax');
    return { success: true, message: 'Tax created successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to create tax: ${errorMessage}` };
  }
}

// PUT (update) a tax
export async function updateTax(taxId: string, formData: FormData) {
  try {
    await connectToDatabase();
    
    const name = formData.get('name') as string;
    const hsn = formData.get('hsn') as string;
    const gst = formData.get('gst') as string;

    const validation = taxSchema.safeParse({ name, hsn, gst });
    if (!validation.success) {
      return { success: false, message: "Invalid form data.", errors: validation.error.flatten().fieldErrors };
    }
    
    const tax = await Tax.findById(taxId);
    if (!tax) {
      return { success: false, message: 'Tax not found.' };
    }

    tax.name = validation.data.name;
    tax.hsn = validation.data.hsn;
    tax.gst = validation.data.gst;
    await tax.save();

    revalidatePath('/admin/tax');
    revalidatePath(`/admin/tax/edit/${taxId}`);
    
    return { success: true, message: 'Tax updated successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to update tax: ${errorMessage}` };
  }
}

// DELETE a tax
export async function deleteTax(taxId: string) {
  try {
    await connectToDatabase();
    
    const deletedTax = await Tax.findByIdAndDelete(taxId);
    
    if (!deletedTax) {
      return { success: false, message: 'Tax not found.' };
    }
    
    revalidatePath('/admin/tax');
    return { success: true, message: 'Tax deleted successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to delete tax: ${errorMessage}` };
  }
}