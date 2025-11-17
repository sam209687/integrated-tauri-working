"use server";

import { revalidatePath } from "next/cache";
import Invoice, { IInvoice } from "@/lib/models/invoice";
import { connectToDatabase } from "@/lib/db";
import Variant, { IVariant } from "@/lib/models/variant";
import Product, { IProduct } from "@/lib/models/product";

// --------------------------------------------------------------------------
// ✅ Standard Action Response
// --------------------------------------------------------------------------
interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// --------------------------------------------------------------------------
// ✅ Reference Types for Populated Documents
// --------------------------------------------------------------------------
export interface ICustomerRef {
  _id: string;
  name: string;
  phone: string; // ✅ made required for consistent typing
}

export interface IBilledByRef {
  _id: string;
  name: string;
  email?: string;
}

// ✅ Type for invoices after population
export type PopulatedInvoice = Omit<IInvoice, "customer" | "billedBy"> & {
  customer: ICustomerRef;
  billedBy: IBilledByRef;
};

// --------------------------------------------------------------------------
// ✅ Helper Types
// --------------------------------------------------------------------------
interface InvoiceItem {
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  mrp: number;
  gstRate: number;
  hsn?: string;
}

interface InvoiceLean {
  invoiceNumber: string;
  items: InvoiceItem[];
  createdAt: Date;
}

interface InvoiceFilter {
  status: { $ne: string };
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
  [key: string]: unknown;
}

interface IVariantWithPopulatedProduct
  extends Omit<
    IVariant,
    | "product"
    | "unitConsumed"
    | "others1"
    | "others2"
    | "packingCharges"
    | "laborCharges"
    | "electricityCharges"
  > {
  product: IProduct;
  unitConsumed?: number;
  others1?: number;
  others2?: number;
  packingCharges?: number;
  laborCharges?: number;
  electricityCharges?: number;
}

// --------------------------------------------------------------------------
// ✅ Invoice Creation Payload
// --------------------------------------------------------------------------
export type InvoiceDataPayload = {
  customerId: string;
  billedById: string;
  items: {
    variantId: string;
    name: string;
    price: number;
    quantity: number;
    mrp: number;
    gstRate: number;
    hsn?: string;
  }[];
  subtotal: number;
  discount: number;
  packingChargeDiscount: number;
  gstAmount: number;
  totalPayable: number;
  paymentMethod: "cash" | "upi" | "card";
};

// --------------------------------------------------------------------------
// 🧾 Generate Invoice Number
// --------------------------------------------------------------------------
async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);

  const lastInvoice = await Invoice.findOne({
    createdAt: { $gte: startOfYear, $lt: endOfYear },
  }).sort({ createdAt: -1 });

  let nextSequence = 1;

  if (lastInvoice && lastInvoice.invoiceNumber) {
    const parts = lastInvoice.invoiceNumber.split("-");
    if (parts.length === 5 && parts[0] === "INV" && parts[1] === "RS") {
      const lastSequence = parseInt(parts[2], 10);
      if (!isNaN(lastSequence)) nextSequence = lastSequence + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(6, "0");
  const paddedMonth = String(month).padStart(2, "0");

  return `INV-RS-${paddedSequence}-${paddedMonth}-${year}`;
}

// --------------------------------------------------------------------------
// 🧾 Create Invoice
// --------------------------------------------------------------------------
export async function createInvoice(
  invoiceData: InvoiceDataPayload
): Promise<ActionResponse<IInvoice>> {
  try {
    await connectToDatabase();

    const invoiceNumber = await generateInvoiceNumber();

    const normalizedItems = invoiceData.items.map((item) => {
      let variantIdString = item.variantId;
      if (
        item.variantId &&
        typeof item.variantId === "object" &&
        "$oid" in item.variantId
      ) {
        variantIdString = (item.variantId as { $oid: string }).$oid;
      }
      return { ...item, variantId: variantIdString };
    });

    const newInvoice = new Invoice({
      invoiceNumber,
      customer: invoiceData.customerId,
      billedBy: invoiceData.billedById,
      items: normalizedItems,
      subtotal: invoiceData.subtotal,
      discount: invoiceData.discount,
      packingChargeDiscount: invoiceData.packingChargeDiscount,
      gstAmount: invoiceData.gstAmount,
      totalPayable: invoiceData.totalPayable,
      paymentMethod: invoiceData.paymentMethod,
    });

    const savedInvoice = await newInvoice.save();

    revalidatePath("/admin/invoice");
    revalidatePath("/cashier/invoice");

    return { success: true, data: JSON.parse(JSON.stringify(savedInvoice)) };
  } catch (error) {
    console.error("❌ Create invoice error:", error);
    return { success: false, message: "Failed to create invoice." };
  }
}

// --------------------------------------------------------------------------
// 🧾 Get All Invoices (✅ FIXED)
// --------------------------------------------------------------------------
export async function getInvoices(): Promise<
  ActionResponse<PopulatedInvoice[]>
> {
  try {
    await connectToDatabase();

    const invoices = await Invoice.find()
      .populate<{ customer: ICustomerRef }>("customer", "name phone")
      .populate<{ billedBy: IBilledByRef }>("billedBy", "name email")
      .lean<PopulatedInvoice[]>(); // ✅ fully typed lean()

    return { success: true, data: invoices };
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return {
      success: false,
      message: "Failed to fetch invoices.",
      data: [],
    };
  }
}

// --------------------------------------------------------------------------
// 🧾 Cancel Invoice
// --------------------------------------------------------------------------
export async function cancelInvoice(
  invoiceId: string
): Promise<ActionResponse<IInvoice>> {
  try {
    await connectToDatabase();
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      { status: "cancelled" },
      { new: true }
    );

    if (!updatedInvoice) {
      return { success: false, message: "Invoice not found." };
    }

    revalidatePath("/admin/invoice");
    revalidatePath("/cashier/invoice");

    return { success: true, data: JSON.parse(JSON.stringify(updatedInvoice)) };
  } catch (error) {
    console.error("❌ Cancel invoice error:", error);
    return { success: false, message: "Failed to cancel invoice." };
  }
}

// --------------------------------------------------------------------------
// 🧾 Count Invoices by Customer
// --------------------------------------------------------------------------
export async function getInvoiceCountByCustomer(
  customerId: string
): Promise<ActionResponse<number>> {
  try {
    await connectToDatabase();
    const count = await Invoice.countDocuments({ customer: customerId });
    return { success: true, data: count };
  } catch (error) {
    console.error("❌ Failed to fetch invoice count:", error);
    return { success: false, message: "Failed to fetch invoice count." };
  }
}

// --------------------------------------------------------------------------
// 💰 Financial Metrics Calculation
// --------------------------------------------------------------------------
export async function getFinancialMetrics(
  fromDate?: Date,
  toDate?: Date
): Promise<
  ActionResponse<{
    totalProfit: number;
    totalDeposits: number;
    depositableCharges: {
      packingCharges: number;
      laborCharges: number;
      electricityCharges: number;
      oecCharges: number;
    };
  }>
> {
  try {
    await connectToDatabase();

    const filter: InvoiceFilter = { status: { $ne: "cancelled" } };
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = fromDate;
      if (toDate) filter.createdAt.$lte = toDate;
    }

    const invoices = await Invoice.find(filter)
      .select("invoiceNumber items createdAt")
      .lean<InvoiceLean[]>();

    let totalProfit = 0;
    const totalDepositableCharges = {
      packingCharges: 0,
      laborCharges: 0,
      electricityCharges: 0,
      oecCharges: 0,
    };

    for (const invoice of invoices) {
      for (const item of invoice.items) {
        if (!item.variantId) continue;

        const variantData = await Variant.findById(item.variantId)
          .populate<{ product: IProduct }>({
            path: "product",
            model: Product,
            select: "purchasePrice sellingPrice",
          })
          .lean();

        const variant = variantData as IVariantWithPopulatedProduct | null;
        if (!variant || !variant.product) continue;

        const purchasePrice = variant.product.purchasePrice || 0;
        const sellingPrice = variant.product.sellingPrice || 0;
        const unitConsumed = variant.unitConsumed || 0;
        const others2 = variant.others2 || 0;
        const itemQuantity = item.quantity;

        const priceDifference = sellingPrice - purchasePrice;
        const quantityCalc = priceDifference * unitConsumed;
        const itemProfitPerUnit = quantityCalc + others2;
        const itemProfit = itemProfitPerUnit * itemQuantity;

        totalProfit += itemProfit;

        totalDepositableCharges.packingCharges +=
          (variant.packingCharges || 0) * itemQuantity;
        totalDepositableCharges.laborCharges +=
          (variant.laborCharges || 0) * itemQuantity;
        totalDepositableCharges.electricityCharges +=
          (variant.electricityCharges || 0) * itemQuantity;
        totalDepositableCharges.oecCharges +=
          (variant.others1 || 0) * itemQuantity;
      }
    }

    const totalDeposits = Object.values(totalDepositableCharges).reduce(
      (sum, val) => sum + val,
      0
    );

    return {
      success: true,
      data: {
        totalProfit,
        totalDeposits,
        depositableCharges: totalDepositableCharges,
      },
    };
  } catch (error) {
    console.error("❌ [getFinancialMetrics] Error:", error);
    return { success: false, message: "Failed to calculate financial metrics." };
  }
}
