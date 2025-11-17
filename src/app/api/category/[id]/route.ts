// src/app/api/category/route.ts
import { NextResponse } from 'next/server';
import Category from '@/lib/models/category';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb'; // Assuming ObjectId is needed for the POST body or similar logic

// 1. GET all categories
export async function GET() {
  try {
    await connectToDatabase();
    // Assuming GET without ID means fetch all
    const categories = await Category.find({});

    return NextResponse.json(categories);
  } 
  // 💡 FIX: Use ESLint disable comment to ignore unused variable
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch (_error) { 
    return NextResponse.json({ message: 'Error fetching categories' }, { status: 500 });
  }
}

// 2. POST a new category
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    
    // Explicitly handle formData entries to avoid implicit 'any'
    const nameEntry = formData.get('name');
    const codePrefixEntry = formData.get('codePrefix');

    const name = typeof nameEntry === 'string' ? nameEntry : '';
    const codePrefix = typeof codePrefixEntry === 'string' ? codePrefixEntry : '';

    if (!name || !codePrefix) {
      return NextResponse.json({ message: 'Name and Code Prefix are required.' }, { status: 400 });
    }
    
    // Assuming a storeId is needed for creation (based on the original code's context)
    const storeId = new ObjectId('65507b51e4431e67c87c2b64'); 

    const newCategory = await Category.create({
      name,
      codePrefix,
      storeId,
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) { 
    console.error('Error creating category:', error);
    return NextResponse.json({ message: 'Error creating category' }, { status: 500 });
  }
}

// NOTE: The original PUT and DELETE functions were removed as they are typically 
// placed in [id]/route.ts, which is where they were in the previous request.