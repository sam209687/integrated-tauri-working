// src/app/api/customer/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Customer from '@/lib/models/customer';
import { customerSchema } from '@/lib/schemas';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const validatedData = customerSchema.parse(body);

    const newCustomer = await Customer.create(validatedData);

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) { // 💡 FIX: Removed ': any'
    // Use a type guard to handle different error types, specifically for Mongoose duplicate key error (code 11000)
    
    // Safely check for Mongoose duplicate key error (code 11000)
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      console.error("Failed to create customer: Duplicate key error");
      return NextResponse.json({ message: 'A customer with this phone number already exists.' }, { status: 409 });
    }
    
    // Log general error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to create customer.';
    console.error("Failed to create customer:", errorMessage);
    
    return NextResponse.json({ message: 'Failed to create customer.' }, { status: 500 });
  }
}