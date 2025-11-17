// src/app/api/batch/[id]/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
// import Batch from "@/lib/models/batch";
import { batchSchema } from "@/lib/schemas";
import { Batch } from "@/lib/models/batch";

// ✅ FIX: type params as a Promise and await them inside
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ Must await

    await connectToDatabase();
    const batch = await Batch.findById(id).populate({
      path: "product",
      select: "productName productCode",
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, message: "Batch not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: batch,
      message: "Batch fetched successfully!",
    });
  } catch (error: unknown) {
    console.error("Failed to fetch batch:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json(
      { success: false, message: "Failed to fetch batch: " + message },
      { status: 500 }
    );
  }
}

// ✅ Same fix for PUT
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await connectToDatabase();
    const body = await request.json();
    const validatedData = batchSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid form data.",
          errors: validatedData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updatedBatch = await Batch.findByIdAndUpdate(id, validatedData.data, {
      new: true,
    });

    if (!updatedBatch) {
      return NextResponse.json(
        { success: false, message: "Batch not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedBatch,
        message: "Batch updated successfully!",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Failed to update batch:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json(
      { success: false, message: "Failed to update batch: " + message },
      { status: 500 }
    );
  }
}

// ✅ And for DELETE
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await connectToDatabase();

    const deletedBatch = await Batch.findByIdAndDelete(id);

    if (!deletedBatch) {
      return NextResponse.json(
        { success: false, message: "Batch not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Batch deleted successfully!" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Failed to delete batch:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json(
      { success: false, message: "Failed to delete batch: " + message },
      { status: 500 }
    );
  }
}
