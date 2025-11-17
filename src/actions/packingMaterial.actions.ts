// src/actions/packingMaterial.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import PackingMaterial, { IPackingMaterial } from "@/lib/models/packingMaterial";
import { z } from "zod";

// 💡 Ensure Unit model is loaded for population and use in IPopulatedPackingMaterial
import { IUnit } from "@/lib/models/unit"; 

// ✅ FIX: Assuming your schema is available as 'packingMaterialSchema' from the barrel file
import { packingMaterialSchema } from "@/lib/schemas/packingMaterialSchema"; 
import { getUsedPackingMaterialQuantity } from "@/actions/variant.actions";

// --- Interfaces for Data Transfer ---

export interface PackingMaterialData {
    name: string;
    capacityVolume: number;
    capacityUnit: string; // ObjectId as string
    manufacturerName: string;
    purchasedQuantity: number;
    stockAlertQuantity: number;
}

// Define the structure for the populated material
// IPopulatedPackingMaterial will replace the ObjectId string for 'capacityUnit' with the full IUnit object.
export interface IPopulatedPackingMaterial extends Omit<IPackingMaterial, 'capacityUnit'> {
    capacityUnit: IUnit; 
}

// Data structure including the calculated balance (Exported for store use)
export interface PackingMaterialWithBalance extends IPopulatedPackingMaterial {
    balance: number;
}

// --- Core Logic: Calculation ---

const calculateBalance = async (material: IPopulatedPackingMaterial): Promise<number> => {
    // 1. Get the quantity used from the Variant DB (assuming getUsedPackingMaterialQuantity exists and is correctly implemented)
    const usedQtyResult = await getUsedPackingMaterialQuantity(
        material.capacityVolume,
        material.capacityUnit._id.toString()
    );
    const usedQuantity = usedQtyResult.success ? usedQtyResult.data : 0;
    
    // 2. Calculate balance
    return material.purchasedQuantity - usedQuantity;
};

export const enrichMaterialWithBalance = async (material: IPopulatedPackingMaterial): Promise<PackingMaterialWithBalance> => {
    const balance = await calculateBalance(material);
    // Mongoose lean documents need to be converted to plain objects for safe modification/spreading
    const materialObject = JSON.parse(JSON.stringify(material)); 
    return {
        ...materialObject,
        balance: balance,
    };
};

// --- CRUD Actions ---

// Create
export const createPackingMaterial = async (data: PackingMaterialData) => {
    try {
        // Use the correct lowercase variable name
        const validatedData = packingMaterialSchema.parse(data);
        await connectToDatabase();
        
        const newMaterial = new PackingMaterial(validatedData);
        await newMaterial.save();

        revalidatePath("/admin/packingProds");
        return { success: true, message: "Packing Material created successfully!" };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, message: error.errors[0].message };
        }
        console.error("Failed to create packing material:", error);
        return { success: false, message: "Failed to create packing material." };
    }
};

// Fetch all with balance
export const getPackingMaterials = async (): Promise<{ success: boolean; data?: PackingMaterialWithBalance[]; message?: string; }> => {
    try {
        await connectToDatabase();
        
        // 💡 FIX: Cast the Mongoose Lean result explicitly to unknown first
        const materials = await PackingMaterial.find({})
            .populate('capacityUnit')
            .lean() as unknown as IPopulatedPackingMaterial[]; 

        // Enrich each material with its calculated balance
        const enrichedMaterials = await Promise.all(
            materials.map(enrichMaterialWithBalance)
        );

        return { success: true, data: JSON.parse(JSON.stringify(enrichedMaterials)) };
    } catch (error) {
        console.error("Failed to fetch packing materials:", error);
        return { success: false, message: "Failed to fetch packing materials." };
    }
};

// Fetch by ID with balance
export const getPackingMaterialById = async (id: string): Promise<{ success: boolean; data?: PackingMaterialWithBalance; message?: string; }> => {
    try {
        await connectToDatabase();
        
        // 💡 FIX: Cast the Mongoose Lean result explicitly to unknown first
        const material = await PackingMaterial.findById(id)
            .populate('capacityUnit')
            .lean() as unknown as IPopulatedPackingMaterial; 

        if (!material) {
            return { success: false, message: "Packing Material not found." };
        }
        
        const enrichedMaterial = await enrichMaterialWithBalance(material);
        
        return { success: true, data: JSON.parse(JSON.stringify(enrichedMaterial)) };
    } catch (error) {
        console.error("Failed to fetch packing material by ID:", error);
        return { success: false, message: "Failed to fetch packing material." };
    }
};


// Update
export const updatePackingMaterial = async (id: string, data: PackingMaterialData) => {
    try {
        // Use the correct lowercase variable name
        const validatedData = packingMaterialSchema.parse(data);
        await connectToDatabase();
        
        const updatedMaterial = await PackingMaterial.findByIdAndUpdate(
            id,
            validatedData,
            { new: true }
        );

        if (!updatedMaterial) {
            return { success: false, message: "Packing Material not found." };
        }

        revalidatePath("/admin/packingProds");
        revalidatePath(`/admin/packingProds/${id}`);
        return { success: true, message: "Packing Material updated successfully!" };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, message: error.errors[0].message };
        }
        console.error("Failed to update packing material:", error);
        return { success: false, message: "Failed to update packing material." };
    }
};

// Delete
export const deletePackingMaterial = async (id: string) => {
    try {
        await connectToDatabase();
        const deletedMaterial = await PackingMaterial.findByIdAndDelete(id);

        if (!deletedMaterial) {
            return { success: false, message: "Packing Material not found." };
        }

        revalidatePath("/admin/packingProds");
        return { success: true, message: "Packing Material deleted successfully!" };
    } catch (error) {
        console.error("Failed to delete packing material:", error);
        return { success: false, message: "Failed to delete packing material." };
    }
};