// src/app/(admin)/admin/variants/page.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { getVariants } from "@/actions/variant.actions";
import { columns } from "@/app/(admin)/admin/variants/columns";
import { IPopulatedVariant } from "@/lib/models/variant";

// ✅ Prevent Next.js from statically serializing MongoDB data at build time
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const VariantsPage = async () => {
  const variantsResult = await getVariants();

  // ✅ Always fallback to a defined empty array
  const variants: IPopulatedVariant[] =
    variantsResult.success && Array.isArray(variantsResult.data)
      ? (variantsResult.data as IPopulatedVariant[])
      : [];

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading
            title="Variants"
            description="Manage your product variants"
          />
          <Link href="/admin/variants/add-variant">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Variant
            </Button>
          </Link>
        </div>

        <Separator />

        <DataTable
          columns={columns}
          data={variants}
          searchKey="product.productName" // ✅ Nested search supported
        />
      </div>
    </div>
  );
};

export default VariantsPage;
