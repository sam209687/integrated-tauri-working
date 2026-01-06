// src/components/tables/ProductTable.tsx
"use client";

import * as React from "react";
import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, ChevronDown, ChevronRight, Package } from "lucide-react";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  searchKey: string;
}

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
    productName?: string;
    category?: {
      name?: string;
    };
  }
>({ columns, data, searchKey }: DataTableProps<TData>) {
  const [isPending, startTransition] = React.useTransition();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [collapsedCategories, setCollapsedCategories] = React.useState<Set<string>>(new Set());

  const groupedData = React.useMemo(() => {
    const groups: Record<string, TData[]> = {};

    data.forEach(item => {
      const category =
        item.category?.name ||
        resolveCategory(item.productName);

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });

    return groups;
  }, [data]);

  const filteredDataByCategory = React.useMemo(() => {
    if (!globalFilter) return groupedData;

    const filtered: Record<string, TData[]> = {};
    
    Object.entries(groupedData).forEach(([category, items]) => {
      const filteredItems = items.filter((item: any) => {
        const searchValue = globalFilter.toLowerCase();
        
        if (item.productName?.toLowerCase().includes(searchValue)) return true;
        if (item.category?.name?.toLowerCase().includes(searchValue)) return true;
        if (item.productCode?.toLowerCase().includes(searchValue)) return true;
        
        return false;
      });
      
      if (filteredItems.length > 0) {
        filtered[category] = filteredItems;
      }
    });
    
    return filtered;
  }, [groupedData, globalFilter]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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

  const totalCount = data.length;
  const categoryCount = Object.keys(filteredDataByCategory).length;

  return (
    <div className="space-y-6">
      {/* Total Count Card */}
      <Card className="bg-linear-to-r from-indigo-50 to-pink-50 dark:from-indigo-950 dark:to-pink-950 border-indigo-200 dark:border-indigo-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-2xl text-gray-900 dark:text-gray-100">
            <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Total Products
          </CardTitle>
          <CardDescription className="text-gray-700 dark:text-gray-300">
            All products organized by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
            {totalCount}
          </div>
          <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
            Products across {categoryCount} categories
          </p>
        </CardContent>
      </Card>

      {/* Header Area - Search Only (No duplicate button) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <Input
          placeholder="Search by product name, category, or code..."
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="w-full md:max-w-sm"
        />
      </div>

      {/* Tables by Category */}
      <div className="space-y-6">
        {Object.entries(filteredDataByCategory).map(([category, rows]) => {
          const isCollapsed = collapsedCategories.has(category);
          const productCount = rows.length;

          return (
            <Card key={category} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Collapsible Category Heading */}
                <Button
                  variant="ghost"
                  onClick={() => toggleCategory(category)}
                  className="
                    w-full justify-start px-6 py-4 h-auto
                    text-xl font-semibold
                    rounded-t-lg rounded-b-none
                    bg-linear-to-r from-green-50 to-emerald-50
                    hover:from-green-100 hover:to-emerald-100
                    dark:from-green-950 dark:to-emerald-950
                    dark:hover:from-green-900 dark:hover:to-emerald-900
                    border-b border-green-200 dark:border-green-800
                    transition-all
                  "
                >
                  <div className="flex items-center gap-3 w-full">
                    {isCollapsed ? (
                      <ChevronRight className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                    )}
                    <span className="flex-1 text-left text-gray-900 dark:text-gray-100">
                      {category}
                    </span>
                    <span className="text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full">
                      {productCount} {productCount === 1 ? 'product' : 'products'}
                    </span>
                  </div>
                </Button>

                {/* Table - Only show if not collapsed */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                              <TableHead key={header.id} className="min-w-[100px]">
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
                                <TableCell key={cell.id} className="min-w-[100px]">
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {Object.keys(filteredDataByCategory).length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {globalFilter ? "No products match your search" : "No products found"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {globalFilter ? "Try adjusting your search terms" : "Start by creating your first product"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}