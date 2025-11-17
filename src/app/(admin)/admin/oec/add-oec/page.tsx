// src/app/(admin)/admin/oec/add-oec/page.tsx
import { OecForm } from "@/components/forms/oec-form";

// ✅ Force dynamic rendering to prevent static serialization or chunk parse errors
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function AddOecPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Add New OEC</h2>
      </div>
      <OecForm />
    </div>
  );
}
