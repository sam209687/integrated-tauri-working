// src/components/tables/packingItemsTable.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useDebounce } from "@/hooks/use-debounce"; 
import { usePackingMaterialStore, PackingMaterialWithBalance } from "@/store/packingMaterial.store";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Trash2, Package } from "lucide-react";

interface PackingItemsTableProps {
  initialMaterials: PackingMaterialWithBalance[];
}

export function PackingItemsTable({ initialMaterials }: PackingItemsTableProps) {
  const { materials, setMaterials, deleteMaterial, isLoading } = usePackingMaterialStore();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    setMaterials(initialMaterials);
  }, [initialMaterials, setMaterials]);

  const filteredMaterials = materials.filter((material) => {
    const term = debouncedSearchTerm.toLowerCase();
    const volumeString = material.capacityVolume.toString();

    return (
      material.name.toLowerCase().includes(term) ||
      material.manufacturerName.toLowerCase().includes(term) ||
      volumeString.includes(term)
    );
  });

  const handleDelete = (materialId: string) => {
    if (window.confirm("Are you sure you want to delete this packing material?")) {
      setDeletingId(materialId);
      startDeleteTransition(async () => {
        await deleteMaterial(materialId);
        setDeletingId(null);
      });
    }
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg shadow-xl border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-white flex items-center">
            <Package className="mr-2 h-6 w-6 text-blue-400" />
            Packing Materials
        </h2>
        <div className="flex space-x-2">
            <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-gray-800 text-white border-gray-600 focus:border-blue-500"
            />
            <Button asChild className="bg-blue-100 hover:bg-blue-200">
                <Link href="/admin/packingProds/add">
                    Add Product
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                </Link>
            </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-700">
        <Table>
          <TableHeader className="bg-gray-800">
            <TableRow className="border-gray-700 hover:bg-gray-800">
              <TableHead className="text-gray-400">Name of Product</TableHead>
              <TableHead className="text-gray-400">Volume/Capacity</TableHead>
              <TableHead className="text-gray-400">Manufacturer Name</TableHead>
              <TableHead className="text-gray-400 text-right">Purchased Qty</TableHead>
              <TableHead className="text-gray-400 text-right">Balance</TableHead>
              <TableHead className="text-gray-400 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-blue-400">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  Loading Materials...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filteredMaterials.length > 0 ? (
              filteredMaterials.map((material) => (
                <TableRow key={material._id.toString()} className="border-gray-800 hover:bg-gray-800/50">
                  <TableCell className="font-medium text-white">{material.name}</TableCell>
                  <TableCell className="text-gray-300">
                    {material.capacityVolume} {material.capacityUnit.name}
                  </TableCell>
                  <TableCell className="text-gray-300">{material.manufacturerName}</TableCell>
                  <TableCell className="text-right text-yellow-400 font-semibold">{material.purchasedQuantity}</TableCell>
                  <TableCell className={`text-right font-bold ${material.balance < 50 ? 'text-red-500' : 'text-green-400'}`}>
                    {material.balance}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 text-blue-400 border-blue-400 hover:bg-blue-900" asChild>
                        <Link href={`/admin/packingProds/edit/${material._id.toString()}`}>
                            <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8" 
                        onClick={() => handleDelete(material._id.toString())}
                        disabled={isDeleting && deletingId === material._id.toString()}
                      >
                        {isDeleting && deletingId === material._id.toString() ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                !isLoading && (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                            No packing materials found.
                        </TableCell>
                    </TableRow>
                )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}