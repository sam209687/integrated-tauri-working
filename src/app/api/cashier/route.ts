// src/app/api/cashier/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getUserModel } from '@/lib/models/user';
// 💡 FIX 1: Removed unused import 'Types'
// import { Types } from 'mongoose'; // Assuming you might need Types.ObjectId for IDs

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const User = getUserModel();
    const body = await req.json();

    // Destructure based on the new field names from AddCashierForm
    const { name, personalEmail, aadhaar, phone, storeLocation, email, temp_password } = body;

    // Basic validation
    if (!name || !personalEmail || !aadhaar || !phone || !storeLocation || !email || !temp_password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check if a user with this new login email already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this login email already exists' }, { status: 409 });
    }

    // Check if a user with this Aadhaar already exists
    const existingAadhaar = await User.findOne({ aadhaar: aadhaar });
    if (existingAadhaar) {
      return NextResponse.json({ message: 'User with this Aadhaar number already exists' }, { status: 409 });
    }

    const newCashier = new User({
      name,
      personalEmail, // Save personal email
      aadhaar,
      phone,
      storeLocation,
      email, // Save login email (was username)
      password: temp_password, // Mongoose pre-save hook will hash this
      role: 'cashier',
      status: 'active',
      isAdminInitialSetupComplete: true, // Assuming cashiers are active and ready after creation
    });

    await newCashier.save();

    // Return a subset of data (exclude password for security)
    const cashierResponse = newCashier.toObject();
    delete cashierResponse.password;
    delete cashierResponse.passwordResetToken;
    delete cashierResponse.passwordResetExpires;

    return NextResponse.json({ message: 'Cashier added successfully', cashier: cashierResponse }, { status: 201 });
  } catch (error) { // 💡 FIX 2: Removed ': any'
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error("Error adding cashier:", errorMessage);
    
    // Safely check for Mongoose duplicate key error (code 11000)
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) { 
        return NextResponse.json({ message: 'A cashier with this email or Aadhaar already exists.' }, { status: 409 });
    }
    
    return NextResponse.json({ message: errorMessage || 'Internal server error' }, { status: 500 });
  }
}

// 💡 FIX 3 & 4: Use ESLint comment to ignore unused variable and keep error handling type guard
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    await connectToDatabase();
    const User = getUserModel();

    // Fetch all cashiers
    const cashiers = await User.find({ role: 'cashier' }).select('-password -passwordResetToken -passwordResetExpires'); // Exclude sensitive fields

    return NextResponse.json(cashiers, { status: 200 });
  } catch (error) { 
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error("Error fetching cashiers:", errorMessage);
    return NextResponse.json({ message: errorMessage || 'Internal server error' }, { status: 500 });
  }
}