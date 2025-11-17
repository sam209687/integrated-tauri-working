// src/app/api/cashier/[id]/route.ts
import { NextResponse } from "next/server";
import Brand from "@/lib/models/brand";
import { deleteImage, uploadImage } from "@/lib/imageUpload";
import { connectToDatabase } from "@/lib/db";

// ⚙️ NOTE: If this is actually for "cashier" model, 
// replace `Brand` with your real `Cashier` model below.

// ✅ FIXED: params typed as Promise and awaited in all handlers

// GET a single brand (cashier) by ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ Await
    await connectToDatabase();

    const brand = await Brand.findById(id);

    if (!brand) {
      return NextResponse.json({ message: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch (error) {
    console.error("Error fetching brand:", error);
    return NextResponse.json(
      { message: "Error fetching brand" },
      { status: 500 }
    );
  }
}

// PUT (update) a brand by ID
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const formData = await request.formData();
    const nameEntry = formData.get("name");
    const fileEntry = formData.get("image");

    const name = typeof nameEntry === "string" ? nameEntry : "";
    const file =
      fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;

    const brand = await Brand.findById(id);
    if (!brand) {
      return NextResponse.json({ message: "Brand not found" }, { status: 404 });
    }

    let imageUrl = brand.imageUrl;
    if (file) {
      await deleteImage(brand.imageUrl);
      imageUrl = await uploadImage(file, "brand");
    }

    brand.name = name;
    brand.imageUrl = imageUrl;
    await brand.save();

    return NextResponse.json(brand);
  } catch (error) {
    console.error("Error updating brand:", error);
    return NextResponse.json(
      { message: "Error updating brand" },
      { status: 500 }
    );
  }
}

// DELETE a brand by ID
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const brand = await Brand.findByIdAndDelete(id);

    if (!brand) {
      return NextResponse.json({ message: "Brand not found" }, { status: 404 });
    }

    await deleteImage(brand.imageUrl);

    return NextResponse.json({ message: "Brand deleted successfully" });
  } catch (error) {
    console.error("Error deleting brand:", error);
    return NextResponse.json(
      { message: "Error deleting brand" },
      { status: 500 }
    );
  }
}
