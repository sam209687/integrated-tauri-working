// src/app/(admin)/admin/brand/add-brand/page.tsx
import { BrandForm } from "@/components/forms/BrandForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 🚀 Prevent static rendering issues
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function AddBrandPage() {
  return (
    <div className="container mx-auto py-8 flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create a New Brand</CardTitle>
        </CardHeader>
        <CardContent>
          <BrandForm />
        </CardContent>
      </Card>
    </div>
  );
}
