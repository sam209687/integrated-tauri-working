import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Invoice from '@/lib/models/invoice';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Generate a simple unique invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    const newInvoice = await Invoice.create({ ...body, invoiceNumber });

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) { // 💡 FIX: Removed ': any'
    // Safely extract the error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error("Failed to create invoice:", error);
    return NextResponse.json({ message: 'Failed to create invoice.', error: errorMessage }, { status: 500 });
  }
}