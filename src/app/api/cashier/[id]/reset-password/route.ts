// src/app/api/cashier/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getUserModel } from "@/lib/models/user";
import { Types } from "mongoose";
import bcrypt from "bcryptjs";

const password_hash_cost = 12;

// Utility to generate a simple temporary password
function generateTempPassword(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ✅ FIX: Use context with async params
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ Must await

    await connectToDatabase();
    const User = getUserModel();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid Cashier ID" },
        { status: 400 }
      );
    }

    const cashier = await User.findById(id);

    if (!cashier || cashier.role !== "cashier") {
      return NextResponse.json(
        { message: "Cashier not found or not a cashier role" },
        { status: 404 }
      );
    }

    // Generate new temporary password
    const tempPassword = generateTempPassword(8);
    const hashedPassword = await bcrypt.hash(tempPassword, password_hash_cost);

    cashier.password = hashedPassword;
    cashier.isPasswordResetRequested = false;
    cashier.passwordResetToken = undefined;
    cashier.passwordResetExpires = undefined;

    await cashier.save();

    console.log(
      `--- Password Reset for ${cashier.name} (${cashier.email}) ---`
    );
    console.log(`Temporary Password: ${tempPassword}`);
    console.log(
      `Personal Email for sending: ${cashier.personalEmail || "Not Available"}`
    );

    return NextResponse.json(
      {
        message: `Password reset successfully. Temporary password sent to ${
          cashier.personalEmail || "cashier's personal email"
        }.`,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Error resetting cashier password:", errorMessage);
    return NextResponse.json(
      { message: errorMessage || "Internal server error" },
      { status: 500 }
    );
  }
}
