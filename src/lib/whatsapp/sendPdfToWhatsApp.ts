// src/lib/whatsapp/sendPdfToWhatsApp.ts
// Future WhatsApp Integration - Ready to use when you set up WhatsApp API

import { toast } from "sonner";
import type { IInvoiceOfferQualification } from "@/lib/models/invoice";

type InvoiceItem = {
  name: string;
  price: number;
  quantity: number;
  variantId: string;
  mrp: number;
  gstRate: number;
  hsn?: string;
};

type InvoiceToSend = {
  invoiceNumber: string;
  items: InvoiceItem[];
  totalPayable: number;
  offerQualifications?: IInvoiceOfferQualification[];
};

type CustomerData = {
  name: string;
  phone: string;
  whatsappNumber?: string | null;
};

type WhatsAppResult = {
  success: boolean;
  registered: boolean;
  hasPrizes?: boolean;
  prizeCount?: number;
  message: string;
  skipped?: boolean;
};

/**
 * Sends invoice PDF to customer via WhatsApp
 * Only sends if customer has WhatsApp number
 */
export async function sendPdfToWhatsApp(
  invoice: InvoiceToSend,
  customer: CustomerData
): Promise<WhatsAppResult> {
  const whatsappNumber = customer.whatsappNumber || customer.phone;

  // Check if customer has WhatsApp number
  if (!whatsappNumber) {
    toast.info("📱 Customer doesn't have WhatsApp", {
      description: "Invoice saved successfully but not sent via WhatsApp",
      duration: 3000,
    });

    return {
      success: false,
      registered: false,
      message: "Customer doesn't have WhatsApp number",
      skipped: true,
    };
  }

  // Customer has WhatsApp - proceed with sending
  try {
    const response = await fetch("/api/whatsapp/send-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice,
        customer: {
          name: customer.name,
          phone: customer.phone,
        },
        whatsappNumber,
      }),
    });

    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error("WhatsApp API - Failed to parse response:", {
        status: response.status,
        statusText: response.statusText,
      });

      toast.error("Failed to send invoice via WhatsApp", {
        description: "Invalid response from WhatsApp API",
      });

      return {
        success: false,
        registered: true,
        message: `API returned invalid JSON (Status: ${response.status})`,
      };
    }

    if (!response.ok) {
      console.error("WhatsApp API error:", {
        status: response.status,
        statusText: response.statusText,
        result: result,
        whatsappNumber: whatsappNumber,
      });

      toast.error("Failed to send invoice via WhatsApp", {
        description: result?.message || `Error: ${response.status}`,
      });

      return {
        success: false,
        registered: true,
        message:
          result?.message || result?.error || `API error (${response.status})`,
      };
    }

    // Success
    if (result.hasPrizes && result.prizeCount > 0) {
      toast.success(`✅ Invoice sent to WhatsApp!`, {
        description: `🎉 Customer won ${result.prizeCount} prize(s)!`,
        duration: 5000,
      });
    } else {
      toast.success("✅ Invoice sent to WhatsApp!", {
        duration: 3000,
      });
    }

    return {
      success: result.success,
      registered: result.registered,
      hasPrizes: result.hasPrizes || false,
      prizeCount: result.prizeCount || 0,
      message: result.message,
    };
  } catch (err) {
    console.error("WhatsApp API - Network error:", {
      errorName: err instanceof Error ? err.name : "Unknown",
      errorMessage: err instanceof Error ? err.message : String(err),
      whatsappNumber: whatsappNumber,
    });

    toast.error("Failed to send invoice via WhatsApp", {
      description: "Network error occurred",
    });

    return {
      success: false,
      registered: true,
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}