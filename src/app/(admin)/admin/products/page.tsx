// src/app/(admin)/admin/products/page.tsx
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProductList from "./_components/ProductList";
import { getProducts } from "@/actions/product.actions";

// ✅ Prevent static optimization issues
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ProductsPage() {
  const productsResult = await getProducts();

  // ✅ Safely handle undefined or invalid data
  const products =
    productsResult.success && Array.isArray(productsResult.data)
      ? productsResult.data
      : [];

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          {/* ✅ Always defined */}
          <h1 className="text-3xl font-bold tracking-tight">
            Products ({products.length})
          </h1>

          <Button asChild>
            <Link href="/admin/products/add-product">
              <Plus className="mr-2 h-4 w-4" /> Add New
            </Link>
          </Button>
        </div>

        <ProductList products={products} />
      </div>
    </div>
  );
}
