// src/components/telegram/TelegramQRCode.tsx

"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TelegramQRCode() {
  const [qrCode, setQrCode] = useState<string>("");
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "YourBotUsername";

  useEffect(() => {
    const generateQR = async () => {
      const url = `https://t.me/${botUsername}?start=register`;
      const qr = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setQrCode(qr);
    };

    generateQR();
  }, [botUsername]);

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-center">
          📱 Get Invoices on Telegram
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {qrCode && (
          <Image
            src={qrCode}
            alt="Telegram Bot QR Code"
            width={300}
            height={300}
            className="rounded-lg"
          />
        )}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Scan this QR code with your phone to:
          </p>
          <ul className="text-sm space-y-1">
            <li>✅ Receive invoices instantly</li>
            <li>✅ Get order confirmations</li>
            <li>✅ Stay updated on offers</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-4">
            Or search <strong>@{botUsername}</strong> on Telegram
          </p>
        </div>
      </CardContent>
    </Card>
  );
}