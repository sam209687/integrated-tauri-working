// src/app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getUserModel } from "@/lib/models/user";
import { z } from "zod";
import { sendOTP } from "@/lib/email";
import { generateNumericOTP } from "@/lib/otp";

// ✅ Zod schema validation
const SignupFormSchema = z.object({
  name: z.string().min(2, { message: "Name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const User = getUserModel();
    const body = await req.json();

    // ✅ Validate incoming data
    const validatedData = SignupFormSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          message: "Invalid form data.",
          errors: validatedData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validatedData.data;

    // ✅ Prevent multiple admin accounts
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return NextResponse.json(
        {
          message:
            "An admin account already exists. Please contact the existing admin to proceed.",
        },
        { status: 409 }
      );
    }

    // ✅ Prevent duplicate emails
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // ✅ Use provided password or temporary numeric password
    const tempPassword = password ? password : generateNumericOTP().toString();

    // ⚠️ DO NOT HASH HERE — model pre-save hook handles it automatically
    const newUser = new User({
      name,
      email,
      password: tempPassword, // plain, will be hashed in model hook
      role: "admin",
      isAdminInitialSetupComplete: false,
      status: "active",
    });

    // ✅ Generate OTP for verification
    const otp = generateNumericOTP();
    const otpExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min expiry

    newUser.passwordResetToken = otp;
    newUser.passwordResetExpires = otpExpires;
    newUser.isPasswordResetRequested = true;

    await newUser.save();

    console.log(`✅ Admin account created: ${newUser.email}. Sending OTP...`);

    // ✅ Send OTP to email
    await sendOTP(email, otp, "Admin Account Verification");

    return NextResponse.json(
      {
        message:
          "Admin account created. OTP sent to your email for verification.",
        email,
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error.";
    console.error("Signup API error:", errorMessage);

    return NextResponse.json(
      { message: errorMessage || "Internal server error." },
      { status: 500 }
    );
  }
}
