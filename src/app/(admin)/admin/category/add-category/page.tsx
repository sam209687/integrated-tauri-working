// src/app/(admin)/admin/category/add-category/page.tsx
import { CategoryForm } from "@/components/forms/CategoryForm";

// ✅ Force runtime rendering to avoid static build serialization errors
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function AddCategoryPage() {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h1 className="text-3xl font-bold tracking-tight">Add New Category</h1>
        <CategoryForm />
      </div>
    </div>
  );
}
