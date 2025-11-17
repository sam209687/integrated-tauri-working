// src/app/api/unit/[id]/route.ts
import { NextResponse } from 'next/server';
import Unit from '@/lib/models/unit';
import { connectToDatabase } from '@/lib/db';

// ✅ Correct Next.js 15 type for dynamic route context
type RouteContext = { params: Promise<{ id: string }> };

// ───────────────────────────────
// GET — Fetch a single unit by ID
// ───────────────────────────────
export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params; // 👈 Must await params
    await connectToDatabase();

    const unit = await Unit.findById(id);
    if (!unit) {
      return NextResponse.json({ message: 'Unit not found' }, { status: 404 });
    }

    return NextResponse.json(unit);
  } catch (error) {
    console.error('Error fetching unit:', error);
    return NextResponse.json({ message: 'Error fetching unit' }, { status: 500 });
  }
}

// ───────────────────────────────
// PUT — Update a unit by ID
// ───────────────────────────────
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const formData = await request.formData();
    const name = formData.get('name') as string;

    const unit = await Unit.findById(id);
    if (!unit) {
      return NextResponse.json({ message: 'Unit not found' }, { status: 404 });
    }

    unit.name = name;
    await unit.save();

    return NextResponse.json(unit);
  } catch (error) {
    console.error('Error updating unit:', error);
    return NextResponse.json({ message: 'Error updating unit' }, { status: 500 });
  }
}

// ───────────────────────────────
// DELETE — Delete a unit by ID
// ───────────────────────────────
export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const unit = await Unit.findByIdAndDelete(id);
    if (!unit) {
      return NextResponse.json({ message: 'Unit not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    return NextResponse.json({ message: 'Error deleting unit' }, { status: 500 });
  }
}
