// src/app/api/whatsapp/send-pdf/route.ts

import { NextRequest, NextResponse } from "next/server";

type InvoiceItem = {
  name: string;
  price: number;
  quantity: number;
  variantId: string;
  mrp: number;
  gstRate: number;
  hsn?: string;
};

type IInvoiceOfferQualification = {
  offerId: string | any;
  offerName: string;
  qualified: boolean;
  prizeName?: string;
  prizeRank?: string;
  position?: number;
};

type Invoice = {
  invoiceNumber: string;
  items: InvoiceItem[];
  totalPayable: number;
  offerQualifications?: IInvoiceOfferQualification[];
};

type Customer = {
  name: string;
  phone: string;
};

/**
 * Generate simple text invoice for WhatsApp
 * Returns formatted text instead of PDF to avoid font issues
 */
function generateInvoiceText(
  invoice: Invoice,
  customer: Customer
): string {
  const lines: string[] = [];
  
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("📄 INVOICE");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");
  lines.push(`Invoice #: ${invoice.invoiceNumber}`);
  lines.push(`Date: ${new Date().toLocaleDateString()}`);
  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("👤 CUSTOMER DETAILS");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push(`Name: ${customer.name}`);
  lines.push(`Phone: ${customer.phone}`);
  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("🛒 ITEMS");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  invoice.items.forEach((item, index) => {
    const itemTotal = item.quantity * item.price;
    lines.push(`${index + 1}. ${item.name}`);
    lines.push(`   Qty: ${item.quantity} × ₹${item.price.toFixed(2)} = ₹${itemTotal.toFixed(2)}`);
    if (item.gstRate > 0) {
      lines.push(`   GST: ${item.gstRate}%`);
    }
    lines.push("");
  });
  
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("💰 TOTAL");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push(`Total Payable: ₹${invoice.totalPayable.toFixed(2)}`);
  lines.push("");
  
  // Add offer qualifications if any
  if (invoice.offerQualifications && invoice.offerQualifications.length > 0) {
    const qualified = invoice.offerQualifications.filter((q: IInvoiceOfferQualification) => q.qualified);
    if (qualified.length > 0) {
      lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━");
      lines.push("🎉 CONGRATULATIONS!");
      lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━");
      qualified.forEach((offer: IInvoiceOfferQualification) => {
        lines.push(`✓ ${offer.offerName}`);
        if (offer.prizeName) {
          lines.push(`  Prize: ${offer.prizeName}`);
        }
        if (offer.prizeRank) {
          lines.push(`  Rank: ${offer.prizeRank}`);
        }
        lines.push("");
      });
    }
  }
  
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("Thank you for your purchase!");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  return lines.join("\n");
}

/**
 * Send message via WhatsApp Business API
 */
async function sendWhatsAppMessage(
  whatsappNumber: string,
  message: string,
  invoice: Invoice
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const WHATSAPP_API = process.env.WHATSAPP_API;
  const WHATSAPP_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const WHATSAPP_SECRET = process.env.WHATSAPP_TOKEN;

  if (!WHATSAPP_API || !WHATSAPP_ID || !WHATSAPP_SECRET) {
    throw new Error("WhatsApp API credentials not configured");
  }

  try {
    // Format phone number (remove + and spaces)
    const formattedNumber = whatsappNumber.replace(/[^0-9]/g, "");

    // Send text message
    const messagePayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedNumber,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    };

    const sendResponse = await fetch(
      `${WHATSAPP_API}/${WHATSAPP_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messagePayload),
      }
    );

    if (!sendResponse.ok) {
      const error = await sendResponse.text();
      console.error("WhatsApp message send failed:", error);
      throw new Error(`Message send failed: ${sendResponse.status}`);
    }

    const sendResult = await sendResponse.json();

    return {
      success: true,
      messageId: sendResult.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice, customer, whatsappNumber } = body;

    // Validate input
    if (!invoice || !customer || !whatsappNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Generate invoice text
    const invoiceText = generateInvoiceText(invoice, customer);

    // Send via WhatsApp
    const result = await sendWhatsAppMessage(
      whatsappNumber,
      invoiceText,
      invoice
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          registered: true,
          message: result.error || "Failed to send WhatsApp message",
        },
        { status: 500 }
      );
    }

    // Check for prizes
    const hasPrizes =
      invoice.offerQualifications &&
      invoice.offerQualifications.some((q: IInvoiceOfferQualification) => q.qualified);
    const prizeCount = hasPrizes
      ? invoice.offerQualifications!.filter((q: IInvoiceOfferQualification) => q.qualified).length
      : 0;

    return NextResponse.json({
      success: true,
      registered: true,
      hasPrizes,
      prizeCount,
      messageId: result.messageId,
      message: "Invoice sent successfully via WhatsApp",
    });
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return NextResponse.json(
      {
        success: false,
        registered: true,
        message: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}