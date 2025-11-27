// src/components/Searchbar.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePosStore } from "@/store/posStore";
import { X, AlertCircle, CheckCircle, Scan } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [isScannerMode, setIsScannerMode] = useState(false);
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
      if (event.ctrlKey && event.altKey && event.key === "s") {
        event.preventDefault();
        inputRef.current?.focus();
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

  const handleScannerInput = (scannedCode: string) => {
    if (!scannedCode.trim()) return;

    // Clear any existing timeout
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
    }

    try {
      // Try parsing as JSON first (for QR codes with structured data)
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
        
        // Clear scanner input and close after 2 seconds
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
      // If not JSON, treat as plain text (barcode or simple QR)
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
        
        // Clear scanner input and close after 2 seconds
        setTimeout(() => {
          setIsScannerMode(false);
          if (scannerInputRef.current) {
            scannerInputRef.current.value = "";
          }
        }, 2000);
      } else {
        // If not found, populate search bar with scanned code
        setSearchQuery(scannedCode);
        setScanStatus({
          type: "error",
          message: `❌ No exact match found. Search updated with: "${scannedCode}"`,
        });
        
        // Close scanner mode after 3 seconds
        setTimeout(() => {
          setIsScannerMode(false);
        }, 3000);
      }
    }
  };

  const handleScannerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Most barcode scanners send Enter key after scanning
    if (e.key === "Enter") {
      e.preventDefault();
      const scannedCode = (e.target as HTMLInputElement).value;
      handleScannerInput(scannedCode);
      (e.target as HTMLInputElement).value = "";
    }
  };

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    if (!searchQuery) return products.filter((p) => p && p.product);

    const q = searchQuery.toLowerCase();
    return products.filter((variant) => {
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
  }, [products, searchQuery]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 rounded-lg p-4 relative">
      {/* 🔍 Search Header */}
      <div className="flex items-center gap-2 mb-4">
        <Input
          ref={inputRef}
          placeholder="Search by product, code, brand, price..."
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

      {/* 📸 Scanner Mode Interface */}
      {isScannerMode && (
        <div className="mb-4 p-4 bg-gray-800 border-2 border-yellow-500 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-yellow-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-yellow-500">Scanner Mode Active</h3>
          </div>
          
          {/* Hidden input that captures scanner data */}
          <Input
            ref={scannerInputRef}
            type="text"
            placeholder="Scan QR code or barcode..."
            className="h-10 bg-gray-900 border-yellow-500 text-white focus:ring-2 focus:ring-yellow-500"
            onKeyDown={handleScannerKeyDown}
            autoComplete="off"
          />

          {/* Status Message */}
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

          {/* Instructions */}
          <div className="bg-gray-900/50 rounded p-2">
            <p className="text-xs text-gray-400">
              💡 <strong>Tip:</strong> Point your scanner device at the QR code or barcode. 
              The product will be automatically added to cart or search results.
            </p>
          </div>
        </div>
      )}

      {/* 🧾 Product Table */}
      <div className="flex-1 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="text-center text-gray-400 py-8">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No products found or error fetching products.
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
    </div>
  );
}