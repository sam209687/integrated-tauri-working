// src/actions/unit.actions.ts
"use server";

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import Unit from '@/lib/models/unit';
import { unitSchema } from '@/lib/schemas';

// GET all units
export async function getUnits() {
  try {
    await connectToDatabase();
    // Fetch units and map to the expected IUnit interface with unitName
    const units = await Unit.find({});
    const formattedUnits = units.map(unit => ({
      ...unit.toObject(),
      unitName: unit.name,
    }));
    return { success: true, data: JSON.parse(JSON.stringify(formattedUnits)) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to fetch units: ${errorMessage}` };
  }
}

// POST a new unit
export async function createUnit(formData: FormData) {
  try {
    await connectToDatabase();

    const name = formData.get('name') as string;

    const validation = unitSchema.safeParse({ name });
    if (!validation.success) {
      return { success: false, message: "Invalid form data.", errors: validation.error.flatten().fieldErrors };
    }

    const newUnit = new Unit({ name: validation.data.name });
    await newUnit.save();
    
    revalidatePath('/admin/unit');
    return { success: true, message: 'Unit created successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to create unit: ${errorMessage}` };
  }
}

// PUT (update) a unit
export async function updateUnit(unitId: string, formData: FormData) {
  try {
    await connectToDatabase();
    
    const name = formData.get('name') as string;

    if (!name || name.length < 1) {
      return { success: false, message: "Invalid unit name.", errors: { name: ["Unit name cannot be empty."] } };
    }
    
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return { success: false, message: 'Unit not found.' };
    }

    unit.name = name;
    await unit.save();

    revalidatePath('/admin/unit');
    revalidatePath(`/admin/unit/edit/${unitId}`);
    
    return { success: true, message: 'Unit updated successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to update unit: ${errorMessage}` };
  }
}

// DELETE a unit
export async function deleteUnit(unitId: string) {
  try {
    await connectToDatabase();
    
    const deletedUnit = await Unit.findByIdAndDelete(unitId);
    
    if (!deletedUnit) {
      return { success: false, message: 'Unit not found.' };
    }
    
    revalidatePath('/admin/unit');
    return { success: true, message: 'Unit deleted successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to delete unit: ${errorMessage}` };
  }
}