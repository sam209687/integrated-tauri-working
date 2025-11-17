import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getUserModel } from "@/lib/models/user";
import { generateNumericOTP } from "@/lib/otp";
import { auth } from "@/lib/auth";
import { Types } from "mongoose";

interface Params {
  id: string;
}

export async function POST(
  req: Request,
  context: { params: Promise<Params> }  // ← params is now a Promise
) {
  try {
    const { id } = await context.params;  // ← await the params

    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid cashier ID" }, { status: 400 });
    }

    await connectToDatabase();
    const User = getUserModel();

    const cashier = await User.findOne({ _id: id, role: "cashier" });
    if (!cashier) {
      return NextResponse.json({ message: "Cashier not found." }, { status: 404 });
    }

    const otp = generateNumericOTP(6);
    const otpExpires = new Date(Date.now() + 60 * 60 * 1000);

    cashier.passwordResetToken = otp;
    cashier.passwordResetExpires = otpExpires;
    cashier.isPasswordResetRequested = false;
    await cashier.save();

    return NextResponse.json(
      { message: "Password reset OTP generated.", otp, otpExpires },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset initiate error:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}