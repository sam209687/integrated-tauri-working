// src/components/tables/variant-table.tsx
"use client";

import { useEffect } from "react";
import { columns } from "@/app/(admin)/admin/variants/columns";
import { VariantDataTable } from "./variant-data-table";
import { Loader2 } from "lucide-react";
import { useVariantStore } from "@/store/variantStore";

export function VariantTable() {
  const { variants, loading, fetchVariants } = useVariantStore();

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <VariantDataTable
      columns={columns}
      data={variants}
    />
  );
}