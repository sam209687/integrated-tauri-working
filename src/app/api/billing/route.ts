import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Invoice from "@/lib/models/invoice";

// Define the cart item type
interface CartItem {
  _id: string;
  product: {
    productName: string;
    tax?: {
      gst?: number;
      hsn?: string;
    };
  };
  quantity: number;
  price: number;
}

// Define the request body type
interface InvoiceRequestBody {
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  paymentMethod?: string;
  gstEnabled: boolean;
  totalAmount: number;
  discountAmount?: number;
  grandTotal: number;
}

// ✅ GET all invoices
export async function GET() {
  try {
    await connectToDatabase();
    const invoices = await Invoice.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: invoices });
  } catch (error) {
    console.error("❌ [GET /api/billing] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch invoices." },
      { status: 500 }
    );
  }
}

// ✅ POST new invoice
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json() as InvoiceRequestBody;

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart is empty." },
        { status: 400 }
      );
    }

    const invoice = await Invoice.create({
      customerName: body.customerName || "Walk-in Customer",
      customerPhone: body.customerPhone || "",
      items: body.items.map((item: CartItem) => ({
        name: item.product.productName,
        productId: item._id,
        quantity: item.quantity,
        price: item.price,
        gst: item.product.tax?.gst || 0,
        hsn: item.product.tax?.hsn || "",
        subtotal: item.price * item.quantity,
      })),
      paymentMethod: body.paymentMethod || "cash",
      gstEnabled: body.gstEnabled,
      totalAmount: body.totalAmount,
      discountAmount: body.discountAmount ?? 0,
      grandTotal: body.grandTotal,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      message: "Invoice created successfully.",
      data: invoice,
    });
  } catch (error) {
    console.error("❌ [POST /api/billing] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create invoice." },
      { status: 500 }
    );
  }
}