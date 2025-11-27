// /app/api/telegram/send/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { chatId, message } = await req.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const targetChat = chatId || process.env.TELEGRAM_CHAT_ID;
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: targetChat, text: message, parse_mode: "Markdown" }),
    });
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Telegram API error", err);
    return NextResponse.json({ success: false, err }, { status: 500 });
  }
}
