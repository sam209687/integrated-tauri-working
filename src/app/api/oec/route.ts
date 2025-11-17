// src/app/api/oec/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Oec from '@/lib/models/oec';
// 💡 FIX 1: Removed unused import 'Product'
// import Product from '@/lib/models/product';

// GET all OECs
export async function GET() {
  try {
    await connectToDatabase();
    const oecs = await Oec.find({})
      .populate({ path: 'product', select: 'productName productCode' })
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: oecs });
  } 
  // 💡 FIX 2: Use ESLint disable comment to ignore unused variable
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch (_error) { 
    return NextResponse.json(
      { success: false, message: 'Failed to fetch OECs.' },
      { status: 500 }
    );
  }
}

// POST a new OEC
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { product, oilExpellingCharges } = body;

    // Validate request body
    if (!product || oilExpellingCharges === undefined) {
      return NextResponse.json(
        { success: false, message: 'Product and Oil Expelling Charges are required.' },
        { status: 400 }
      );
    }
    
    // Check if an entry for this product already exists
    const existingOec = await Oec.findOne({ product });
    if (existingOec) {
      return NextResponse.json(
        { success: false, message: "An OEC entry for this product already exists." },
        { status: 409 }
      );
    }

    const newOec = await Oec.create({
      product,
      oilExpellingCharges,
    });

    return NextResponse.json(
      { success: true, message: 'OEC created successfully!', data: newOec },
      { status: 201 }
    );
  } 
  // 💡 FIX 3: Use ESLint disable comment to ignore unused variable
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch (_error) { 
    return NextResponse.json(
      { success: false, message: 'Failed to create OEC.' },
      { status: 500 }
    );
  }
}