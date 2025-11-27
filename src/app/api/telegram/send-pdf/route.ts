// src/app/api/telegram/send-pdf/route.ts

import { NextResponse } from 'next/server';

// ✅ Define proper types
interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  variantId?: string;
  mrp?: number;
  gstRate?: number;
  hsn?: string;
}

interface OfferQualification {
  offerId: string;
  offerName: string;
  offerType: 'festival' | 'regular';
  festivalSubType?: 'hitCounter' | 'amountBased';
  regularSubType?: 'visitCount' | 'purchaseAmount';
  qualified: boolean;
  prizeName?: string;
  prizeRank?: 'first' | 'second' | 'third';
  position?: number;
  progressToQualify?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  items: InvoiceItem[];
  totalPayable: number;
  offerQualifications?: OfferQualification[];
}

interface CustomerData {
  name: string;
  phone: string;
}

interface RequestBody {
  invoice: InvoiceData;
  customer: CustomerData;
  chatId?: string | null;
}

export async function POST(request: Request) {
  try {
    const { invoice, customer, chatId }: RequestBody = await request.json();

    // ✅ Check if customer has registered Telegram
    if (!chatId) {
  console.error(`❌ No chat ID provided for: ${customer.name} (${customer.phone})`);
  
  return NextResponse.json(
    { 
      success: false,
      message: 'No Telegram chat ID provided'
    },
    { status: 400 }
  );
}

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN not configured in .env');
      return NextResponse.json(
        { success: false, message: 'Telegram bot not configured' },
        { status: 500 }
      );
    }

    // ✅ Debug logging
    console.log('📱 Sending Telegram invoice:');
    console.log(`   Customer: ${customer.name}`);
    console.log(`   Phone: ${customer.phone}`);
    console.log(`   Chat ID: ${chatId}`);
    console.log(`   Invoice: ${invoice.invoiceNumber}`);

    // ✅ Create items list
    const itemsList = invoice.items
      .map((item: InvoiceItem) => 
        `• ${item.name} x${item.quantity} - ₹${item.price.toFixed(2)}`
      )
      .join('\n');

    // ✅ Check for prize qualifications
    const qualifiedOffers = invoice.offerQualifications?.filter(q => q.qualified) || [];
    const hasPrizes = qualifiedOffers.length > 0;

    console.log(`   Has Prizes: ${hasPrizes ? 'YES (' + qualifiedOffers.length + ')' : 'NO'}`);

    // ✅ Build prize section if customer won
    let prizeSection = '';
    if (hasPrizes) {
      prizeSection = `

━━━━━━━━━━━━━━━
🎉 **CONGRATULATIONS!**
🏆 **YOU WON ${qualifiedOffers.length} PRIZE(S)!**

`;
      
      qualifiedOffers.forEach((offer, index) => {
        prizeSection += `**${index + 1}. ${offer.offerName}**\n`;
        
        if (offer.prizeName) {
          prizeSection += `   🎁 Prize: ${offer.prizeName}\n`;
        }
        
        if (offer.prizeRank) {
          prizeSection += `   🏅 Rank: ${offer.prizeRank.toUpperCase()} PRIZE\n`;
        }
        
        if (offer.position) {
          prizeSection += `   📍 Position: #${offer.position}\n`;
        }
        
        prizeSection += '\n';
      });

      prizeSection += `💡 *Contact our staff to claim your prize(s)!*
━━━━━━━━━━━━━━━`;
    }

    // ✅ Create complete message
    const message = `
🧾 **NEW INVOICE**

📄 Invoice: \`${invoice.invoiceNumber}\`
👤 Customer: ${customer.name}
📞 Phone: ${customer.phone}

**Items:**
${itemsList}

━━━━━━━━━━━━━━━
💰 **Total: ₹${invoice.totalPayable.toFixed(2)}**${prizeSection}

Thank you for your purchase! 🙏
    `.trim();

    // ✅ Send message to customer's Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      console.error('❌ Telegram API error:', result);
      throw new Error(result.description || 'Failed to send Telegram message');
    }

    console.log(`✅ Invoice sent successfully to ${customer.name}'s Telegram`);
    if (hasPrizes) {
      console.log(`   🎉 Prize notification included!`);
    }

    return NextResponse.json({ 
      success: true,
      registered: true,
      messageId: result.result.message_id,
      hasPrizes,
      prizeCount: qualifiedOffers.length
    });
  } catch (error) {
    console.error('❌ Telegram send error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to send invoice' 
      },
      { status: 500 }
    );
  }
}