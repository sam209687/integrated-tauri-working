// src/app/(admin)/admin/products/_components/columns.tsx

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { IPopulatedProduct } from "@/lib/models/product";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

// ✅ SAFE: Helper for multiple selling type badges with fallback
const SellingTypesBadges = ({ types }: { types: string[] | string | undefined }) => {
  const configs = {
    FIXED: { icon: "📦", color: "bg-blue-100 text-blue-800 border-blue-200" },
    WEIGHT: { icon: "⚖️", color: "bg-green-100 text-green-800 border-green-200" },
    VOLUME: { icon: "🧪", color: "bg-purple-100 text-purple-800 border-purple-200" },
    VALUE: { icon: "💰", color: "bg-orange-100 text-orange-800 border-orange-200" },
  };

  // ✅ Handle undefined, single value, or array
  let typesArray: string[];
  
  if (!types) {
    typesArray = [];
  } else if (typeof types === 'string') {
    // Old data: single string value
    typesArray = [types];
  } else if (Array.isArray(types)) {
    // New data: array
    typesArray = types;
  } else {
    typesArray = [];
  }

  if (typesArray.length === 0) {
    return <span className="text-gray-400 text-xs">Not set</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {typesArray.map((type, index) => {
        const config = configs[type as keyof typeof configs] || configs.FIXED;
        return (
          <Badge key={`${type}-${index}`} variant="outline" className={`${config.color} text-xs`}>
            {config.icon}
          </Badge>
        );
      })}
    </div>
  );
};

export const columns = (
  handleDelete: (id: string) => Promise<void>,
  deleteLoading: boolean
): ColumnDef<IPopulatedProduct>[] => [
  {
    accessorKey: "productCode",
    header: "Code",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("productCode") || "N/A"}</span>
    ),
  },
  {
    accessorKey: "productName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Product Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.original.category;
      return category?.name || "N/A";
    },
  },
  {
    accessorKey: "brand",
    header: "Brand",
    cell: ({ row }) => {
      const brand = row.original.brand;
      return brand?.name || "N/A";
    },
  },
  {
    accessorKey: "sellingTypes",
    header: "Selling Types",
    cell: ({ row }) => {
      // ✅ Safe access with fallback to old field name
      const types = row.getValue("sellingTypes") || (row.original as any).sellingType;
      return <SellingTypesBadges types={types} />;
    },
  },
  {
    accessorKey: "baseUnit",
    header: "Base Unit",
    cell: ({ row }) => {
      const baseUnit = row.original.baseUnit;
      return baseUnit?.name || "N/A";
    },
  },
  {
    accessorKey: "allowLooseSale",
    header: "Loose",
    cell: ({ row }) => {
      const allowLooseSale = row.getValue("allowLooseSale");
      return allowLooseSale ? (
        <span className="text-green-600 text-sm">✓</span>
      ) : (
        <span className="text-gray-400 text-sm">✗</span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const router = useRouter();
      const product = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                router.push(`/admin/products/edit-product?id=${product._id}`)
              }
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(product._id)}
              disabled={deleteLoading}
              className="text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" />
              {deleteLoading ? "Deleting..." : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];