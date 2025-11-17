// src/app/(admin)/admin/products/_components/columns.tsx
"use client"; 
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Edit, Trash2 } from "lucide-react";
import { IPopulatedProduct } from "@/lib/models/product";
import { useRouter } from "next/navigation"; // Keep the import for the new component

// --- FIX START: Extracted logic into a React Component ---

interface ActionsCellProps {
    row: { original: IPopulatedProduct };
    onDelete: (id: string) => Promise<void>;
    loading: boolean;
}

// 💡 FIX 1: Create a functional component to use the router hook.
const ActionsCell: React.FC<ActionsCellProps> = ({ row, onDelete, loading }) => {
    const router = useRouter(); 
    
    return (
        <div className="flex space-x-2">
            <Button
                variant="outline"
                size="icon"
                onClick={() => router.push(`/admin/products/edit?id=${row.original._id}`)}
            >
                <Edit className="h-4 w-4" />
            </Button>
            <Button
                variant="destructive"
                size="icon"
                onClick={() => onDelete(row.original._id)}
                disabled={loading}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
};
// --- FIX END ---


// 💡 FIX 2: Remove useRouter call from the main columns function.
export const columns = (
  onDelete: (id: string) => Promise<void>,
  loading: boolean
): ColumnDef<IPopulatedProduct>[] => {
  // const router = useRouter(); // ❌ REMOVED: This was the source of the error
  
  return [
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
      accessorKey: "category.name",
      header: "Category",
    },
    // ✅ REMOVED: The stockQuantity column as it was removed from the schema
    {
      accessorKey: "totalPrice",
      header: "Total Price",
      cell: ({ row }) => (
        // ✅ FIX: Added a nullish coalescing operator to prevent TypeError
        <span>₹{(row.original.totalPrice ?? 0).toFixed(2)}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      // 💡 FIX 3: Use the new ActionsCell component
      cell: (props) => (
        <ActionsCell 
            row={props.row} 
            onDelete={onDelete} 
            loading={loading} 
        />
      ),
    },
  ];
};