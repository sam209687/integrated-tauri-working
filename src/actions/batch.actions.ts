"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import { z } from "zod";
import moment from "moment";

import { batchSchema } from "@/lib/schemas";
import Product, { IPopulatedProduct } from "@/lib/models/product";
import { Batch, IBatch } from "@/lib/models/batch";
import { IPopulatedBatch } from "@/store/batch.store"; // ✅ Import for full compatibility

// ✅ Type-safe action result
export interface ActionResult<T> {
  success: boolean;
  message: string;
  data?: T;
}

/* ===========================================================
   ✅ GET ALL BATCHES
=========================================================== */
export const getBatches = async (): Promise<ActionResult<IPopulatedBatch[]>> => {
  try {
    await connectToDatabase();

    const batches = await Batch.find({})
      .populate({
        path: "product",
        select: "productName productCode category brand tax",
        populate: [
          { path: "category", select: "_id name" },
          { path: "brand", select: "_id name" },
          { path: "tax", select: "_id name rate" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean<IPopulatedBatch[]>();

    return {
      success: true,
      message: "Batches fetched successfully.",
      data: JSON.parse(JSON.stringify(batches)),
    };
  } catch (error: unknown) {
    console.error("❌ Failed to fetch batches:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch batches.";
    return { success: false, message };
  }
};

/* ===========================================================
   ✅ GET SINGLE BATCH BY ID
=========================================================== */
export const getBatchById = async (
  id: string
): Promise<ActionResult<IPopulatedBatch>> => {
  try {
    await connectToDatabase();

    const batch = await Batch.findById(id)
      .populate({
        path: "product",
        select: "productName productCode category brand tax",
        populate: [
          { path: "category", select: "_id name" },
          { path: "brand", select: "_id name" },
          { path: "tax", select: "_id name rate" },
        ],
      })
      .lean<IPopulatedBatch | null>();

    if (!batch) return { success: false, message: "Batch not found." };

    return {
      success: true,
      message: "Batch fetched successfully.",
      data: JSON.parse(JSON.stringify(batch)),
    };
  } catch (error: unknown) {
    console.error("❌ Failed to fetch batch by ID:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch batch.";
    return { success: false, message };
  }
};

/* ===========================================================
   ✅ CREATE BATCH
=========================================================== */
export const createBatch = async (
  formData: FormData
): Promise<ActionResult<IPopulatedBatch>> => {
  try {
    const rawData = {
      product: formData.get("product"),
      batchNumber: formData.get("batchNumber"),
      vendorName: formData.get("vendorName"),
      qty: Number(formData.get("qty")),
      price: Number(formData.get("price")),
      perUnitPrice: Number(formData.get("perUnitPrice")),
      oilCakeProduced: formData.get("oilCakeProduced")
        ? Number(formData.get("oilCakeProduced"))
        : undefined,
      oilExpelled: formData.get("oilExpelled")
        ? Number(formData.get("oilExpelled"))
        : undefined,
    };

    const validatedData = batchSchema.parse(rawData);
    await connectToDatabase();

    const newBatch = await Batch.create(validatedData);
    const populatedBatch = await newBatch.populate({
      path: "product",
      select: "productName productCode category brand tax",
      populate: [
        { path: "category", select: "_id name" },
        { path: "brand", select: "_id name" },
        { path: "tax", select: "_id name rate" },
      ],
    });

    revalidatePath("/admin/batch");

    return {
      success: true,
      message: "Batch created successfully.",
      data: JSON.parse(JSON.stringify(populatedBatch)) as IPopulatedBatch,
    };
  } catch (error: unknown) {
    if (error instanceof z.ZodError)
      return { success: false, message: error.errors[0].message };
    console.error("❌ Failed to create batch:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create batch.";
    return { success: false, message };
  }
};

/* ===========================================================
   ✅ UPDATE BATCH
=========================================================== */
export const updateBatch = async (
  id: string,
  formData: FormData
): Promise<ActionResult<IPopulatedBatch>> => {
  try {
    const rawData = {
      product: formData.get("product"),
      batchNumber: formData.get("batchNumber"),
      vendorName: formData.get("vendorName"),
      qty: Number(formData.get("qty")),
      price: Number(formData.get("price")),
      perUnitPrice: Number(formData.get("perUnitPrice")),
      oilCakeProduced: formData.get("oilCakeProduced")
        ? Number(formData.get("oilCakeProduced"))
        : undefined,
      oilExpelled: formData.get("oilExpelled")
        ? Number(formData.get("oilExpelled"))
        : undefined,
    };

    const validatedData = batchSchema.parse(rawData);
    await connectToDatabase();

    const updatedBatch = await Batch.findByIdAndUpdate(id, validatedData, {
      new: true,
    })
      .populate({
        path: "product",
        select: "productName productCode category brand tax",
        populate: [
          { path: "category", select: "_id name" },
          { path: "brand", select: "_id name" },
          { path: "tax", select: "_id name rate" },
        ],
      })
      .lean<IPopulatedBatch | null>();

    if (!updatedBatch)
      return { success: false, message: "Batch not found." };

    revalidatePath("/admin/batch");
    revalidatePath(`/admin/batch/edit/${id}`);

    return {
      success: true,
      message: "Batch updated successfully.",
      data: JSON.parse(JSON.stringify(updatedBatch)),
    };
  } catch (error: unknown) {
    if (error instanceof z.ZodError)
      return { success: false, message: error.errors[0].message };
    console.error("❌ Failed to update batch:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update batch.";
    return { success: false, message };
  }
};

/* ===========================================================
   ✅ DELETE BATCH
=========================================================== */
export const deleteBatch = async (
  batchId: string
): Promise<ActionResult<null>> => {
  try {
    await connectToDatabase();
    const deleted = await Batch.findByIdAndDelete(batchId);
    if (!deleted)
      return { success: false, message: "Batch not found." };

    revalidatePath("/admin/batch");
    return { success: true, message: "Batch deleted successfully." };
  } catch (error: unknown) {
    console.error("❌ Failed to delete batch:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete batch.";
    return { success: false, message };
  }
};

/* ===========================================================
   ✅ GENERATE BATCH NUMBER
=========================================================== */
export const generateBatchNumber = async (
  productCode: string
): Promise<ActionResult<string>> => {
  try {
    const prefix = productCode.substring(0, 2).toUpperCase();
    const datePart = moment().format("DDMMYYYY");

    await connectToDatabase();

    // ✅ Explicitly type as IBatch so TS knows it has `batchNumber`
    const latest = await Batch.findOne({
      batchNumber: new RegExp(`^${prefix}\\d{8}\\d{4}$`),
    })
      .sort({ batchNumber: -1 })
      .lean<IBatch | null>();

    const nextSeq = latest
      ? parseInt(latest.batchNumber.slice(-4), 10) + 1
      : 1;

    const batchNumber = `${prefix}${datePart}${String(nextSeq).padStart(4, "0")}`;

    return {
      success: true,
      message: "Batch number generated successfully.",
      data: batchNumber,
    };
  } catch (error: unknown) {
    console.error("❌ Failed to generate batch number:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate batch number.";
    return { success: false, message };
  }
};

/* ===========================================================
   ✅ PRODUCTS FOR BATCH DROPDOWN
=========================================================== */
export const getProductsForBatch = async (): Promise<
  ActionResult<IPopulatedProduct[]>
> => {
  try {
    await connectToDatabase();

    const products = await Product.find({})
      .populate("category")
      .populate("brand")
      .populate("tax")
      .sort({ productName: 1 })
      .lean<IPopulatedProduct[]>();

    return {
      success: true,
      message: "Products fetched successfully.",
      data: JSON.parse(JSON.stringify(products)),
    };
  } catch (error: unknown) {
    console.error("❌ Failed to fetch products:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch products.";
    return { success: false, message };
  }
};
