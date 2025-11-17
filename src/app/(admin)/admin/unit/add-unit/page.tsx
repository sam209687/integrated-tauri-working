// src/app/(admin)/admin/unit/add/page.tsx
import { UnitForm } from "@/components/forms/UnitForm";

// ✅ Prevent Next.js from trying to statically analyze or cache this page
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function AddUnitPage() {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Add New Unit</h1>
          <UnitForm />
        </div>
      </div>
    </div>
  );
}
