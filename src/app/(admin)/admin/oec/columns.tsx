// src/app/(admin)/admin/oec/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { deleteOec } from "@/actions/oec.actions";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { IOec } from "@/store/oecStore"; // Assuming IOec type is defined here or imported

// --- FIX START: Extracted logic into a React Component ---

interface ActionsCellProps {
  oec: IOec;
}

const OECActionsCell: React.FC<ActionsCellProps> = ({ oec }) => {
  // 💡 FIX: Hooks are now correctly called inside a functional component
  const router = useRouter(); 
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteOec(oec._id);
    if (result.success) {
      toast.success("OEC deleted successfully!");
      router.refresh(); // Refresh the page/data after successful deletion
    } else {
      toast.error(result.message || "Failed to delete OEC.");
    }
    setIsDeleting(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/admin/oec/edit/${oec._id}`}>
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <Popover>
          <PopoverTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              Delete
            </DropdownMenuItem>
          </PopoverTrigger>
          <PopoverContent className="w-52">
            <div className="text-center">
              <p className="text-sm font-semibold">Are you sure?</p>
              <p className="text-xs text-muted-foreground mt-1">
                This action cannot be undone.
              </p>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                size="sm"
                className="mt-3 w-full"
                variant="destructive"
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
// --- FIX END: Extracted logic into a React Component ---


export const columns: ColumnDef<IOec>[] = [
  {
    accessorKey: "SNo",
    header: "S/No",
    cell: ({ row }) => {
      return <span>{row.index + 1}</span>;
    },
  },
  {
    id: "productName", // Simple ID for searching
    accessorKey: "product.productName",
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
    cell: ({ row }) => {
      const product = row.original.product;
      return <span>{product?.productName}</span>;
    },
  },
  {
    accessorKey: "product.productCode",
    header: "Product Code",
    cell: ({ row }) => {
      const product = row.original.product;
      return <span>{product?.productCode}</span>;
    },
  },
  {
    accessorKey: "oilExpellingCharges",
    header: "OEC (₹)",
  },
  {
    id: "actions",
    // 💡 FIX: Use the new component inside the cell
    cell: ({ row }) => <OECActionsCell oec={row.original} />, 
  },
];