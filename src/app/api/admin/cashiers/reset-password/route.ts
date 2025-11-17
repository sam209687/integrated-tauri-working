import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getUserModel, IUser } from '@/lib/models/user';
import { sendOTP } from '@/lib/email';
import crypto from 'crypto';
// import { getServerSession } from 'next-auth';
// import { authOptions, auth } from '@/lib/auth'; 
import { auth } from '@/lib/auth'; 

async function checkAdminAuth() {
  const session = await auth();
  if (!session || !session.user || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized. Admin access required.' }, { status: 403 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    await connectToDatabase();
    const User = getUserModel();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    }

    const cashier: IUser | null = await User.findOne({ email, role: 'cashier' });

    if (!cashier) {
      return NextResponse.json({ message: 'Cashier not found.' }, { status: 404 });
    }

    const otp = crypto.randomBytes(3).toString('hex'); // 6-digit hex OTP
    const otpExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    cashier.passwordResetToken = otp;
    cashier.passwordResetExpires = otpExpires;
    cashier.isPasswordResetRequested = false; // Admin is initiating, so clear request flag
    await cashier.save();

    await sendOTP(cashier.email, otp);

    return NextResponse.json(
      { message: `Password reset OTP sent to ${cashier.email}.`, otpSent: true },
      { status: 200 }
    );
  } catch (error) { // 💡 FIX: Removed ': any'
    const errorMessage = error instanceof Error ? error.message : 'Internal server error.';
    console.error('Admin cashier reset password API error:', errorMessage);
    return NextResponse.json({ message: errorMessage || 'Internal server error.' }, { status: 500 });
  }
}