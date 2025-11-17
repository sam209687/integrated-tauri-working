// src/app/(admin)/admin/tax/add/page.tsx
import { TaxForm } from "@/components/forms/TaxForm";

// ✅ Prevent static rendering & caching (fixes Unexpected token '|' issue)
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function AddTaxPage() {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h1 className="text-3xl font-bold tracking-tight">Add New Tax</h1>
        <TaxForm />
      </div>
    </div>
  );
}
