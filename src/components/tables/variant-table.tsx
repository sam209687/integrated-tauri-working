"use client";

import { useEffect } from "react";
import { columns } from "@/app/(admin)/admin/variants/columns";
import { DataTable } from "../ui/data-table";
import { Loader2 } from "lucide-react";
import { useVariantStore } from "@/store/variantStore";

export function VariantTable() {
  const { variants, isLoading, fetchVariants } = useVariantStore();

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={variants}
    />
  );
}
