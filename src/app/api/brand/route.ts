// src/app/api/brand/route.ts
import { NextResponse } from 'next/server';
import Brand from '@/lib/models/brand';
import { uploadImage } from '@/lib/imageUpload';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

// GET all brands
export async function GET() {
  try {
    await connectToDatabase();
    const brands = await Brand.find({});
    return NextResponse.json(brands);
  } 
  // 💡 FIX: Use ESLint disable comment to ignore unused variable
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch (_error) { 
    return NextResponse.json({ message: 'Error fetching brands' }, { status: 500 });
  }
}

// POST a new brand
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const file = formData.get('image') as File;

    if (!name || !file) {
      return NextResponse.json({ message: 'Name and image are required.' }, { status: 400 });
    }

    const imageUrl = await uploadImage(file, 'brand');
    
    // Use a valid, hardcoded ObjectId for now.
    // In a real app, this would come from the authenticated user's session.
    const storeId = new ObjectId('65507b51e4431e67c87c2b64'); 

    const newBrand = await Brand.create({
      name,
      image: imageUrl,
      storeId,
    });

    return NextResponse.json(newBrand, { status: 201 });
  } catch (error) { // ⚠️ NOTE: This block uses 'error' in console.error, so it's not unused.
    console.error('Error creating brand:', error);
    return NextResponse.json({ message: 'Error creating brand' }, { status: 500 });
  }
}