// src/app/(admin)/admin/manage-cashiers/add/page.tsx
import { AddCashierForm } from "@/components/admin/AddCashierForm";

// ✅ These exports are safe here (this file is purely a server component)
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function AddCashierPage() {
  return (
    <div className="flex flex-col p-6 sm:p-8 lg:p-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Add New Cashier</h1>
      </div>

      {/* ✅ Always wrap a client form inside a container div */}
      <div className="max-w-md">
        <AddCashierForm />
      </div>
    </div>
  );
}
