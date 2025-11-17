// src/app/api/currency/[id]/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Currency from '@/lib/models/currency';
import { currencySchema } from '@/lib/schemas';

// ✅ Use proper async context param type for Next.js 15+
type RouteContext = { params: Promise<{ id: string }> };

// ==========================
// GET a single currency by ID
// ==========================
export async function GET(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params; // ✅ await the params
    await connectToDatabase();

    const currency = await Currency.findById(id);

    if (!currency) {
      return NextResponse.json({ success: false, message: 'Currency not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: currency });
  } catch (error) {
    console.error('Error fetching currency:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch currency.' }, { status: 500 });
  }
}

// ==========================
// PUT (update) a single currency by ID
// ==========================
export async function PUT(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params; // ✅ await the params
    await connectToDatabase();

    const body = await req.json();
    const validation = currencySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid form data.', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updatedCurrency = await Currency.findByIdAndUpdate(id, validation.data, { new: true });

    if (!updatedCurrency) {
      return NextResponse.json({ success: false, message: 'Currency not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Currency updated successfully!', data: updatedCurrency });
  } catch (error) {
    console.error('Error updating currency:', error);
    return NextResponse.json({ success: false, message: 'Failed to update currency.' }, { status: 500 });
  }
}

// ==========================
// DELETE a single currency by ID
// ==========================
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params; // ✅ await the params
    await connectToDatabase();

    const deletedCurrency = await Currency.findByIdAndDelete(id);

    if (!deletedCurrency) {
      return NextResponse.json({ success: false, message: 'Currency not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Currency deleted successfully!' });
  } catch (error) {
    console.error('Error deleting currency:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete currency.' }, { status: 500 });
  }
}
