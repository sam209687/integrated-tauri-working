// src/app/api/products/route.ts

import { NextRequest, NextResponse } from "next/server";
// import { connectToDB } from "@/lib/mongoose";
import Product from "@/lib/models/product";
import { connectToDatabase } from "@/lib/db";

// Function to safely extract error message
function getErrorMessage(error: unknown, defaultMessage: string = 'Internal server error'): string {
  return error instanceof Error ? error.message : defaultMessage;
}

// GET handler to fetch all products
// 💡 FIX 1: Use ESLint disable comment to ignore unused variable
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    await connectToDatabase();
    const products = await Product.find({});
    return NextResponse.json({ success: true, data: products });
  } catch (error) { // 💡 FIX 2: Removed ': any'
    const errorMessage = getErrorMessage(error, 'Error fetching products.');
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

// POST handler to create a new product
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const product = new Product(body);
    await product.save();
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) { // 💡 FIX 3: Removed ': any'
    const errorMessage = getErrorMessage(error, 'Error creating product.');
    // Keep 400 status for validation errors
    return NextResponse.json({ success: false, message: errorMessage }, { status: 400 }); 
  }
}