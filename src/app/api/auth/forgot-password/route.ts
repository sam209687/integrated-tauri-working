// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getUserModel, IUser } from '@/lib/models/user';
import { sendOTP } from '@/lib/email';
import { generateNumericOTP } from '@/lib/otp';
import crypto from 'crypto'; // This is a server-only import.

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const User = getUserModel();
    const { email } = await req.json();

    console.log('Received forgot password request for email:', email);

    const user: IUser | null = await User.findOne({ email });
    console.log('User found in DB:', user ? user.email + ' (Role: ' + user.role + ')' : 'None');

    if (!user) {
      console.log('Email not found. Returning generic success message for security.');
      return NextResponse.json(
        { message: 'If your email is registered, a password reset OTP has been sent.' },
        { status: 200 }
      );
    }

    console.log('Entering Existing User Flow (role:', user.role, ')...');
    
    if (user.role === 'admin') {
      const otp = generateNumericOTP(6);
      const otpExpires = new Date(Date.now() + 30 * 60 * 1000);
      user.passwordResetToken = otp;
      user.passwordResetExpires = otpExpires;
      await user.save();
      console.log(`Sending OTP to existing admin: ${user.email}`);
      await sendOTP(user.email, otp);
      return NextResponse.json(
        { message: 'Password reset OTP sent to your email.' },
        { status: 200 }
      );
    } else if (user.role === 'cashier') {
      user.isPasswordResetRequested = true;
      user.passwordResetToken = crypto.randomBytes(20).toString('hex');
      user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      console.log(`Cashier ${user.email} requested password reset. Admin needs to initiate.`);
      return NextResponse.json(
        { message: 'Password reset request sent to admin. Please wait for admin response.' },
        { status: 200 }
      );
    }

  } catch (error) { // 💡 FIX: Removed ': any'
    const errorMessage = error instanceof Error ? error.message : 'Internal server error.';
    console.error('Forgot password API error:', errorMessage);
    return NextResponse.json({ message: errorMessage || 'Internal server error.' }, { status: 500 });
  }
}