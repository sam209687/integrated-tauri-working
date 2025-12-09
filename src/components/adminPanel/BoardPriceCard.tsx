// src/components/adminPanel/BoardPriceCard.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, DollarSign, Edit3, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
const EditablePriceRow = ({ product, index }: { product: BoardPriceProduct; index: number }) => {
    const { updatePrice } = useBoardPriceStore();
    const [currentPrice, setCurrentPrice] = useState(product.sellingPrice.toString());
    const [isUpdating, setIsUpdating] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    
    const isPriceChanged = useMemo(() => {
        const newPrice = parseFloat(currentPrice);
        return !isNaN(newPrice) && newPrice !== product.sellingPrice;
    }, [currentPrice, product.sellingPrice]);

    useEffect(() => {
        setCurrentPrice(product.sellingPrice.toString());
    }, [product.sellingPrice]);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow empty, numbers, and decimal point
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setCurrentPrice(value);
        }
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
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`border-b dark:border-gray-800 border-gray-200 transition-all duration-300 ${
                isHovered ? 'dark:bg-blue-500/10 bg-blue-50 scale-[1.01]' : ''
            }`}
        >
            <TableCell className="font-medium dark:text-white text-gray-900">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                        opacity: 1, 
                        x: isHovered ? 5 : 0 
                    }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center gap-2"
                >
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    {product.productName}
                </motion.div>
            </TableCell>
            <TableCell className="dark:text-gray-400 text-gray-600">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 + 0.1 }}
                    className="flex items-center gap-2"
                >
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    {product.variantVolume || 'N/A'}
                </motion.div>
            </TableCell>
            <TableCell className="dark:text-gray-400 text-gray-600">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 + 0.15 }}
                    className="flex items-center gap-2"
                >
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    {product.unit?.name || 'N/A'}
                </motion.div>
            </TableCell>
            <TableCell className="dark:text-gray-400 text-gray-600">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 + 0.2 }}
                    className="flex items-center gap-2"
                >
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    {product.productCode}
                </motion.div>
            </TableCell>
            <TableCell className="text-right">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 + 0.25 }}
                    className="relative"
                >
                    <Input
                        type="text"
                        inputMode="decimal"
                        value={currentPrice}
                        onChange={handlePriceChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        disabled={isUpdating}
                        className={`h-9 w-full text-right font-bold transition-all duration-300 ${
                            isFocused 
                                ? 'dark:bg-blue-500/20 bg-blue-100 dark:border-blue-500 border-blue-400 ring-2 dark:ring-blue-500/50 ring-blue-400/50' 
                                : isPriceChanged
                                    ? 'dark:bg-yellow-500/10 bg-yellow-50 dark:border-yellow-500 border-yellow-400'
                                    : 'dark:bg-white/5 bg-gray-50 dark:border-gray-700 border-gray-300'
                        } dark:text-white text-gray-900`}
                    />
                    {isPriceChanged && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -right-2 -top-2"
                        >
                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                        </motion.div>
                    )}
                </motion.div>
            </TableCell>
            <TableCell className="text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 + 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleUpdate}
                        disabled={isUpdating || !isPriceChanged || !isValidPrice(currentPrice)}
                        className={`h-8 text-xs font-semibold transition-all duration-300 ${
                            isPriceChanged && isValidPrice(currentPrice)
                                ? 'bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg border-none'
                                : 'bg-gray-600 hover:bg-gray-700 text-gray-300 border-none'
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
                </motion.div>
            </TableCell>
        </TableRow>
    );
};

export function BoardPriceCard({ data, totalCount, isLoading, error }: BoardPriceCardProps) {
  const [hoveredHeader, setHoveredHeader] = useState(false);
  
  // Loading state
  if (isLoading) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group h-full"
        >
            <motion.div
                className="absolute inset-0 rounded-3xl blur-xl opacity-50"
                style={{ background: 'rgba(59, 130, 246, 0.3)' }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
            <Card className="relative backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border-white/50 border rounded-3xl shadow-2xl h-full flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <Loader2 className="h-12 w-12 text-blue-500" />
                    </motion.div>
                    <motion.p
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-lg font-medium dark:text-white text-gray-900"
                    >
                        Fetching Board Prices...
                    </motion.p>
                </div>
            </Card>
        </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group h-full"
        >
            <Card className="relative backdrop-blur-2xl dark:bg-red-500/10 bg-red-50/70 dark:border-red-500/30 border-red-300 border rounded-3xl shadow-2xl h-full flex items-center justify-center p-6 min-h-[400px]">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                    <p className="text-red-500 font-semibold">Error: {error}</p>
                </div>
            </Card>
        </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="h-full relative group"
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'rgba(59, 130, 246, 0.3)' }}
      />

      <Card className="relative backdrop-blur-2xl dark:bg-white/10 bg-white/70 dark:border-white/20 border-white/50 border rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col">
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 bg-linear-to-br dark:from-blue-500/10 dark:to-cyan-500/10 from-blue-100 to-cyan-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          <CardHeader 
            className="pb-4 border-b dark:border-gray-700/50 border-gray-300"
            onMouseEnter={() => setHoveredHeader(true)}
            onMouseLeave={() => setHoveredHeader(false)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ 
                    rotate: hoveredHeader ? 360 : 0,
                    scale: hoveredHeader ? 1.1 : 1
                  }}
                  transition={{ duration: 0.5 }}
                  className="p-2 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 shadow-lg"
                >
                  <DollarSign className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <CardTitle className="text-xl font-bold dark:text-white text-gray-900 flex items-center gap-2">
                    Board Price
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardTitle>
                  <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">
                    Manage product pricing
                  </p>
                </div>
              </div>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="px-4 py-2 rounded-xl dark:bg-white/10 bg-gray-100"
              >
                <div className="text-2xl font-bold dark:text-white text-gray-900">
                  {totalCount}
                </div>
                <div className="text-xs dark:text-gray-400 text-gray-500">
                  Products
                </div>
              </motion.div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-0">
            <div className="h-full overflow-y-auto max-h-[400px] rounded-2xl dark:bg-white/5 bg-gray-50/50 backdrop-blur-sm">
              <Table>
                <TableHeader className="sticky top-0 z-10 dark:bg-gray-900/95 bg-white/95 backdrop-blur-md">
                  <TableRow className="border-b dark:border-gray-700 border-gray-300">
                    <TableHead className="dark:text-gray-300 text-gray-700 font-bold">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-500" />
                        Product Name
                      </div>
                    </TableHead>
                    <TableHead className="dark:text-gray-300 text-gray-700 font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full" />
                        Volume
                      </div>
                    </TableHead>
                    <TableHead className="dark:text-gray-300 text-gray-700 font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full" />
                        Unit
                      </div>
                    </TableHead>
                    <TableHead className="dark:text-gray-300 text-gray-700 font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Code
                      </div>
                    </TableHead>
                    <TableHead className="text-right dark:text-gray-300 text-gray-700 font-bold w-[150px]">
                      <div className="flex items-center justify-end gap-2">
                        <TrendingUp className="h-4 w-4 text-yellow-500" />
                        Selling Price (₹)
                      </div>
                    </TableHead>
                    <TableHead className="text-center dark:text-gray-300 text-gray-700 font-bold w-[100px]">
                      <div className="flex items-center justify-center gap-2">
                        <Edit3 className="h-4 w-4 text-purple-500" />
                        Actions
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {data.length > 0 ? (
                      data.map((product, index) => (
                        <EditablePriceRow key={product._id} product={product} index={index} />
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center gap-4"
                          >
                            <div className="p-4 rounded-full dark:bg-white/5 bg-gray-100">
                              <DollarSign className="h-12 w-12 dark:text-gray-600 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-lg font-semibold dark:text-gray-400 text-gray-600">
                                No products found
                              </p>
                              <p className="text-sm dark:text-gray-500 text-gray-400 mt-1">
                                Products will appear here when available
                              </p>
                            </div>
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Footer Info */}
            {data.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-4 px-4 pb-4 flex items-center justify-between text-xs dark:text-gray-400 text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Click on price to edit, press Enter to save
                </div>
                <div className="px-3 py-1 rounded-lg dark:bg-white/5 bg-gray-100">
                  {data.length} of {totalCount} loaded
                </div>
              </motion.div>
            )}
          </CardContent>
        </div>

        {/* Corner Decorations */}
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-linear-to-br from-blue-500 to-cyan-500 opacity-20 rounded-full blur-3xl" />
        <div className="absolute -top-8 -left-8 w-32 h-32 bg-linear-to-br from-blue-500 to-cyan-500 opacity-20 rounded-full blur-3xl" />
      </Card>
    </motion.div>
  );
}