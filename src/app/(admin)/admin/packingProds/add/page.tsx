// src/app/(admin)/admin/packingProds/add/page.tsx
import { PackingItemsForm } from "@/components/forms/packingItemsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ✅ Prevent static rendering issues in Next.js (important for Mongoose or complex data)
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function AddPackingMaterialPage() {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="container mx-auto py-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Add New Packing Material</CardTitle>
            </CardHeader>
            <CardContent>
              {/* ✅ Ensure the form starts clean (null initial data) */}
              <PackingItemsForm initialData={null} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
