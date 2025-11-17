import { redirect } from "next/navigation";
import { Heading } from "@/components/ui/heading";
import ProductForm from "@/components/forms/ProductForm";
import { getProductById } from "@/actions/product.actions";

// ✅ Force dynamic rendering to prevent static build serialization issues
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function EditProductPage({
  searchParams,
}: {
  searchParams: Promise<{ id: string }>;
}) {
  const { id } = await searchParams; // ✅ Await the promise to extract id

  if (!id) {
    redirect("/admin/products");
  }

  const productResult = await getProductById(id);

  if (!productResult.success || !productResult.data) {
    redirect("/admin/products");
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading title="Edit Product" description="Edit an existing product" />
        <ProductForm initialData={productResult.data} />
      </div>
    </div>
  );
}
