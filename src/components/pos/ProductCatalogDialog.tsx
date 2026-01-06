// src/components/pos/ProductCatalogDialog.tsx
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, X, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IPosVariant } from '@/types/pos.type';
// import type { IPosVariant } from '@/types/pos.types';

interface GroupedProduct {
  categoryName: string;
  productName: string;
  brandName: string;
  productCode: string;
  price: number;
  unit: string;
  volume: number;
  color?: string;
  stockQuantity: number;
}

interface ProductCatalogDialogProps {
  products: IPosVariant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductCatalogDialog({ products, open, onOpenChange }: ProductCatalogDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Map();
    products.forEach((variant) => {
      if (variant.product?.category) {
        uniqueCategories.set(
          variant.product.category._id,
          variant.product.category
        );
      }
    });
    return Array.from(uniqueCategories.values());
  }, [products]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    const grouped: Record<string, GroupedProduct[]> = {};

    products.forEach((variant) => {
      if (!variant.product) return;

      const categoryName = variant.product.category?.name || 'Uncategorized';
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }

      grouped[categoryName].push({
        categoryName,
        productName: variant.product.productName,
        brandName: variant.product.brand?.name || 'Unknown Brand',
        productCode: variant.product.productCode,
        price: variant.price,
        unit: variant.unit?.name || 'Unit',
        volume: variant.variantVolume,
        color: variant.variantColor,
        stockQuantity: variant.stockQuantity,
      });
    });

    // Sort products within each category
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => 
        a.productName.localeCompare(b.productName)
      );
    });

    return grouped;
  }, [products]);

  // Filter grouped products based on search query and category
  const filteredGroupedProducts = useMemo(() => {
    let filtered = groupedProducts;

    // Filter by category if selected
    if (selectedCategoryId) {
      const categoryName = categories.find((c: any) => c._id === selectedCategoryId)?.name;
      if (categoryName) {
        filtered = { [categoryName]: groupedProducts[categoryName] || [] };
      }
    }

    // Filter by search query
    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase();
    const result: Record<string, GroupedProduct[]> = {};

    Object.entries(filtered).forEach(([category, items]) => {
      const filteredItems = items.filter(item => 
        item.productName.toLowerCase().includes(query) ||
        item.brandName.toLowerCase().includes(query) ||
        item.productCode.toLowerCase().includes(query) ||
        item.categoryName.toLowerCase().includes(query) ||
        item.color?.toLowerCase().includes(query)
      );

      if (filteredItems.length > 0) {
        result[category] = filteredItems;
      }
    });

    return result;
  }, [groupedProducts, searchQuery, selectedCategoryId, categories]);

  // Reset search and category when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedCategoryId('');
    }
  }, [open]);

  const categoryCount = Object.keys(filteredGroupedProducts).length;
  const totalProducts = Object.values(filteredGroupedProducts).reduce(
    (sum, items) => sum + items.length, 
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-yellow-500 flex items-center gap-2">
            <Search className="h-5 w-5" />
            Product Catalog
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-1">
            Press <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Ctrl + F1</kbd> to open this catalog
          </p>
        </DialogHeader>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Select
            value={selectedCategoryId || "all"}
            onValueChange={(value) => setSelectedCategoryId(value === "all" ? "" : value)}
          >
            <SelectTrigger className="h-10 bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-yellow-500">
              <SelectValue placeholder="All Categories">
                {selectedCategoryId 
                  ? categories.find((c: any) => c._id === selectedCategoryId)?.name 
                  : "All Categories"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white hover:bg-gray-700">
                All Categories
              </SelectItem>
              {categories.map((category: any) => (
                <SelectItem 
                  key={category._id} 
                  value={category._id}
                  className="text-white hover:bg-gray-700"
                >
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCategoryId && (
            <button
              onClick={() => setSelectedCategoryId('')}
              className="p-2 bg-gray-800 rounded hover:bg-gray-700 text-gray-400"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by product, brand, category, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-yellow-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-400 flex items-center gap-2">
          {selectedCategoryId && (
            <span className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span className="text-yellow-500 font-semibold">
                {categories.find((c: any) => c._id === selectedCategoryId)?.name}
              </span>
              <span>•</span>
            </span>
          )}
          Found {totalProducts} product{totalProducts !== 1 ? 's' : ''} in {categoryCount} categor{categoryCount !== 1 ? 'ies' : 'y'}
        </div>

        {/* Scrollable Product List */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {Object.keys(filteredGroupedProducts).length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No products found</p>
                <p className="text-sm mt-2">Try adjusting your search or category filter</p>
              </div>
            ) : (
              Object.entries(filteredGroupedProducts)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, items]) => (
                  <div key={category} className="space-y-3">
                    {/* Category Header */}
                    <div className="sticky top-0 bg-gray-900 py-2 border-b border-yellow-500">
                      <h3 className="text-lg font-semibold text-yellow-500">
                        {category}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {items.length} product{items.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Products in Category */}
                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <div
                          key={`${item.productCode}-${idx}`}
                          className="p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors border border-gray-700"
                        >
                          <div className="flex justify-between items-start gap-4">
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white truncate">
                                {item.productName}
                              </div>
                              <div className="text-sm text-gray-400 mt-1 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-yellow-400 font-medium">
                                    {item.brandName}
                                  </span>
                                  <span className="text-gray-500">•</span>
                                  <span className="text-gray-300 font-mono text-xs">
                                    {item.productCode}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span>
                                    {item.volume} {item.unit}
                                  </span>
                                  {item.color && (
                                    <>
                                      <span className="text-gray-500">•</span>
                                      <span className="capitalize">{item.color}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Price & Stock */}
                            <div className="text-right shrink-0">
                              <div className="text-lg font-bold text-green-400">
                                ₹{item.price.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Stock: <span className={item.stockQuantity > 10 ? 'text-green-400' : 'text-red-400'}>
                                  {item.stockQuantity}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}