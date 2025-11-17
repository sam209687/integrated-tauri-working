// src/app/(cashier)/cashier/pos/page.tsx
import { Searchbar } from "@/components/pos/Searchbar";
import { BillingSection } from "@/components/pos/BillingSection";
import { LiveCart } from "@/components/pos/LiveCart";
import { PrintPreview } from "@/components/pos/PrintPreview";

// ✅ Server-only configuration
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function CashierPOSPage() {
  return (
    <div className="w-full h-screen p-4 bg-gray-800 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Point of Sale
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        <div className="h-[450px] bg-gray-900 rounded-lg overflow-hidden">
          <Searchbar />
        </div>
        <div className="h-[450px] bg-gray-900 rounded-lg overflow-hidden">
          <BillingSection />
        </div>
      </div>

      <div className="flex-1 w-full mt-4">
        <LiveCart />
      </div>

      <PrintPreview />
    </div>
  );
}
