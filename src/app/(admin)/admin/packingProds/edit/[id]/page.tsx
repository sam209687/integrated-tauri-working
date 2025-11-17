// src/app/(admin)/admin/packingProds/edit/[id]/page.tsx
import { PackingItemsForm } from "@/components/forms/packingItemsForm";
import { getPackingMaterialById } from "@/actions/packingMaterial.actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ✅ Prevent Next.js static build serialization issues
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function EditPackingMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ Must await params because it’s a Promise
  const { id } = await params;

  // ✅ Fetch material data at runtime, not during build
  const materialResult = await getPackingMaterialById(id);

  if (!materialResult.success || !materialResult.data) {
    notFound();
  }

  const initialData = materialResult.data;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="container mx-auto py-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                Edit Packing Material
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* ✅ Ensure dynamic form rendering */}
              <PackingItemsForm initialData={initialData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
