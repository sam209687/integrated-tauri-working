// src/actions/store.actions.ts
"use server";

import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import Store from "@/lib/models/store";
import { StoreSchema } from "@/lib/schemas";
import { connectToDatabase } from "@/lib/db";

// Helper function to save file to specific folder
async function saveFile(file: File, folder: string, fileName: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Create the directory structure if it doesn't exist
  const dirPath = join(process.cwd(), "public", "media", "QR", folder);
  
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
  
  const filePath = join(dirPath, fileName);
  await writeFile(filePath, buffer);
  
  // Return the public URL path
  return `/media/QR/${folder}/${fileName}`;
}

// Helper function to delete old file
async function deleteFile(filePath: string) {
  if (filePath && filePath.startsWith("/media/")) {
    const fullPath = join(process.cwd(), "public", filePath);
    if (existsSync(fullPath)) {
      await unlink(fullPath);
    }
  }
}

export async function createStore(formData: FormData) {
  try {
    await connectToDatabase();

    const data = Object.fromEntries(formData.entries());
    
    // Validate form data
    const validatedData = StoreSchema.parse({
      storeName: data.storeName,
      address: data.address,
      city: data.city,
      pincode: data.pincode,
      state: data.state,
      contactNumber: data.contactNumber,
      email: data.email,
      fssai: data.fssai || undefined,
      pan: data.pan || undefined,
      gst: data.gst || undefined,
      facebookUrl: data.facebookUrl || undefined,
      instagramUrl: data.instagramUrl || undefined,
      youtubeUrl: data.youtubeUrl || undefined,
      twitterUrl: data.twitterUrl || undefined,
      googleMapsUrl: data.googleMapsUrl || undefined,
      websiteUrl: data.websiteUrl || undefined,
      status: data.status || 'INACTIVE',
    });

    const storeData: any = { ...validatedData };

    // Handle logo upload
    const logo = formData.get("logo") as File | null;
    if (logo) {
      const logoFileName = `logo-${Date.now()}.${logo.name.split('.').pop()}`;
      storeData.logo = await saveFile(logo, "logos", logoFileName);
    }

    // Handle store details QR code
    const qrCode = formData.get("qrCode") as File | null;
    if (qrCode) {
      const qrFileName = `store-details-${Date.now()}.png`;
      storeData.qrCode = await saveFile(qrCode, "store", qrFileName);
    }

    // Handle social media QR codes
    const socialQRFields = [
      { field: 'facebookQRCode', folder: 'facebook' },
      { field: 'instagramQRCode', folder: 'instagram' },
      { field: 'youtubeQRCode', folder: 'youtube' },
      { field: 'twitterQRCode', folder: 'twitter' },
      { field: 'googleMapsQRCode', folder: 'googlemaps' },
      { field: 'websiteQRCode', folder: 'website' },
    ];

    for (const { field, folder } of socialQRFields) {
      const qrFile = formData.get(field) as File | null;
      if (qrFile) {
        const qrFileName = `${folder}-qr-${Date.now()}.png`;
        storeData[field] = await saveFile(qrFile, folder, qrFileName);
      }
    }

    // If status is ACTIVE, deactivate all other stores
    if (storeData.status === 'ACTIVE') {
      await Store.updateMany({}, { status: 'INACTIVE' });
    }

    const newStore = await Store.create(storeData);

    return {
      success: true,
      message: "Store created successfully!",
      data: JSON.parse(JSON.stringify(newStore)),
    };
  } catch (error: any) {
    console.error("Error creating store:", error);
    return {
      success: false,
      message: error.message || "Failed to create store",
    };
  }
}

export async function updateStore(storeId: string, formData: FormData) {
  try {
    await connectToDatabase();

    const data = Object.fromEntries(formData.entries());
    
    // Validate form data
    const validatedData = StoreSchema.parse({
      storeName: data.storeName,
      address: data.address,
      city: data.city,
      pincode: data.pincode,
      state: data.state,
      contactNumber: data.contactNumber,
      email: data.email,
      fssai: data.fssai || undefined,
      pan: data.pan || undefined,
      gst: data.gst || undefined,
      facebookUrl: data.facebookUrl || undefined,
      instagramUrl: data.instagramUrl || undefined,
      youtubeUrl: data.youtubeUrl || undefined,
      twitterUrl: data.twitterUrl || undefined,
      googleMapsUrl: data.googleMapsUrl || undefined,
      websiteUrl: data.websiteUrl || undefined,
      status: data.status || 'INACTIVE',
    });

    const updateData: any = { ...validatedData };

    // Handle logo upload
    const logo = formData.get("logo") as File | null;
    if (logo) {
      const oldLogoPath = formData.get("oldLogoPath") as string;
      if (oldLogoPath) await deleteFile(oldLogoPath);
      
      const logoFileName = `logo-${Date.now()}.${logo.name.split('.').pop()}`;
      updateData.logo = await saveFile(logo, "logos", logoFileName);
    }

    // Handle store details QR code
    const qrCode = formData.get("qrCode") as File | null;
    if (qrCode) {
      const oldQrCodePath = formData.get("oldQrCodePath") as string;
      if (oldQrCodePath) await deleteFile(oldQrCodePath);
      
      const qrFileName = `store-details-${Date.now()}.png`;
      updateData.qrCode = await saveFile(qrCode, "store", qrFileName);
    }

    // Handle social media QR codes
    const socialQRFields = [
      { field: 'facebookQRCode', folder: 'facebook', oldPathField: 'oldFacebookQRCodePath' },
      { field: 'instagramQRCode', folder: 'instagram', oldPathField: 'oldInstagramQRCodePath' },
      { field: 'youtubeQRCode', folder: 'youtube', oldPathField: 'oldYoutubeQRCodePath' },
      { field: 'twitterQRCode', folder: 'twitter', oldPathField: 'oldTwitterQRCodePath' },
      { field: 'googleMapsQRCode', folder: 'googlemaps', oldPathField: 'oldGoogleMapsQRCodePath' },
      { field: 'websiteQRCode', folder: 'website', oldPathField: 'oldWebsiteQRCodePath' },
    ];

    for (const { field, folder, oldPathField } of socialQRFields) {
      const qrFile = formData.get(field) as File | null;
      if (qrFile) {
        const oldPath = formData.get(oldPathField) as string;
        if (oldPath) await deleteFile(oldPath);
        
        const qrFileName = `${folder}-qr-${Date.now()}.png`;
        updateData[field] = await saveFile(qrFile, folder, qrFileName);
      }
    }

    // If status is ACTIVE, deactivate all other stores
    if (updateData.status === 'ACTIVE') {
      await Store.updateMany({ _id: { $ne: storeId } }, { status: 'INACTIVE' });
    }

    const updatedStore = await Store.findByIdAndUpdate(storeId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedStore) {
      return {
        success: false,
        message: "Store not found",
      };
    }

    return {
      success: true,
      message: "Store updated successfully!",
      data: JSON.parse(JSON.stringify(updatedStore)),
    };
  } catch (error: any) {
    console.error("Error updating store:", error);
    return {
      success: false,
      message: error.message || "Failed to update store",
    };
  }
}

export async function getActiveStore() {
  try {
    await connectToDatabase();
    const activeStore = await Store.findOne({ status: 'ACTIVE' }).lean();
    
    if (!activeStore) {
      return { success: false, message: "No active store found", data: null };
    }
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(activeStore)),
    };
  } catch (error: any) {
    console.error("Error fetching active store:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch active store",
      data: null,
    };
  }
}

export async function getAllStores() {
  try {
    await connectToDatabase();
    const stores = await Store.find().sort({ createdAt: -1 }).lean();
    
    return {
      success: true,
      data: JSON.parse(JSON.stringify(stores)),
    };
  } catch (error: any) {
    console.error("Error fetching stores:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch stores",
      data: [],
    };
  }
}

// Alias for backwards compatibility
export const getStores = getAllStores;

export async function deleteStore(storeId: string) {
  try {
    await connectToDatabase();
    
    const store = await Store.findById(storeId);
    if (!store) {
      return { success: false, message: "Store not found" };
    }

    // Delete all associated files
    const filesToDelete = [
      store.logo,
      store.qrCode,
      store.facebookQRCode,
      store.instagramQRCode,
      store.youtubeQRCode,
      store.twitterQRCode,
      store.googleMapsQRCode,
      store.websiteQRCode,
    ];

    for (const file of filesToDelete) {
      if (file) await deleteFile(file);
    }

    await Store.findByIdAndDelete(storeId);

    return {
      success: true,
      message: "Store deleted successfully!",
    };
  } catch (error: any) {
    console.error("Error deleting store:", error);
    return {
      success: false,
      message: error.message || "Failed to delete store",
    };
  }
}