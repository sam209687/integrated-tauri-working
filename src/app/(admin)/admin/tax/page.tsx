// src/app/(admin)/admin/tax/page.tsx
import { TaxTable } from "@/components/tables/TaxTable";
import { ITax } from "@/lib/models/tax";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

// ✅ Prevent build-time static analysis & caching
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function getTaxes(): Promise<ITax[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/tax`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch taxes.");
  }

  return res.json();
}

export default async function TaxPage() {
  const taxes = await getTaxes();

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Taxes</h1>
          <Button asChild>
            <Link href="/admin/tax/add-tax">
              <Plus className="mr-2 h-4 w-4" />
              Add Tax
            </Link>
          </Button>
        </div>
        <TaxTable initialTaxes={taxes} />
      </div>
    </div>
  );
}
