// src/app/api/customers/bulk-register/route.ts

import { NextResponse } from 'next/server';
import Customer from '@/lib/models/customer';
import { connectToDatabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { chatId } = await request.json();

    if (!chatId) {
      return NextResponse.json(
        { success: false, message: 'Chat ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Update ALL customers without telegramChatId
    const result = await Customer.updateMany(
      { 
        $or: [
          { telegramChatId: { $exists: false } },
          { telegramChatId: null },
          { telegramChatId: "" }
        ]
      },
      { 
        $set: { 
          telegramChatId: chatId,
          updatedAt: new Date()
        } 
      }
    );

    console.log(`✅ Bulk registered ${result.modifiedCount} customers to chat ID: ${chatId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully registered ${result.modifiedCount} customers`,
      count: result.modifiedCount,
      chatId: chatId
    });
  } catch (error) {
    console.error('❌ Bulk registration failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Bulk registration failed' 
      },
      { status: 500 }
    );
  }
}