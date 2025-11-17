"use server";

import { connectToDatabase } from "@/lib/db";
import Invoice from "@/lib/models/invoice";
import Variant from "@/lib/models/variant";
import { revalidatePath } from "next/cache";

interface CreateInvoiceInput {
  customerName: string;
  items: {
    _id: string;
    quantity: number;
    price: number;
    type: "variant" | "oec";
  }[];
  paymentMethod: string;
  gstEnabled: boolean;
  totalAmount: number;
  grandTotal: number;
}

/**
 * ✅ Creates an invoice and deducts stock quantities for billed items.
 * Returns invoice + status.
 */
export async function createInvoice(data: CreateInvoiceInput) {
  try {
    await connectToDatabase();

    // 1️⃣ Create invoice document
    const invoice = await Invoice.create({
      customerName: data.customerName,
      items: data.items,
      paymentMethod: data.paymentMethod,
      totalAmount: data.totalAmount,
      grandTotal: data.grandTotal,
      gstEnabled: data.gstEnabled,
      status: "completed",
      createdAt: new Date(),
    });

    // 2️⃣ Deduct variant stock quantities safely
    for (const item of data.items) {
      if (item.type === "variant" && item._id) {
        const variant = await Variant.findById(item._id);
        if (!variant) continue;

        const newStock = Math.max(0, (variant.stockQuantity ?? 0) - item.quantity);
        variant.stockQuantity = newStock;
        await variant.save();
      }
    }

    // 3️⃣ Revalidate static paths (for ISR caching)
    revalidatePath("/pos");
    revalidatePath("/");

    // 4️⃣ Return data for client-side refresh trigger
    return {
      success: true,
      message: "Invoice created successfully and stock updated!",
      data: invoice,
    };
  } catch (error) {
    console.error("❌ Billing Error:", error);
    return {
      success: false,
      message: "Failed to create invoice or update stock.",
    };
  }
}

/**
 * ⚙️ Helper function for POS store to re-fetch variants after billing
 * (so you can call this from BillingSection to refresh UI live)
 */
export async function refreshVariantsAfterBilling() {
  try {
    revalidatePath("/pos");
    return { success: true };
  } catch (error) {
    console.error("Revalidation Error:", error);
    return { success: false };
  }
}
