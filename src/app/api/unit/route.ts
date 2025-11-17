import { NextResponse } from 'next/server';
import Unit from '@/lib/models/unit';
import { connectToDatabase } from '@/lib/db';

// GET all units
export async function GET() {
  try {
    await connectToDatabase();
    const units = await Unit.find({});
    return NextResponse.json(units);
  } 
  // 💡 FIX: Use ESLint disable comment to ignore unused variable
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch (_error) {
    return NextResponse.json({ message: 'Error fetching units' }, { status: 500 });
  }
}

// POST a new unit
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    const name = formData.get('name') as string;

    if (!name) {
      return NextResponse.json({ message: 'Unit name is required.' }, { status: 400 });
    }

    const newUnit = await Unit.create({ name });
    return NextResponse.json(newUnit, { status: 201 });
  } catch (error) {
    console.error('Error creating unit:', error);
    return NextResponse.json({ message: 'Error creating unit' }, { status: 500 });
  }
}