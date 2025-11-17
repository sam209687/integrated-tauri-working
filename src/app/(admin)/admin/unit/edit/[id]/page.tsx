// src/app/(admin)/admin/unit/edit/[id]/page.tsx
import { UnitForm } from "@/components/forms/UnitForm";
import { IUnit } from "@/lib/models/unit";

// ✅ Prevent Next.js static optimization & caching issues
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ Must await the Promise in Next.js 15

  // ✅ Server-side fetch for unit data (with no caching)
  async function getUnit(id: string): Promise<IUnit> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/unit/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch unit.");
    }

    return res.json();
  }

  const unit = await getUnit(id);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Edit Unit</h1>
          <UnitForm initialData={unit} />
        </div>
      </div>
    </div>
  );
}
