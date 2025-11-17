// src/components/Searchbar.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePosStore } from "@/store/posStore";
import dynamic from "next/dynamic";
import { Camera, X } from "lucide-react";

// ✅ Dynamically import Scanner correctly
const QrScanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
);

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
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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

  const handleQrResult = (result: string | null) => {
    if (!result) return;
    try {
      const parsed = JSON.parse(result);
      const product = products.find(
        (v) => v._id === parsed.variantId || v.product._id === parsed.productId
      );
      if (product) addToCart(product);
      else alert("❌ Product not found for scanned QR code.");
    } catch {
      const product = products.find(
        (v) => v._id === result || v.product._id === result
      );
      if (product) addToCart(product);
      else alert("❌ Invalid QR or product not found.");
    }
    setIsScannerOpen(false);
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
        />
        <Button
          size="icon"
          variant="outline"
          className="bg-gray-800 hover:bg-gray-700 text-yellow-400"
          onClick={() => setIsScannerOpen((prev) => !prev)}
        >
          {isScannerOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 📸 QR Scanner Overlay */}
      {isScannerOpen && (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4 rounded-lg">
          <div className="w-full max-w-sm rounded-lg overflow-hidden border border-gray-700 bg-gray-950 shadow-lg">
            <QrScanner
              onScan={(detectedCodes) => {
                const code = detectedCodes?.[0]?.rawValue;
                if (code) handleQrResult(code);
              }}
              onError={(error) => {
                console.error("QR Scanner Error:", error);
              }}
              constraints={{ facingMode: "environment" }}
              styles={{ container: { width: "100%" } }}
            />
          </div>

          <Button
            variant="secondary"
            className="mt-4 text-white border-gray-700 hover:bg-gray-800"
            onClick={() => setIsScannerOpen(false)}
          >
            Close Scanner
          </Button>
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
