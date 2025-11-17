"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { IBrand } from "@/lib/models/brand";
import { useBrandStore } from "@/store/brand.store";
import { useDebounce } from "@/hooks/use-debounce";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Trash2 } from "lucide-react";

interface BrandTableProps {
  initialBrands: IBrand[];
}

export function BrandTable({ initialBrands }: BrandTableProps) {
  const { brands, setBrands, deleteBrand } = useBrandStore();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    setBrands(initialBrands);
  }, [initialBrands, setBrands]);

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const handleDelete = (brandId: string, imageUrl: string) => {
    if (window.confirm("Are you sure you want to delete this brand?")) {
      setDeletingId(brandId);
      startDeleteTransition(() => {
        deleteBrand(brandId, imageUrl).finally(() => setDeletingId(null));
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* 🔍 Search Input */}
      <Input
        placeholder="Search by brand name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full md:max-w-sm"
      />

      {/* 🧾 Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] hidden sm:table-cell">S/No</TableHead>
              <TableHead className="hidden sm:table-cell">Image</TableHead>
              <TableHead className="min-w-[150px]">Name</TableHead>
              <TableHead className="text-right w-[100px] pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredBrands.length > 0 ? (
              filteredBrands.map((brand, index) => (
                <TableRow key={brand._id.toString()}>
                  <TableCell className="hidden sm:table-cell">
                    {index + 1}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      src={brand.imageUrl}
                      alt={brand.name}
                      width={40}
                      height={40}
                      className="rounded-md object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/admin/brand/edit/${brand._id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          handleDelete(brand._id.toString(), brand.imageUrl)
                        }
                        disabled={isDeleting && deletingId === brand._id.toString()}
                      >
                        {isDeleting && deletingId === brand._id.toString() ? (
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
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No brands found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
