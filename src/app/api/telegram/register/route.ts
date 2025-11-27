// src/app/api/telegram/register/route.ts

import { NextResponse } from 'next/server';
import Customer from '@/lib/models/customer';
import { connectToDatabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { phone, chatId } = await request.json();

    // Validate input
    if (!phone || !chatId) {
      return NextResponse.json(
        { success: false, message: 'Phone number and chat ID are required' },
        { status: 400 }
      );
    }

    // Validate phone number format (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number format. Must be 10 digits.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find customer by phone and update their Telegram chat ID
    const customer = await Customer.findOneAndUpdate(
      { phone },
      { telegramChatId: chatId },
      { new: true }
    );

    if (!customer) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Customer not found. Please ensure you are registered in our system.' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully registered for Telegram notifications!',
      customer: { 
        name: customer.name, 
        phone: customer.phone 
      }
    });
  } catch (error) {
    console.error('Telegram registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}