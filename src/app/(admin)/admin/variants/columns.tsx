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

// --- FIX START: Extracted logic into a functional React Component ---

interface VariantActionsCellProps {
  original: IPopulatedVariant;
}

const VariantActionsCell: React.FC<VariantActionsCellProps> = ({ original }) => {
  // 💡 FIX 1 & 2: Hooks are now correctly called inside a functional component
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const variantId = original._id;

  const onDelete = async () => {
    startTransition(async () => {
      const result = await deleteVariant(variantId);
      if (result.success) {
        toast.success(result.message);
        router.refresh(); // Refresh the data in the table
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
        // Assuming QR generation updates the variant, a refresh might be needed
        // router.refresh(); 
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

// --- FIX END ---


export const columns: ColumnDef<IPopulatedVariant>[] = [
  {
    accessorKey: "product.productName", 
    // ✅ FIX: The id should match the accessorKey for filtering to work
    id: "product.productName", 
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Product
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "variantColor",
    header: "Color",
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "INR",
      }).format(price);

      return formatted;
    },
  },
  {
    accessorKey: "variantVolume",
    header: "Volume",
    cell: ({ row }) => {
      // The `unit` object should be populated by the server action
      return `${row.original.variantVolume} ${row.original.unit.name}`;
    }
  },
  {
    id: "actions",
    // 💡 FIX 3: Use the new component inside the cell
    cell: ({ row }) => <VariantActionsCell original={row.original} />,
  },
];