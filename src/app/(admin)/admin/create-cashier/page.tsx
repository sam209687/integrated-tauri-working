// src/app/(admin)/admin/create-cashier/page.tsx
import { CashierCreationForm } from "../_components/CashierCreationForm";

// 🚀 Fix: Prevent static optimization to avoid “Unexpected token '|'”
// These flags force dynamic rendering and prevent Next.js from trying to serialize unhandled data.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function CreateCashierPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Cashier Account</h1>
      <div className="max-w-md">
        <CashierCreationForm />
      </div>
    </div>
  );
}
