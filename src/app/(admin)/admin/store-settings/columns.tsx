// src/app/(admin)/admin/store-settings/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit } from "lucide-react"; // 💡 FIX 1: Removed unused 'Trash' import
import { Button } from "@/components/ui/button";
import { IStore } from "@/lib/models/store";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { deleteStore } from "@/actions/store.actions";
import { toast } from "sonner";
import { AlertModal } from "@/components/modals/AlertModal";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

// --- FIX START: Extracted logic into a React Component ---

interface StoreActionsCellProps {
  store: IStore;
}

const StoreActionsCell: React.FC<StoreActionsCellProps> = ({ store }) => {
  // 💡 FIX 2: Hooks are now correctly called inside a functional component
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    // Assuming store._id is a string or castable to string
    const result = await deleteStore(store._id as string); 
    if (result.success) {
      toast.success("Store deleted successfully. Refreshing list...");
      // A simple way to trigger a refresh for data fetched on the client-side
      window.location.reload(); 
    } else {
      toast.error("Failed to delete store.");
    }
    setIsDeleting(false);
    setShowModal(false);
  };

  return (
    <>
      <AlertModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <Edit className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/store-settings/edit/${store._id}`}>
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowModal(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

// --- FIX END: Extracted logic into a React Component ---


export const columns: ColumnDef<IStore>[] = [
  {
    accessorKey: "storeName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Store Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "contactNumber",
    header: "Contact",
  },
  // ✅ NEW: Added columns for new fields
  {
    accessorKey: "fssai",
    header: "FSSAI",
  },
  {
    accessorKey: "pan",
    header: "PAN",
  },
  {
    accessorKey: "gst",
    header: "GST",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          className={status === "ACTIVE" ? "bg-green-500 hover:bg-green-500" : "bg-red-500 hover:bg-red-500"}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    // 💡 FIX 3: Use the new component inside the cell
    cell: ({ row }) => <StoreActionsCell store={row.original} />,
  },
];