// src/components/adminPanel/retailCards/RetailBoardPriceCard.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, TrendingUp, AlertCircle, ShoppingCart } from 'lucide-react';
import {  AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  getRetailBoardPriceProducts, 
  updateRetailProductPrice,
  RetailBoardPriceItem 
} from '@/actions/retailBoardPrice.actions';

interface RetailBoardPriceCardProps {
  // No props needed - fetches its own data
}

const EditablePriceRow = ({ 
  product, 
  index,
  onUpdate 
}: { 
  product: RetailBoardPriceItem; 
  index: number;
  onUpdate: () => void;
}) => {
  const [currentPrice, setCurrentPrice] = useState(product.sellingPrice.toString());
  const [isUpdating, setIsUpdating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const isPriceChanged = useMemo(() => {
    const newPrice = parseFloat(currentPrice);
    return !isNaN(newPrice) && newPrice !== product.sellingPrice;
  }, [currentPrice, product.sellingPrice]);

  const handleUpdate = async () => {
    if (!isPriceChanged) return;

    const priceToUpdate = parseFloat(currentPrice);
    if (isNaN(priceToUpdate) || priceToUpdate <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    
    setIsUpdating(true);
    const result = await updateRetailProductPrice(product._id, priceToUpdate);
    
    if (result.success) {
      toast.success("Price updated successfully");
      onUpdate();
    } else {
      toast.error(result.message || "Failed to update price");
      setCurrentPrice(product.sellingPrice.toString());
    }
    setIsUpdating(false);
  };

  return (
    <TableRow 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`border-b dark:border-gray-800 border-gray-200 transition-all duration-300 ${
        isHovered ? 'dark:bg-purple-500/10 bg-purple-50 scale-[1.01]' : ''
      }`}
    >
      <TableCell className="font-medium dark:text-white text-gray-900">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full" />
          {product.productName}
        </div>
      </TableCell>
      <TableCell className="dark:text-gray-400 text-gray-600">
        <span className="px-2 py-1 rounded-full text-xs font-medium dark:bg-blue-500/20 bg-blue-100 dark:text-blue-300 text-blue-700">
          {product.categoryName}
        </span>
      </TableCell>
      <TableCell className="dark:text-gray-400 text-gray-600">
        {product.productCode}
      </TableCell>
      <TableCell className="text-right dark:text-gray-300 text-gray-700">
        ₹ {product.purchasePrice.toFixed(2)}
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          step="0.01"
          value={currentPrice}
          onChange={(e) => setCurrentPrice(e.target.value)}
          disabled={isUpdating}
          className={`h-9 w-full text-right font-bold ${
            isPriceChanged
              ? 'dark:bg-yellow-500/10 bg-yellow-50 dark:border-yellow-500 border-yellow-400'
              : 'dark:bg-white/5 bg-gray-50'
          }`}
        />
      </TableCell>
      <TableCell className="text-right">
        <span className={`font-bold ${
          product.profit >= 0 ? 'text-green-500' : 'text-red-500'
        }`}>
          ₹ {product.profit.toFixed(2)}
        </span>
      </TableCell>
      <TableCell className="text-center">
        <Button
          size="sm"
          onClick={handleUpdate}
          disabled={isUpdating || !isPriceChanged}
          className={`h-8 text-xs ${
            isPriceChanged
              ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
              : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
          }`}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Update
            </>
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
};

export function RetailBoardPriceCard({}: RetailBoardPriceCardProps) {
  const [products, setProducts] = useState<RetailBoardPriceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getRetailBoardPriceProducts();
      if (result.success && result.data) {
        setProducts(result.data);
      } else {
        setError(result.message || "Failed to load data");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card className="backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border rounded-3xl shadow-2xl h-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
          <p className="text-lg font-medium dark:text-white text-gray-900">
            Loading Retail Products...
          </p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="backdrop-blur-2xl dark:bg-red-500/10 bg-red-50/70 dark:border-red-500/30 border rounded-3xl shadow-2xl h-full flex items-center justify-center p-6 min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-500 font-semibold">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-4 border-b dark:border-gray-700/50 border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 shadow-lg">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold dark:text-white text-gray-900 flex items-center gap-2">
                Retail Product Prices
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardTitle>
              <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">
                Excluding edible oils
              </p>
            </div>
          </div>
          
          <div className="px-4 py-2 rounded-xl dark:bg-white/10 bg-gray-100">
            <div className="text-2xl font-bold dark:text-white text-gray-900">
              {products.length}
            </div>
            <div className="text-xs dark:text-gray-400 text-gray-500">
              Products
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full overflow-y-auto max-h-[400px] rounded-2xl dark:bg-white/5 bg-gray-50/50">
          <Table>
            <TableHeader className="sticky top-0 z-10 dark:bg-gray-900/95 bg-white/95 backdrop-blur-md">
              <TableRow className="border-b dark:border-gray-700 border-gray-300">
                <TableHead className="dark:text-gray-300 text-gray-700 font-bold">Product</TableHead>
                <TableHead className="dark:text-gray-300 text-gray-700 font-bold">Category</TableHead>
                <TableHead className="dark:text-gray-300 text-gray-700 font-bold">Code</TableHead>
                <TableHead className="text-right dark:text-gray-300 text-gray-700 font-bold">
                  Purchase Price (₹)
                </TableHead>
                <TableHead className="text-right dark:text-gray-300 text-gray-700 font-bold">
                  Selling Price (₹)
                </TableHead>
                <TableHead className="text-right dark:text-gray-300 text-gray-700 font-bold">
                  Profit (₹)
                </TableHead>
                <TableHead className="text-center dark:text-gray-300 text-gray-700 font-bold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {products.length > 0 ? (
                  products.map((product, index) => (
                    <EditablePriceRow 
                      key={product._id} 
                      product={product} 
                      index={index}
                      onUpdate={fetchData}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <ShoppingCart className="h-12 w-12 dark:text-gray-600 text-gray-400" />
                        <div>
                          <p className="text-lg font-semibold dark:text-gray-400 text-gray-600">
                            No retail products found
                          </p>
                          <p className="text-sm dark:text-gray-500 text-gray-400 mt-1">
                            Products will appear here when available
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {products.length > 0 && (
          <div className="mt-4 px-4 pb-4 flex items-center justify-between text-xs dark:text-gray-400 text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Click on price to edit, press Update to save
            </div>
            <div className="px-3 py-1 rounded-lg dark:bg-white/5 bg-gray-100">
              {products.length} products loaded
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}