// src/app/(admin)/admin/category/edit/[id]/page.tsx

import { CategoryForm } from "@/components/forms/CategoryForm";
import { ICategory } from "@/lib/models/category";

// ✅ Force runtime rendering (disable static rendering)
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// ✅ Fetch category data directly at runtime
async function getCategory(id: string): Promise<ICategory> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/category/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch category.");
  }

  return res.json();
}

// ✅ FIX: Use Promise<{ id: string }> for Next.js dynamic route params
export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await getCategory(id);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
        <CategoryForm initialData={category} />
      </div>
    </div>
  );
}
