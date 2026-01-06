// src/components/Searchbar.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePosStore } from "@/store/posStore";
import { X, AlertCircle, CheckCircle, Scan, ShoppingCart, Calculator, Filter } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RetailBilling } from "@/components/pos/RetailBilling";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCatalogDialog } from "./ProductCatalogDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BillingMode = "daily" | "retail";

export function Searchbar() {
  const {
    products,
    searchQuery,
    setSearchQuery,
    isLoading,
    addToCart,
    fetchProducts,
  } = usePosStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const [billingMode, setBillingMode] = useState<BillingMode>("daily");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isScannerMode, setIsScannerMode] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState<{
    type: "success" | "error" | "waiting" | null;
    message: string;
  }>({ type: null, message: "" });
  const [scannedBuffer, setScannedBuffer] = useState("");
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl + Alt + S for search focus
      if (event.ctrlKey && event.altKey && event.key === "s") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      
      // Ctrl + F1 for product catalog
      if (event.ctrlKey && event.key === "F1") {
        event.preventDefault();
        setIsCatalogOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus scanner input when scanner mode is activated
  useEffect(() => {
    if (isScannerMode && scannerInputRef.current) {
      scannerInputRef.current.focus();
      setScanStatus({ 
        type: "waiting", 
        message: "Ready to scan. Point scanner at QR code or barcode..." 
      });
    } else {
      setScanStatus({ type: null, message: "" });
      setScannedBuffer("");
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
    }
  }, [isScannerMode]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Map();
    products.forEach((variant) => {
      if (variant?.product?.category) {
        uniqueCategories.set(
          variant.product.category._id,
          variant.product.category
        );
      }
    });
    return Array.from(uniqueCategories.values());
  }, [products]);

  const handleScannerInput = (scannedCode: string) => {
    if (!scannedCode.trim()) return;

    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
    }

    try {
      const parsed = JSON.parse(scannedCode);
      const product = products.find(
        (v) => v._id === parsed.variantId || v.product._id === parsed.productId
      );
      
      if (product) {
        addToCart(product);
        setScanStatus({
          type: "success",
          message: `✓ Added: ${product.product.productCode} - ${product.product.productName}`,
        });
        
        setTimeout(() => {
          setIsScannerMode(false);
          if (scannerInputRef.current) {
            scannerInputRef.current.value = "";
          }
        }, 2000);
      } else {
        setScanStatus({
          type: "error",
          message: "❌ Product not found for scanned code.",
        });
      }
    } catch {
      const product = products.find(
        (v) =>
          v.product.productCode === scannedCode ||
          v._id === scannedCode ||
          v.product._id === scannedCode ||
          v.product.productCode?.toLowerCase() === scannedCode.toLowerCase()
      );

      if (product) {
        addToCart(product);
        setScanStatus({
          type: "success",
          message: `✓ Added: ${product.product.productCode} - ${product.product.productName}`,
        });
        
        setTimeout(() => {
          setIsScannerMode(false);
          if (scannerInputRef.current) {
            scannerInputRef.current.value = "";
          }
        }, 2000);
      } else {
        setSearchQuery(scannedCode);
        setScanStatus({
          type: "error",
          message: `❌ No exact match found. Search updated with: "${scannedCode}"`,
        });
        
        setTimeout(() => {
          setIsScannerMode(false);
        }, 3000);
      }
    }
  };

  const handleScannerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const scannedCode = (e.target as HTMLInputElement).value;
      handleScannerInput(scannedCode);
      (e.target as HTMLInputElement).value = "";
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSearchQuery(""); // Reset search when category changes
  };

  // Filter products by category first, then by search
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    
    // First filter by category if one is selected (excluding "all")
    let filtered = selectedCategoryId && selectedCategoryId !== ""
      ? products.filter((v) => v?.product?.category?._id === selectedCategoryId)
      : products;

    // Filter out products with invalid data
    filtered = filtered.filter((p) => p && p.product);

    // Then filter by search query if one exists
    if (!searchQuery) return filtered;

    const q = searchQuery.toLowerCase();
    return filtered.filter((variant) => {
      if (!variant || !variant.product) return false;

      const brandName = variant.product.brand?.name?.toLowerCase() || "";
      const categoryName = variant.product.category?.name?.toLowerCase() || "";
      const variantColor = variant.variantColor?.toLowerCase() || "";
      const productCode = variant.product.productCode?.toLowerCase() || "";
      const productName = variant.product.productName?.toLowerCase() || "";
      const unitName = variant.unit?.name?.toLowerCase() || "";

      return (
        productCode.includes(q) ||
        productName.includes(q) ||
        brandName.includes(q) ||
        categoryName.includes(q) ||
        variantColor.includes(q) ||
        unitName.includes(q) ||
        variant.price.toString().includes(q) ||
        variant.variantVolume.toString().includes(q)
      );
    });
  }, [products, searchQuery, selectedCategoryId]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 rounded-lg p-4 relative">
      {/* Product Catalog Dialog */}
      <ProductCatalogDialog 
        products={products}
        open={isCatalogOpen}
        onOpenChange={setIsCatalogOpen}
      />

      {/* Billing Mode Toggle */}
      <div className="mb-4">
        <Tabs 
          defaultValue="daily" 
          value={billingMode} 
          onValueChange={(value) => {
            setBillingMode(value as BillingMode);
            setSearchQuery("");
            setSelectedCategoryId(""); // Reset category filter
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger 
              value="daily"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Daily Billing
            </TabsTrigger>
            <TabsTrigger 
              value="retail"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Retail Billing
            </TabsTrigger>
          </TabsList>

          {/* Daily Billing Mode */}
          <TabsContent value="daily" className="mt-4 space-y-4">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={selectedCategoryId || "all"}
                  onValueChange={(value) => handleCategoryChange(value === "all" ? "" : value)}
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
              </div>
              {selectedCategoryId && (
                <Button
                  size="icon"
                  variant="outline"
                  className="bg-gray-800 hover:bg-gray-700 text-gray-400"
                  onClick={() => setSelectedCategoryId("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Search Header */}
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                placeholder={selectedCategoryId 
                  ? "Search in selected category... (Ctrl+F1 for catalog)"
                  : "Search by product, code, brand... (Ctrl+F1 for catalog)"}
                className="h-10 bg-gray-800 border-none text-white focus:ring-2 focus:ring-yellow-500 flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isScannerMode}
              />
              <Button
                size="icon"
                variant="outline"
                className={`${
                  isScannerMode 
                    ? "bg-yellow-500 hover:bg-yellow-600 text-black" 
                    : "bg-gray-800 hover:bg-gray-700 text-yellow-400"
                }`}
                onClick={() => setIsScannerMode((prev) => !prev)}
              >
                {isScannerMode ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Scan className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Category Badge (if selected) */}
            {selectedCategoryId && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Filter className="h-4 w-4" />
                <span>
                  Filtering by: <span className="text-yellow-500 font-semibold">
                    {categories.find((c: any) => c._id === selectedCategoryId)?.name}
                  </span>
                </span>
                <span className="text-gray-500">
                  ({filteredProducts.length} products)
                </span>
              </div>
            )}

            {/* Scanner Mode Interface */}
            {isScannerMode && (
              <div className="p-4 bg-gray-800 border-2 border-yellow-500 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Scan className="h-5 w-5 text-yellow-500 animate-pulse" />
                  <h3 className="text-sm font-semibold text-yellow-500">Scanner Mode Active</h3>
                </div>
                
                <Input
                  ref={scannerInputRef}
                  type="text"
                  placeholder="Scan QR code or barcode..."
                  className="h-10 bg-gray-900 border-yellow-500 text-white focus:ring-2 focus:ring-yellow-500"
                  onKeyDown={handleScannerKeyDown}
                  autoComplete="off"
                />

                {scanStatus.message && (
                  <Alert
                    className={`
                      ${scanStatus.type === "success" ? "bg-green-900/50 border-green-500" : ""}
                      ${scanStatus.type === "error" ? "bg-red-900/50 border-red-500" : ""}
                      ${scanStatus.type === "waiting" ? "bg-blue-900/50 border-blue-500" : ""}
                    `}
                  >
                    {scanStatus.type === "success" && <CheckCircle className="h-4 w-4 text-green-400" />}
                    {scanStatus.type === "error" && <AlertCircle className="h-4 w-4 text-red-400" />}
                    {scanStatus.type === "waiting" && <Scan className="h-4 w-4 text-blue-400 animate-pulse" />}
                    <AlertDescription className="text-white text-sm ml-2">
                      {scanStatus.message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-gray-900/50 rounded p-2">
                  <p className="text-xs text-gray-400">
                    💡 <strong>Tip:</strong> Point your scanner device at the QR code or barcode. 
                    The product will be automatically added to cart or search results.
                  </p>
                </div>
              </div>
            )}

            {/* Product Table */}
            <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 400px)' }}>
              {isLoading ? (
                <div className="text-center text-gray-400 py-8">
                  Loading products...
                </div>
              ) : products.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No products found or error fetching products.
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No products found</p>
                  <p className="text-sm mt-2">
                    {selectedCategoryId 
                      ? "Try selecting a different category or adjusting your search"
                      : "Try adjusting your search criteria"}
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm text-gray-300">
                  <thead className="sticky top-0 bg-gray-900 z-10">
                    <tr className="border-b border-gray-700 text-left">
                      <th className="py-2 px-1">Product</th>
                      <th className="py-2 px-1 text-right">Price</th>
                      <th className="py-2 px-1 text-center">Stock</th>
                      <th className="py-2 px-1 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((variant) => (
                      <tr
                        key={variant._id}
                        className="border-b border-gray-800 hover:bg-gray-800 transition-all duration-200 hover:scale-[1.01]"
                      >
                        <td className="py-2 px-1">
                          <div className="font-medium text-gray-100">
                            {variant.product.productCode}
                          </div>
                          <div className="text-xs text-gray-400">
                            {variant.product.productName}
                          </div>
                          <div className="text-xs text-gray-400 font-semibold">
                            {variant.variantVolume} {variant.unit.name}
                          </div>
                          {variant.variantColor && (
                            <div className="text-xs text-gray-400 font-semibold">
                              {variant.variantColor}
                            </div>
                          )}
                        </td>

                        <td className="py-2 px-1 text-right font-bold text-gray-100">
                          ₹ {variant.price.toFixed(2)}
                        </td>
                        <td className="py-2 px-1 text-center text-gray-400">
                          {variant.stockQuantity ?? "—"}
                        </td>
                        <td className="py-2 px-1 text-center">
                          <Button
                            size="sm"
                            className="h-7 px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-xs"
                            onClick={() => addToCart(variant)}
                          >
                            Add
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* Retail Billing Mode */}
          <TabsContent value="retail" className="mt-4">
            <RetailBilling />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}