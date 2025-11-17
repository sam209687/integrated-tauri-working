// src/app/api/customer/[phone]/route.ts

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Customer from '@/lib/models/customer';

// ✅ Define the proper context type for Next.js 15+
type RouteContext = { params: Promise<{ phone: string }> };

export async function GET(req: Request, context: RouteContext) {
  try {
    // ✅ Await the params
    const { phone } = await context.params;

    await connectToDatabase();

    const phonePrefix = phone.trim();

    // ✅ Validate query length (3–10 digits)
    if (!phonePrefix || phonePrefix.length < 3 || phonePrefix.length > 10) {
      return NextResponse.json(
        { message: 'Enter 3 to 10 digits to search.' },
        { status: 400 }
      );
    }

    // ✅ Use regex for "starts with" search
    const customers = await Customer.find({
      phone: { $regex: `^${phonePrefix}` },
    }).limit(10);

    if (!customers || customers.length === 0) {
      return NextResponse.json(
        { message: 'No matching customers found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(customers, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch customer search results:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
