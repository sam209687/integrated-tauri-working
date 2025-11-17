// src/app/(admin)/admin/brand/edit/[id]/page.tsx
import { BrandForm } from "@/components/forms/BrandForm";
import { getBrandById } from "@/actions/brand.actions";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// 🚀 Prevent static optimization — fixes “Unexpected token '|'” error
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const Loading = () => (
  <div className="flex justify-center items-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getBrandById(id);

  if (!result.success || !result.data) {
    redirect("/admin/brand");
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading title="Edit Brand" description="Update the brand details." />
        <Separator />
        <Suspense fallback={<Loading />}>
          <BrandForm initialData={JSON.parse(JSON.stringify(result.data))} />
        </Suspense>
      </div>
    </div>
  );
}
