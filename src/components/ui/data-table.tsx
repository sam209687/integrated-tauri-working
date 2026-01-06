"use client";

import React, { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
}

/* ----------------------------------
 * CATEGORY FALLBACK LOGIC
 * ---------------------------------- */
function resolveCategory(productName: string | undefined) {
  if (!productName) return "Others";

  const name = productName.toLowerCase();

  if (name.includes("oil")) return "Edible Oil";
  if (
    name.includes("powder") ||
    name.includes("masala") ||
    name.includes("chilli") ||
    name.includes("turmeric")
  )
    return "Masala";

  return "Others";
}

export function DataTable<
  TData extends {
    product?: {
      productName?: string;
      category?: {
        name?: string;
      };
    };
  }
>({ columns, data }: DataTableProps<TData>) {
  /* -----------------------------
   * STATE FOR COLLAPSED CATEGORIES
   * ----------------------------- */
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  /* -----------------------------
   * GROUP DATA
   * ----------------------------- */
  const groupedData = useMemo(() => {
    const groups: Record<string, TData[]> = {};

    data.forEach(item => {
      const category =
        item.product?.category?.name ||
        resolveCategory(item.product?.productName);

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });

    return groups;
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  /* -----------------------------
   * TOGGLE COLLAPSE FUNCTION
   * ----------------------------- */
  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <div className="space-y-10">
      {Object.entries(groupedData).map(([category, rows]) => {
        const isCollapsed = collapsedCategories.has(category);
        const productCount = rows.length;

        return (
          <div key={category} className="space-y-3">
            {/* COLLAPSIBLE CATEGORY HEADING */}
            <Button
              variant="ghost"
              onClick={() => toggleCategory(category)}
              className="
                w-full justify-start px-4 py-3 h-auto
                text-xl font-semibold
                rounded-md
                bg-linear-to-r from-indigo-500/20 to-purple-500/20
                hover:from-indigo-500/30 hover:to-purple-500/30
                dark:from-indigo-400/30 dark:to-purple-400/30
                dark:hover:from-indigo-400/40 dark:hover:to-purple-400/40
                transition-all
              "
            >
              <div className="flex items-center gap-3 w-full">
                {isCollapsed ? (
                  <ChevronRight className="h-5 w-5 shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 shrink-0" />
                )}
                <span className="flex-1 text-left">{category}</span>
                <span className="text-sm font-medium bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full">
                  {productCount} {productCount === 1 ? 'product' : 'products'}
                </span>
              </div>
            </Button>

            {/* TABLE - ONLY SHOW IF NOT COLLAPSED */}
            {!isCollapsed && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <TableHead key={header.id}>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>

                  <TableBody>
                    {rows.map(rowData => {
                      const row = table
                        .getRowModel()
                        .rows.find(r => r.original === rowData);

                      if (!row) return null;

                      return (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map(cell => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}