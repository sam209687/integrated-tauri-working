// src/app/api/auth/reset-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getUserModel, IUser } from "@/lib/models/user";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const User = getUserModel();

    const { email, otp, newPassword, confirmPassword, isInitialSetup } =
      await req.json();

    console.log("🔐 Reset Password Request:", {
      email,
      otp,
      newPassword: newPassword ? "[REDACTED]" : "missing",
      confirmPassword: confirmPassword ? "[REDACTED]" : "missing",
      isInitialSetup,
    });

    // 1️⃣ Basic validation
    if (!email || !otp || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      return NextResponse.json(
        { message: "Passwords do not match." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // 2️⃣ Find user by email
    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or OTP." },
        { status: 400 }
      );
    }

    // 3️⃣ Validate OTP
    const now = new Date();
    if (
      !user.passwordResetToken ||
      user.passwordResetToken !== otp ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < now
    ) {
      // Clear expired/invalid token fields
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return NextResponse.json(
        { message: "Invalid or expired OTP." },
        { status: 400 }
      );
    }

    // ⚠️ DO NOT HASH manually — let Mongoose pre-save hook hash automatically
    user.password = newPassword;

    // ✅ Clear token & flags
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.isPasswordResetRequested = false;

    // ✅ Mark admin setup complete if applicable
    if (user.role === "admin" && isInitialSetup) {
      user.isAdminInitialSetupComplete = true;
      console.log("✅ Admin initial setup completed for:", user.email);
    }

    await user.save(); // 🔐 password will be hashed automatically here

    const message = isInitialSetup
      ? "Admin account setup complete. You can now log in."
      : "Password reset successful. You can now log in.";

    console.log("✅", message, "for", email);

    return NextResponse.json({ message }, { status: 200 });
  } catch (error) {
    console.error("❌ Reset Password API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error.";

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
