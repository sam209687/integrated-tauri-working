import { NextResponse } from 'next/server';
import Category from '@/lib/models/category';
import { connectToDatabase } from '@/lib/db';

// GET all categories
export async function GET() {
  try {
    await connectToDatabase();
    const categories = await Category.find({});
    return NextResponse.json(categories);
  } 
  // 💡 FIX: Use ESLint disable comment to ignore unused variable
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch (_error) {
    return NextResponse.json({ message: 'Error fetching categories' }, { status: 500 });
  }
}

// POST a new category
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    const name = formData.get('name') as string;

    if (!name) {
      return NextResponse.json({ message: 'Category name is required.' }, { status: 400 });
    }

    const newCategory = await Category.create({ name });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ message: 'Error creating category' }, { status: 500 });
  }
}