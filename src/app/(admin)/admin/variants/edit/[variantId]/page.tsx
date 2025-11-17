// src/app/(admin)/admin/variants/edit/[variantId]/page.tsx
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getVariantById } from "@/actions/variant.actions";
import VariantForm from "@/components/forms/variant-form";

// ✅ Prevent static rendering & caching (fixes “Unexpected token '|'”)
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const Loading = () => (
  <div className="flex justify-center items-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

// ✅ params must be awaited (Next.js 15 convention)
export default async function EditVariantPage({
  params,
}: {
  params: Promise<{ variantId: string }>;
}) {
  const { variantId } = await params;

  const result = await getVariantById(variantId);
  const initialData = result.success ? result.data : null;

  const title = initialData ? "Edit Variant" : "Add Variant";
  const description = initialData
    ? `Edit existing variant: ${variantId}`
    : "Could not load variant data, defaulting to add mode.";

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading title={title} description={description} />
        </div>
        <Separator />
        <Suspense fallback={<Loading />}>
          <VariantForm initialData={initialData} />
        </Suspense>
      </div>
    </div>
  );
}
