// src/app/admin/settings/page.tsx or anywhere you want

import { TelegramQRCode } from "@/components/telegram/TelegramQRCode";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <TelegramQRCode />
        {/* Other settings... */}
      </div>
    </div>
  );
}