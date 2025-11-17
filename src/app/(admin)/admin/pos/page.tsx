"use client";

import { Searchbar } from "@/components/pos/Searchbar";
import { BillingSection } from "@/components/pos/BillingSection";
import { LiveCart } from "@/components/pos/LiveCart";
import { PrintPreview } from "@/components/pos/PrintPreview";

export default function POSPage() {
  return (
    <div className="relative w-full h-screen flex flex-col bg-gray-950 text-gray-100">
      {/* ===== Fixed Header ===== */}
      <header className="sticky top-0 z-50 bg-gray-950 border-b border-gray-800 p-4 flex items-center justify-between shadow-md">
        <h2 className="text-3xl font-bold tracking-tight">Point of Sale</h2>
      </header>

      {/* ===== Scrollable Content Area ===== */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ===== Search + Billing Grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[50vh]">
          {/* --- Product Search --- */}
          <div className="flex flex-col bg-gray-900 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-gray-200">
                Product List
              </h3>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <Searchbar />
            </div>
          </div>

          {/* --- Billing Section --- */}
          <div className="flex flex-col bg-gray-900 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-gray-200">
                Billing Section
              </h3>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <BillingSection />
            </div>
          </div>
        </div>

        {/* ===== Live Cart Section ===== */}
        <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden flex flex-col flex-1">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-gray-200">Live Cart</h3>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <LiveCart />
          </div>
        </div>
      </div>

      {/* ===== Print Preview Modal (renders over everything) ===== */}
      <PrintPreview />
    </div>
  );
}
