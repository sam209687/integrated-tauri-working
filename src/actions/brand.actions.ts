"use server";

import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import { uploadImage, deleteImage } from '@/lib/imageUpload';
import Brand, { IBrand } from '@/lib/models/brand';
import { brandSchema } from '@/lib/schemas';

export async function getBrands() {
  try {
    await connectToDatabase();
    const brands = await Brand.find({});
    return { success: true, data: JSON.parse(JSON.stringify(brands)) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to fetch brands: ${errorMessage}` };
  }
}

export async function createBrand(formData: FormData) {
  try {
    await connectToDatabase();

    const name = formData.get('name') as string;
    const image = formData.get('image') as File;

    // Validate with Zod
    const validation = brandSchema.safeParse({ name, image });
    if (!validation.success) {
      return { success: false, message: "Invalid form data.", errors: validation.error.flatten().fieldErrors };
    }

    // Upload image and create DB entry
    const imageUrl = await uploadImage(validation.data.image, 'brand');
    const newBrand = new Brand({ name: validation.data.name, imageUrl });
    await newBrand.save();
    
    revalidatePath('/admin/brand');
    return { success: true, message: 'Brand created successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to create brand: ${errorMessage}` };
  }
}

export async function deleteBrand(brandId: string, imageUrl: string) {
  try {
    await connectToDatabase();
    
    // Concurrently delete image from filesystem and entry from DB
    await Promise.all([
      deleteImage(imageUrl),
      Brand.findByIdAndDelete(brandId)
    ]);
    
    revalidatePath('/admin/brand');
    return { success: true, message: 'Brand deleted successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to delete brand: ${errorMessage}` };
  }
}


// update brand 


export async function updateBrand(brandId: string, formData: FormData) {
  try {
    await connectToDatabase();

    const name = formData.get('name') as string;
    const image = formData.get('image') as File;

    // Validate with Zod, but make the image optional for updates.
    // The `brandSchema` might need to be modified or a new schema created for updates.
    // For simplicity, we'll validate the name here and handle the image separately.
    if (!name || name.length < 2) {
      return { success: false, message: "Invalid brand name.", errors: { name: ["Brand name must be at least 2 characters long."] } };
    }

    const brand = await Brand.findById(brandId);
    if (!brand) {
      return { success: false, message: 'Brand not found.' };
    }

    let newImageUrl = brand.imageUrl;

    if (image && image.size > 0) {
      // Delete the old image and upload the new one
      await deleteImage(brand.imageUrl);
      newImageUrl = await uploadImage(image, 'brand');
    }

    brand.name = name;
    brand.imageUrl = newImageUrl;
    await brand.save();

    revalidatePath('/admin/brand');
    revalidatePath(`/admin/brand/edit/${brandId}`); // Revalidate the edit page as well.
    
    return { success: true, message: 'Brand updated successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error("Error updating brand:", error);
    return { success: false, message: `Failed to update brand: ${errorMessage}` };
  }
}


export async function getBrandById(id: string): Promise<{
  success: boolean;
  data?: IBrand | null;
  message?: string;
}> {
  try {
    await connectToDatabase();

    const brand = await Brand.findById(id).lean<IBrand>().exec();

    if (!brand) {
      return { success: false, message: "Brand not found" };
    }

    return { success: true, data: brand };
  } catch (error) {
    console.error("Error fetching brand by ID:", error);
    return { success: false, message: "Failed to fetch brand" };
  }
}