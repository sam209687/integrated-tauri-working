// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/lib/models/product";

// ✅ Proper type for Next.js 15+ dynamic route params
type RouteContext = { params: Promise<{ id: string }> };

// Utility for consistent error handling
function getErrorMessage(
  error: unknown,
  defaultMessage = "Internal server error"
): string {
  return error instanceof Error ? error.message : defaultMessage;
}

// ✅ GET: Fetch product by ID
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params; // 👈 await required in Next.js 15
    await connectToDatabase();

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    const message = getErrorMessage(error, "Error fetching product.");
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// ✅ PUT: Update product by ID
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params; // 👈 await again
    await connectToDatabase();

    const body = await req.json();
    const updatedProduct = await Product.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error) {
    const message = getErrorMessage(error, "Error updating product.");
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

// ✅ DELETE: Remove product by ID
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params; // 👈 await again
    await connectToDatabase();

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    const message = getErrorMessage(error, "Error deleting product.");
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
