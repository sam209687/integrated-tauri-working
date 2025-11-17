// src/app/(admin)/admin/oec/edit/[id]/page.tsx
import { notFound } from "next/navigation";
import { getOecById } from "@/actions/oec.actions";
import { OecForm } from "@/components/forms/oec-form";

// ✅ Force runtime rendering to prevent static build serialization errors
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function EditOecPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ Must await the params promise

  const result = await getOecById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const initialData = result.data;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Edit OEC</h2>
      </div>
      <OecForm initialData={initialData} />
    </div>
  );
}
