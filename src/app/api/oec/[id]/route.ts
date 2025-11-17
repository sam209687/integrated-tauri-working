// src/app/api/oec/[id]/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Oec from "@/lib/models/oec"; // ✅ Use your actual OEC model
import mongoose from "mongoose";

// ✅ Define the correct type for Next.js 15 route context
type RouteContext = { params: Promise<{ id: string }> };

// Centralized error response utility
function handleError(error: unknown, defaultMessage: string): NextResponse {
  const message = error instanceof Error ? error.message : defaultMessage;
  console.error(defaultMessage, error);
  return NextResponse.json({ success: false, message }, { status: 500 });
}

// ✅ GET a single OEC by ID
export async function GET(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid OEC ID." },
        { status: 400 }
      );
    }

    const oec = await Oec.findById(id);
    if (!oec) {
      return NextResponse.json(
        { success: false, message: "OEC not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: oec });
  } catch (error) {
    return handleError(error, "Failed to fetch OEC.");
  }
}

// ✅ PUT (update) OEC by ID
export async function PUT(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid OEC ID." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updatedOec = await Oec.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedOec) {
      return NextResponse.json(
        { success: false, message: "OEC not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OEC updated successfully!",
      data: updatedOec,
    });
  } catch (error) {
    return handleError(error, "Failed to update OEC.");
  }
}

// ✅ DELETE OEC by ID
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid OEC ID." },
        { status: 400 }
      );
    }

    const deletedOec = await Oec.findByIdAndDelete(id);
    if (!deletedOec) {
      return NextResponse.json(
        { success: false, message: "OEC not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OEC deleted successfully!",
    });
  } catch (error) {
    return handleError(error, "Failed to delete OEC.");
  }
}
