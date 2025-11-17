// src/app/api/batche/route.ts

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
// import Batch from "@/lib/models/batch";
import { batchSchema } from "@/lib/schemas";
import mongoose from "mongoose";
import { Batch } from "@/lib/models/batch";

// Handle GET request to fetch all batches
export async function GET() {
  try {
    await connectToDatabase();
    const batches = await Batch.find({}).populate({
      path: 'product',
      select: 'productName productCode',
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: batches, message: "Batches fetched successfully!" });
  } catch (error: unknown) {
    console.error("Failed to fetch batches:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ success: false, message: "Failed to fetch batches: " + message }, { status: 500 });
  }
}

// Handle POST request to create a new batch
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const validatedData = batchSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ success: false, message: "Invalid form data.", errors: validatedData.error.flatten().fieldErrors }, { status: 400 });
    }

    const newBatch = new Batch(validatedData.data);
    await newBatch.save();

    return NextResponse.json({ success: true, data: newBatch, message: "Batch created successfully!" }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof mongoose.mongo.MongoError && error.code === 11000) {
      return NextResponse.json({ success: false, message: "Batch with this number already exists." }, { status: 409 });
    }
    console.error("Failed to create batch:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ success: false, message: "Failed to create batch: " + message }, { status: 500 });
  }
}