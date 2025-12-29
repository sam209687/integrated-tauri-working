import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Type definitions matching your database structure
interface Brand {
  _id: string;
  name: string;
}

interface Category {
  _id: string;
  name: string;
}

interface Unit {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  productCode: string;
  productName: string;
  brand: Brand;
  category: Category;
}

interface PopulatedVariant {
  _id: string;
  product: Product;
  variantVolume: number;
  unit: Unit;
  variantColor?: string;
  price: number;
  stockQuantity: number;
}

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
  products: PopulatedVariant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductCatalogDialog({ products, open, onOpenChange }: ProductCatalogDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter grouped products based on search query
  const filteredGroupedProducts = useMemo(() => {
    if (!searchQuery.trim()) return groupedProducts;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, GroupedProduct[]> = {};

    Object.entries(groupedProducts).forEach(([category, items]) => {
      const filteredItems = items.filter(item => 
        item.productName.toLowerCase().includes(query) ||
        item.brandName.toLowerCase().includes(query) ||
        item.productCode.toLowerCase().includes(query) ||
        item.categoryName.toLowerCase().includes(query) ||
        item.color?.toLowerCase().includes(query)
      );

      if (filteredItems.length > 0) {
        filtered[category] = filteredItems;
      }
    });

    return filtered;
  }, [groupedProducts, searchQuery]);

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
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
        <div className="text-sm text-gray-400">
          Found {totalProducts} product{totalProducts !== 1 ? 's' : ''} in {categoryCount} categor{categoryCount !== 1 ? 'ies' : 'y'}
        </div>

        {/* Scrollable Product List */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {Object.keys(filteredGroupedProducts).length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No products found</p>
                <p className="text-sm mt-2">Try adjusting your search criteria</p>
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