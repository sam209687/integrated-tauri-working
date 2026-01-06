// src/app/(admin)/admin/products/page.tsx
"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/tables/ProductTable";
import { columns } from "./_components/columns";
import { deleteProduct, getProducts } from "@/actions/product.actions";
import { IPopulatedProduct } from "@/lib/models/product";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<IPopulatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const result = await getProducts();
      if (result.success && result.data) {
        setProducts(result.data);
      } else {
        toast.error(result.message || "Failed to fetch products");
      }
    } catch (error) {
      toast.error("An error occurred while fetching products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setDeleteLoading(true);
    try {
      const result = await deleteProduct(id);
      if (result.success) {
        toast.success(result.message || "Product deleted successfully");
        fetchProducts();
      } else {
        toast.error(result.message || "Failed to delete product");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the product");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Calculate selling type statistics
  const stats = {
    total: products.length,
    fixed: products.filter(p => p.sellingType === "FIXED").length,
    weight: products.filter(p => p.sellingType === "WEIGHT").length,
    volume: products.filter(p => p.sellingType === "VOLUME").length,
    value: products.filter(p => p.sellingType === "VALUE").length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-2">
            Manage your product inventory with flexible selling types
          </p>
        </div>
        <Button onClick={() => router.push("/admin/products/add-product")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-500 p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-600">Total Products</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 flex items-center gap-1">
            📦 Fixed
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.fixed}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 flex items-center gap-1">
            ⚖️ Weight
          </div>
          <div className="text-2xl font-bold text-green-900">{stats.weight}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-600 flex items-center gap-1">
            🧪 Volume
          </div>
          <div className="text-2xl font-bold text-purple-900">{stats.volume}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-sm text-orange-600 flex items-center gap-1">
            💰 Value
          </div>
          <div className="text-2xl font-bold text-orange-900">{stats.value}</div>
        </div>
      </div>

      {/* Products Table */}
      <DataTable 
        columns={columns(handleDelete, deleteLoading)} 
        data={products} 
        searchKey="productName" 
      />
    </div>
  );
}