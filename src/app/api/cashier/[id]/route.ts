// src/app/api/cashier/[id]/route.ts
import { connectToDatabase } from "@/lib/db";
import { getUserModel } from "@/lib/models/user";
import { NextResponse } from "next/server";

// GET a single cashier by ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const User = getUserModel();
    const cashier = await User.findById(id);

    if (!cashier) {
      return NextResponse.json({ message: "Cashier not found" }, { status: 404 });
    }

    // Only return cashiers (not admins or other roles)
    if (cashier.role !== "cashier") {
      return NextResponse.json({ message: "User is not a cashier" }, { status: 404 });
    }

    return NextResponse.json(cashier);
  } catch (error) {
    console.error("Error fetching cashier:", error);
    return NextResponse.json(
      { message: "Error fetching cashier" },
      { status: 500 }
    );
  }
}

// PUT (update) a cashier by ID
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const data = await request.json();
    const User = getUserModel();

    const cashier = await User.findById(id);
    
    if (!cashier) {
      return NextResponse.json({ message: "Cashier not found" }, { status: 404 });
    }

    if (cashier.role !== "cashier") {
      return NextResponse.json({ message: "User is not a cashier" }, { status: 404 });
    }

    // Update only provided fields
    if (data.name) cashier.name = data.name;
    if (data.personalEmail) cashier.personalEmail = data.personalEmail;
    if (data.aadhaar) cashier.aadhaar = data.aadhaar;
    if (data.phone) cashier.phone = data.phone;
    if (data.storeLocation) cashier.storeLocation = data.storeLocation;
    if (data.email) cashier.email = data.email;
    if (data.status) cashier.status = data.status;

    await cashier.save();

    return NextResponse.json(cashier);
  } catch (error) {
    console.error("Error updating cashier:", error);
    return NextResponse.json(
      { message: "Error updating cashier" },
      { status: 500 }
    );
  }
}

// DELETE a cashier by ID
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const User = getUserModel();
    const cashier = await User.findById(id);

    if (!cashier) {
      return NextResponse.json({ message: "Cashier not found" }, { status: 404 });
    }

    if (cashier.role !== "cashier") {
      return NextResponse.json({ message: "User is not a cashier" }, { status: 404 });
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: "Cashier deleted successfully" });
  } catch (error) {
    console.error("Error deleting cashier:", error);
    return NextResponse.json(
      { message: "Error deleting cashier" },
      { status: 500 }
    );
  }
}