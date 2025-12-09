// src/lib/telegram/sendPdfToTelegram.ts

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
  telegramChatId?: string | null;
};

type TelegramResult = {
  success: boolean;
  registered: boolean;
  hasPrizes?: boolean;
  prizeCount?: number;
  message: string;
  skipped?: boolean;
};

/**
 * Sends invoice PDF to customer via Telegram
 * Only sends if customer has a registered Telegram chat ID
 * 
 * @param invoice - Invoice data to send
 * @param customer - Customer data including chat ID
 * @returns Result object with success status
 */
export async function sendPdfToTelegram(
  invoice: InvoiceToSend,
  customer: CustomerData
): Promise<TelegramResult> {
  // Check if customer is registered in Telegram
  const chatId = customer.telegramChatId;

  if (!chatId) {
    // Customer not registered - show friendly message, don't send
    toast.info("📱 Customer not registered in Telegram", {
      description: "Invoice saved successfully but not sent via Telegram",
      duration: 3000,
    });

    return {
      success: false,
      registered: false,
      message: "Customer not registered in Telegram",
      skipped: true,
    };
  }

  // Customer is registered - proceed with sending
  try {
    const response = await fetch("/api/telegram/send-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice,
        customer: {
          name: customer.name,
          phone: customer.phone,
        },
        chatId,
      }),
    });

    // Try to parse the response
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error("Telegram API - Failed to parse response:", {
        status: response.status,
        statusText: response.statusText,
      });

      toast.error("Failed to send invoice via Telegram", {
        description: "Invalid response from Telegram API",
      });

      return {
        success: false,
        registered: true,
        message: `API returned invalid JSON (Status: ${response.status})`,
      };
    }

    if (!response.ok) {
      console.error("Telegram API error:", {
        status: response.status,
        statusText: response.statusText,
        result: result,
        chatId: chatId,
      });

      toast.error("Failed to send invoice via Telegram", {
        description: result?.message || `Error: ${response.status}`,
      });

      return {
        success: false,
        registered: true,
        message:
          result?.message || result?.error || `API error (${response.status})`,
      };
    }

    // Success - show appropriate message
    if (result.hasPrizes && result.prizeCount > 0) {
      toast.success(`✅ Invoice sent to Telegram!`, {
        description: `🎉 Customer won ${result.prizeCount} prize(s)!`,
        duration: 5000,
      });
    } else {
      toast.success("✅ Invoice sent to Telegram!", {
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
    console.error("Telegram API - Network error:", {
      errorName: err instanceof Error ? err.name : "Unknown",
      errorMessage: err instanceof Error ? err.message : String(err),
      chatId: chatId,
    });

    toast.error("Failed to send invoice via Telegram", {
      description: "Network error occurred",
    });

    return {
      success: false,
      registered: true,
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}