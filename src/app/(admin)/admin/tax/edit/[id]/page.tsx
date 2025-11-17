// src/app/(admin)/admin/tax/edit/[id]/page.tsx
import { TaxForm } from "@/components/forms/TaxForm";
import { ITax } from "@/lib/models/tax";

// ✅ Prevent static rendering & caching (fixes Unexpected token '|' issue)
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function getTax(id: string): Promise<ITax> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/tax/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch tax.");
  }

  return res.json();
}

// ✅ Fix: params must be Promise<{ id: string }>
export default async function EditTaxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ Must await params in Next.js 15+

  const tax = await getTax(id);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Edit Tax</h1>
          <TaxForm initialData={tax} />
        </div>
      </div>
    </div>
  );
}
