import { NextResponse } from 'next/server';
import Tax from '@/lib/models/tax';
import { connectToDatabase } from '@/lib/db';

// GET all taxes
export async function GET() {
  try {
    await connectToDatabase();
    const taxes = await Tax.find({});
    return NextResponse.json(taxes);
  } 
  // 💡 FIX: Use ESLint disable comment to ignore unused variable
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch (_error) {
    return NextResponse.json({ message: 'Error fetching taxes' }, { status: 500 });
  }
}

// POST a new tax
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const hsn = formData.get('hsn') as string;
    const gst = formData.get('gst') as string;

    if (!name || !hsn || !gst) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    const newTax = await Tax.create({ name, hsn, gst: parseFloat(gst) });
    return NextResponse.json(newTax, { status: 201 });
  } catch (error) {
    console.error('Error creating tax:', error);
    return NextResponse.json({ message: 'Error creating tax' }, { status: 500 });
  }
}