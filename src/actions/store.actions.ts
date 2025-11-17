// src/actions/store.actions.ts

"use server";

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import Store from '@/lib/models/store';
import { writeFile, rm } from 'fs/promises';
import * as fs from 'fs'; // 💡 FIX 1: Use ES Module import for synchronous fs methods
import { join } from 'path';
import QRCode from 'qrcode';
import { StoreSchema } from '@/lib/schemas';

// This is a shared helper. If you haven't already, move this to a file like `src/lib/uploadHelper.ts`
const uploadFile = async (file: File | null, prefix: string): Promise<string | undefined> => {
  if (!file || file.size === 0) return undefined;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${Date.now()}-${prefix}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
  const uploadsDir = join(process.cwd(), 'public/uploads');
  const path = join(uploadsDir, filename);

  // ❌ FIX 1: Replaced require('fs')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  await writeFile(path, buffer);
  return `/uploads/${filename}`;
};

// This is a shared helper. If you haven't already, move this to a file like `src/lib/qrHelper.ts`
const generateAndSaveQRCode = async (data: string, prefix: string): Promise<string | undefined> => {
  if (!data) return undefined;
  
  const filename = `${Date.now()}-${prefix}-qrcode.png`;
  const uploadsDir = join(process.cwd(), 'public/uploads');
  const path = join(uploadsDir, filename);

  // ❌ FIX 2: Replaced require('fs')
  if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  await QRCode.toFile(path, data);
  return `/uploads/${filename}`;
};

// CREATE a new store setting
export async function createStore(formData: FormData) {
  try {
    await connectToDatabase();
    
    const dataToValidate = {
      storeName: formData.get('storeName'),
      address: formData.get('address'),
      city: formData.get('city'),
      pincode: formData.get('pincode'),
      state: formData.get('state'),
      contactNumber: formData.get('contactNumber'),
      email: formData.get('email'),
      fssai: formData.get('fssai'),
      pan: formData.get('pan'),
      gst: formData.get('gst'),
      mediaUrl: formData.get('mediaUrl'),
    };
    
    const validation = StoreSchema.safeParse(dataToValidate);

    if (!validation.success) {
      return { success: false, message: 'Invalid form data.', errors: validation.error.flatten().fieldErrors };
    }

    const logoFile = formData.get('logo') as File | null;
    const qrCodeFile = formData.get('qrCode') as File | null;

    const logoPath = await uploadFile(logoFile, 'logo');
    const qrCodePath = await uploadFile(qrCodeFile, 'details-qr');
    const mediaQRCodePath = await generateAndSaveQRCode(validation.data.mediaUrl || '', 'media-qr');

    const newStore = new Store({
      ...validation.data,
      logo: logoPath,
      qrCode: qrCodePath,
      mediaQRCode: mediaQRCodePath,
      status: 'INACTIVE',
    });

    const storeCount = await Store.countDocuments();
    if (storeCount === 0) {
      newStore.status = 'ACTIVE';
    }

    await newStore.save();
    
    revalidatePath('/admin/store-settings');
    return { success: true, message: 'Store setting created successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to create store setting: ${errorMessage}` };
  }
}

// UPDATE an existing store setting
export async function updateStore(id: string, formData: FormData) {
  try {
    await connectToDatabase();

    const dataToValidate = {
        storeName: formData.get('storeName'),
        address: formData.get('address'),
        city: formData.get('city'),
        pincode: formData.get('pincode'),
        state: formData.get('state'),
        contactNumber: formData.get('contactNumber'),
        email: formData.get('email'),
        fssai: formData.get('fssai'),
        pan: formData.get('pan'),
        gst: formData.get('gst'),
        mediaUrl: formData.get('mediaUrl'),
        status: formData.get('status'),
    };

    const validation = StoreSchema.safeParse(dataToValidate);

    if (!validation.success) {
      return { success: false, message: 'Invalid form data.', errors: validation.error.flatten().fieldErrors };
    }

    const store = await Store.findById(id);
    if (!store) {
      return { success: false, message: 'Store setting not found.' };
    }

    const logoFile = formData.get('logo') as File | null;
    const oldLogoPath = formData.get('oldLogoPath') as string | undefined;
    let logoPath = oldLogoPath;
    if (logoFile) {
        if (oldLogoPath) await rm(join(process.cwd(), 'public', oldLogoPath), { force: true }).catch(err => console.error(err));
        logoPath = await uploadFile(logoFile, 'logo');
    }

    const qrCodeFile = formData.get('qrCode') as File | null;
    const oldQrCodePath = formData.get('oldQrCodePath') as string | undefined;
    let qrCodePath = oldQrCodePath;
    if (qrCodeFile) {
        if (oldQrCodePath) await rm(join(process.cwd(), 'public', oldQrCodePath), { force: true }).catch(err => console.error(err));
        qrCodePath = await uploadFile(qrCodeFile, 'details-qr');
    }

    const oldMediaQRCodePath = formData.get('oldMediaQRCodePath') as string | undefined;
    let mediaQRCodePath = oldMediaQRCodePath;
    const newMediaUrl = validation.data.mediaUrl;
    
    if (newMediaUrl) {
      if (oldMediaQRCodePath) await rm(join(process.cwd(), 'public', oldMediaQRCodePath), { force: true }).catch(err => console.error(err));
      mediaQRCodePath = await generateAndSaveQRCode(newMediaUrl, 'media-qr');
    } else if (oldMediaQRCodePath) {
      await rm(join(process.cwd(), 'public', oldMediaQRCodePath), { force: true }).catch(err => console.error(err));
      mediaQRCodePath = undefined;
    }

    Object.assign(store, { ...validation.data, logo: logoPath, qrCode: qrCodePath, mediaQRCode: mediaQRCodePath });
    
    await store.save();

    revalidatePath('/admin/store-settings');
    revalidatePath(`/admin/store-settings/edit/${id}`);
    
    return { success: true, message: 'Store setting updated successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to update store setting: ${errorMessage}` };
  }
}

// DELETE a store setting
export async function deleteStore(id: string) {
  try {
    await connectToDatabase();
    
    const deletedStore = await Store.findByIdAndDelete(id);
    
    if (!deletedStore) {
      return { success: false, message: 'Store setting not found.' };
    }
    
    const filesToDelete = [deletedStore.logo, deletedStore.qrCode, deletedStore.mediaQRCode];
    for (const filePath of filesToDelete) {
        if (filePath) {
            await rm(join(process.cwd(), 'public', filePath), { force: true }).catch(err => console.error(err));
        }
    }

    revalidatePath('/admin/store-settings');
    return { success: true, message: 'Store setting deleted successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to delete store setting: ${errorMessage}` };
  }
}

// GET all store settings
export async function getStores() {
  try {
    await connectToDatabase();
    const stores = await Store.find({}).sort({ createdAt: 'desc' });
    return { success: true, data: JSON.parse(JSON.stringify(stores)) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to retrieve store settings: ${errorMessage}` };
  }
}

export async function getActiveStore() {
  try {
    await connectToDatabase();
    // Find the one store that is marked as ACTIVE
    const store = await Store.findOne({ status: 'ACTIVE' });
    return { success: true, data: JSON.parse(JSON.stringify(store)) };
  } catch (error) {
    // 💡 FIX 3: Log the error to use the variable and suppress the lint warning.
    console.error("Failed to retrieve active store:", error);
    return { success: false, message: 'Failed to retrieve active store.' };
  }
}