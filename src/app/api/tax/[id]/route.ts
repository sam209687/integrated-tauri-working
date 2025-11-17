// src/app/api/tax/[id]/route.ts
import { NextResponse } from 'next/server';
import Tax from '@/lib/models/tax';
import { connectToDatabase } from '@/lib/db';

// ✅ Proper Next.js 15 route context type
type RouteContext = { params: Promise<{ id: string }> };

// ───────────────────────────────
// GET a single tax by ID
// ───────────────────────────────
export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params; // 👈 must await params
    await connectToDatabase();

    const tax = await Tax.findById(id);
    if (!tax) {
      return NextResponse.json({ message: 'Tax not found' }, { status: 404 });
    }

    return NextResponse.json(tax);
  } catch (error) {
    console.error('Error fetching tax:', error);
    return NextResponse.json({ message: 'Error fetching tax' }, { status: 500 });
  }
}

// ───────────────────────────────
// PUT (update) a tax by ID
// ───────────────────────────────
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const hsn = formData.get('hsn') as string;
    const gst = parseFloat(formData.get('gst') as string);

    const tax = await Tax.findById(id);
    if (!tax) {
      return NextResponse.json({ message: 'Tax not found' }, { status: 404 });
    }

    tax.name = name;
    tax.hsn = hsn;
    tax.gst = gst;
    await tax.save();

    return NextResponse.json(tax);
  } catch (error) {
    console.error('Error updating tax:', error);
    return NextResponse.json({ message: 'Error updating tax' }, { status: 500 });
  }
}

// ───────────────────────────────
// DELETE a tax by ID
// ───────────────────────────────
export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const tax = await Tax.findByIdAndDelete(id);
    if (!tax) {
      return NextResponse.json({ message: 'Tax not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Tax deleted successfully' });
  } catch (error) {
    console.error('Error deleting tax:', error);
    return NextResponse.json({ message: 'Error deleting tax' }, { status: 500 });
  }
}
