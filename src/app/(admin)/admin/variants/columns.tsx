// src/app/(admin)/admin/variants/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit, QrCode, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteVariant } from "@/actions/variant.actions";
import { generateVariantQRCode } from "@/actions/qrcode.actions";
import { toast } from "sonner";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { IPopulatedVariant } from "@/lib/models/variant";

interface VariantActionsCellProps {
  original: IPopulatedVariant;
}

const VariantActionsCell: React.FC<VariantActionsCellProps> = ({ original }) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const variantId = original._id;

  const onDelete = async () => {
    startTransition(async () => {
      const result = await deleteVariant(variantId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };
  
  const onGenerateQRCode = async () => {
    startTransition(async () => {
      const result = await generateVariantQRCode(variantId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          ...
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push(`/admin/variants/edit/${variantId}`)}
          disabled={isPending}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onGenerateQRCode}
          disabled={isPending}
        >
          <QrCode className="mr-2 h-4 w-4" />
          Generate QR Code
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          disabled={isPending}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns: ColumnDef<IPopulatedVariant>[] = [
  {
    accessorKey: "product.productName",
    id: "product.productName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Product
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },

  {
    id: "category",
    header: "Category",
    cell: ({ row }) => {
      return row.original.product?.category?.name ?? "Uncategorized";
    },
  },

  {
    accessorKey: "variantColor",
    header: "Color",
    cell: ({ row }) => row.getValue("variantColor") || "—",
  },

  {
    accessorKey: "sellingPrice",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Price
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      // ✅ FIX: Use sellingPrice instead of price
      const price = row.original.sellingPrice;
      if (price === undefined || price === null || isNaN(price)) {
        return "—";
      }
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(price);
    },
  },

  {
    accessorKey: "variantVolume",
    header: "Volume",
    cell: ({ row }) =>
      `${row.original.variantVolume} ${row.original.unit.name}`,
  },

  {
    accessorKey: "stockQuantity",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.original.stockQuantity;
      const alert = row.original.stockAlertQuantity;
      const isLow = stock <= alert;
      
      return (
        <span className={isLow ? "text-red-600 font-semibold" : "text-green-600"}>
          {stock}
        </span>
      );
    },
  },

  {
    id: "actions",
    cell: ({ row }) => <VariantActionsCell original={row.original} />,
  },
];