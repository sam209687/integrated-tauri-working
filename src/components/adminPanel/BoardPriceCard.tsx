// src/components/adminPanel/BoardPriceCard.tsx
"use client";

import { useState, useMemo, useEffect } from 'react'; // 💡 FIX 1: Removed 'useRef'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBoardPriceStore, BoardPriceProduct } from '@/store/boardPrice.store';
import { toast } from 'sonner';

interface BoardPriceCardProps {
  data: BoardPriceProduct[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
}

// Helper to check if a value is a valid price (positive number)
const isValidPrice = (value: number | string | undefined): boolean => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
};

// Component to manage the state of a single editable price row
const EditablePriceRow = ({ product }: { product: BoardPriceProduct }) => {
    const { updatePrice } = useBoardPriceStore();
    // Use string to allow for direct input from user (including '1.', '1.0', etc.)
    const [currentPrice, setCurrentPrice] = useState(product.sellingPrice.toFixed(2));
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Track if the price has been changed relative to the store's version
    const isPriceChanged = useMemo(() => {
        // Compare the value in the input (currentPrice) to the value from the store (product.sellingPrice)
        // Check if the current formatted price strictly equals the store's price
        return parseFloat(currentPrice) !== product.sellingPrice;
    }, [currentPrice, product.sellingPrice]);

    // Effect to update the local state when the global store updates (e.g., after successful save or refresh)
    useEffect(() => {
        // This check implicitly relies on currentPrice's value, which is derived from the input field
        // If the goal is only to update the local state when the global state (product.sellingPrice) changes
        // and the local state (currentPrice) is currently out of sync (i.e., the user hasn't made a change)
        if (parseFloat(currentPrice) !== product.sellingPrice) {
             setCurrentPrice(product.sellingPrice.toFixed(2));
        }
    }, [product.sellingPrice, currentPrice]); // 💡 FIX 2: Added 'currentPrice' to dependency array


    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allows empty string, which is fine for user typing, but must validate before update
        setCurrentPrice(e.target.value); 
    };

    const handleUpdate = async () => {
        if (!isPriceChanged) {
            toast.warning("Price is the same as current price.");
            return;
        }

        const priceToUpdate = parseFloat(currentPrice);
        if (!isValidPrice(priceToUpdate)) {
            toast.error("Please enter a valid price greater than zero.");
            return;
        }
        
        setIsUpdating(true);
        // Round and update
        const finalPrice = parseFloat(priceToUpdate.toFixed(2));
        await updatePrice(product._id, finalPrice);
        setIsUpdating(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleUpdate();
        }
    };

    return (
        <TableRow 
            key={product._id} 
            className="border-gray-800 hover:bg-gray-800/50"
        >
            <TableCell className="font-medium text-sm">{product.productName}</TableCell>
            <TableCell className="text-xs text-gray-400">{product.productCode}</TableCell>
            <TableCell className="text-right">
                <Input
                    type="number"
                    step="0.01"
                    value={currentPrice}
                    onChange={handlePriceChange}
                    onKeyDown={handleKeyDown}
                    disabled={isUpdating}
                    className="h-7 w-full text-right bg-gray-700 border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
            </TableCell>
            <TableCell className="text-center">
                <Button
                    variant="default"
                    size="sm"
                    onClick={handleUpdate}
                    disabled={isUpdating || !isPriceChanged || !isValidPrice(currentPrice)}
                    className="bg-yellow-600 hover:bg-yellow-700 h-7 text-xs"
                >
                    {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        "Update"
                    )}
                </Button>
            </TableCell>
        </TableRow>
    );
};


export function BoardPriceCard({ data, totalCount, isLoading, error }: BoardPriceCardProps) {
  
  if (isLoading) {
    return (
        <Card className="bg-gray-900 text-white border-blue-500 shadow-lg h-full flex items-center justify-center min-h-[250px]">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
            <p>Fetching Board Prices...</p>
        </Card>
    );
  }

  if (error) {
    return (
        <Card className="bg-gray-900 text-red-500 border-red-500 shadow-lg h-full p-4 min-h-[250px]">
            <p>Error: {error}</p>
        </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="h-full"
    >
      <Card className="bg-gray-900 text-white border-gray-700 shadow-lg h-full flex flex-col">
        <CardHeader className="pb-2 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-blue-500" />
              Board Price
            </CardTitle>
            <p className="text-sm font-semibold text-gray-400">
                Total Products ({totalCount})
            </p>
          </div>
        </CardHeader>
        <CardContent className="h-full overflow-y-auto grow max-h-[350px] p-0"> 
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 bg-gray-800 sticky top-0 z-10">
                <TableHead className="text-gray-400">Product Name</TableHead>
                <TableHead className="text-gray-400">Code</TableHead>
                <TableHead className="text-gray-400 text-right w-[150px]">Selling Price (₹)</TableHead>
                <TableHead className="text-gray-400 text-center w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((product) => (
                <EditablePriceRow key={product._id} product={product} />
              ))}
              {data.length === 0 && !isLoading && (
                  <TableRow><TableCell colSpan={4} className="text-center text-gray-500 py-4">No products found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}