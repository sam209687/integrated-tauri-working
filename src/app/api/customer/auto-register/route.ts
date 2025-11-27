// src/app/api/customers/auto-register/route.ts

import { NextResponse } from 'next/server';
import Customer from '@/lib/models/customer';
import { connectToDatabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { customerId, chatId } = await request.json();

    if (!customerId || !chatId) {
      return NextResponse.json(
        { success: false, message: 'Customer ID and Chat ID are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { 
        telegramChatId: chatId,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Auto-registered: ${customer.name} (${customer.phone}) -> Chat ID: ${chatId}`);

    return NextResponse.json({ 
      success: true, 
      customer: JSON.parse(JSON.stringify(customer))
    });
  } catch (error) {
    console.error('❌ Auto-registration failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Auto-registration failed' 
      },
      { status: 500 }
    );
  }
}