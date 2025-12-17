// src/components/pos/RetailBilling.tsx
"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePosStore } from "@/store/posStore";
import { IPopulatedVariant } from "@/lib/models/variant";
import { Calculator, Package, IndianRupee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type CalculationMode = "quantity" | "price";

export function RetailBilling() {
  const {
    products,
    searchQuery,
    setSearchQuery,
    isLoading,
    addToCart,
  } = usePosStore();

  const [selectedProduct, setSelectedProduct] = useState<IPopulatedVariant | null>(null);
  const [calculationMode, setCalculationMode] = useState<CalculationMode>("quantity");
  const [quantityInput, setQuantityInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [calculatedResult, setCalculatedResult] = useState<{
    quantity: number;
    price: number;
    displayQuantity: string;
  } | null>(null);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    
    // Filter products: must have product data AND volume >= 1000ml (1 liter)
    let filtered = products.filter((p) => {
      if (!p || !p.product) return false;
      
      // Check if unit is ml/milliliter and volume is >= 1000 (1 liter or more)
      const unitName = p.unit?.name?.toLowerCase() || "";
      const isLiquid = unitName.includes("ml") || unitName === "milliliter";
      
      if (isLiquid && p.variantVolume < 1000) {
        return false; // Exclude products below 1 liter
      }
      
      return true;
    });

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
  }, [products, searchQuery]);

  const formatQuantityDisplay = (quantity: number, unitName: string): string => {
    const lowerUnit = unitName.toLowerCase();
    
    // Handle liquid measurements (ml to liters)
    if (lowerUnit.includes("ml") || lowerUnit === "milliliter" || lowerUnit.includes("ltr") || lowerUnit.includes("liter")) {
      // Round to nearest integer for ml calculations
      const roundedQuantity = Math.round(quantity);
      
      if (roundedQuantity >= 1000) {
        const liters = roundedQuantity / 1000;
        
        // Round to 1 decimal place first
        const roundedLiters = Math.round(liters * 10) / 10;
        
        // Check if the decimal part represents a clean ml amount (like .5 = 500ml)
        const decimalPart = roundedLiters - Math.floor(roundedLiters);
        
        // If decimal is exactly .5, show as ml
        if (decimalPart === 0.5) {
          const wholeLiters = Math.floor(roundedLiters);
          if (wholeLiters > 0) {
            return `${wholeLiters}.5 Liters`; // e.g., 1.5 Liters
          } else {
            return `500 ml`;
          }
        }
        
        // For whole numbers
        if (roundedLiters % 1 === 0) {
          return `${roundedLiters} ${roundedLiters === 1 ? 'Liter' : 'Liters'}`;
        }
        
        // For other decimals, show with 1 decimal
        return `${roundedLiters} Liters`;
      }
      return `${roundedQuantity} ml`;
    }
    
    // Handle weight measurements (grams to kg)
    if (lowerUnit.includes("gram") || lowerUnit === "g" || lowerUnit === "gm" || lowerUnit.includes("kg")) {
      // Round to nearest integer for gram calculations
      const roundedQuantity = Math.round(quantity);
      
      if (roundedQuantity >= 1000) {
        const kg = roundedQuantity / 1000;
        
        // Round to 1 decimal place first
        const roundedKg = Math.round(kg * 10) / 10;
        
        // Check if the decimal part represents a clean gram amount
        const decimalPart = roundedKg - Math.floor(roundedKg);
        
        // If decimal is exactly .5, show appropriately
        if (decimalPart === 0.5) {
          const wholeKg = Math.floor(roundedKg);
          if (wholeKg > 0) {
            return `${wholeKg}.5 Kgs`;
          } else {
            return `500 grams`;
          }
        }
        
        // For whole numbers
        if (roundedKg % 1 === 0) {
          return `${roundedKg} ${roundedKg === 1 ? 'Kg' : 'Kgs'}`;
        }
        
        // For other decimals
        return `${roundedKg} Kgs`;
      }
      return `${roundedQuantity} grams`;
    }
    
    // For other units (pieces, qty, sets, etc.)
    const roundedQuantity = Math.round(quantity);
    return `${roundedQuantity} ${unitName}${roundedQuantity > 1 ? 's' : ''}`;
  };

  const handleProductSelect = (product: IPopulatedVariant) => {
    if (!product.perUnitPrice) {
      alert(`Per unit price is not set for this product variant. Please update the variant settings.`);
      return;
    }
    
    setSelectedProduct(product);
    setQuantityInput("");
    setPriceInput("");
    setCalculatedResult(null);
  };

  const calculateFromQuantity = () => {
    if (!selectedProduct || !quantityInput) return;
    
    const quantity = parseFloat(quantityInput);
    if (isNaN(quantity) || quantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    const perUnitPrice = selectedProduct.perUnitPrice || 0;
    if (perUnitPrice === 0) {
      alert("Per unit price is not available for this product.");
      return;
    }

    const totalPrice = quantity * perUnitPrice;
    const displayQuantity = formatQuantityDisplay(quantity, selectedProduct.unit.name);

    setCalculatedResult({
      quantity,
      price: totalPrice,
      displayQuantity,
    });
  };

  const calculateFromPrice = () => {
    if (!selectedProduct || !priceInput) return;
    
    const targetPrice = parseFloat(priceInput);
    if (isNaN(targetPrice) || targetPrice <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    const perUnitPrice = selectedProduct.perUnitPrice || 0;
    if (perUnitPrice === 0) {
      alert("Per unit price is not available for this product.");
      return;
    }

    const calculatedQuantity = targetPrice / perUnitPrice;
    const displayQuantity = formatQuantityDisplay(calculatedQuantity, selectedProduct.unit.name);

    setCalculatedResult({
      quantity: calculatedQuantity,
      price: targetPrice,
      displayQuantity,
    });
  };

  const handleAddToCart = () => {
    if (!selectedProduct || !calculatedResult) return;

    // Create a custom variant object with calculated values
    // IMPORTANT: The cart expects price per unit, not total price
    const customVariant = {
      ...selectedProduct,
      // Keep the original per-unit price, cart will multiply by quantity
      price: calculatedResult.price, // This is the TOTAL price for this custom quantity
      mrp: selectedProduct.mrp,
      // For retail billing, we always add quantity as 1 because the price is already the total
      quantity: 1,
      // Store metadata for display purposes
      retailBillingData: {
        originalQuantity: calculatedResult.quantity,
        displayQuantity: calculatedResult.displayQuantity,
        perUnitPrice: selectedProduct.perUnitPrice,
      },
    };

    addToCart(customVariant as IPopulatedVariant);
    
    // Reset form
    setSelectedProduct(null);
    setQuantityInput("");
    setPriceInput("");
    setCalculatedResult(null);
    setSearchQuery("");
  };

  const handleReset = () => {
    setSelectedProduct(null);
    setQuantityInput("");
    setPriceInput("");
    setCalculatedResult(null);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 rounded-lg p-4">
      {/* Search Header */}
      <div className="mb-4">
        <Label className="text-gray-300 mb-2 block">Search Product</Label>
        <Input
          placeholder="Search by product, code, brand..."
          className="h-10 bg-gray-800 border-none text-white focus:ring-2 focus:ring-yellow-500"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedProduct(null);
            setCalculatedResult(null);
          }}
        />
      </div>

      {/* Product Selection Area */}
      {!selectedProduct && (
        <div className="flex-1 overflow-y-auto pr-2 mb-4">
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {searchQuery ? "No products found matching your search." : "Start typing to search products."}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((variant) => (
                <Card
                  key={variant._id}
                  className="bg-gray-800 border-gray-700 hover:border-yellow-500 cursor-pointer transition-all"
                  onClick={() => handleProductSelect(variant)}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-100">
                          {variant.product.productCode} - {variant.product.productName}
                        </div>
                        <div className="text-sm text-gray-400">
                          {variant.variantVolume} {variant.unit.name}
                          {variant.variantColor && ` • ${variant.variantColor}`}
                        </div>
                        <div className="text-sm text-yellow-500 font-semibold mt-1">
                          {variant.perUnitPrice 
                            ? `₹${variant.perUnitPrice.toFixed(2)} per ${variant.unit.name}` 
                            : "Per unit price not set"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-100">
                          ₹{variant.price.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Stock: {variant.stockQuantity}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calculation Interface */}
      {selectedProduct && (
        <div className="space-y-4">
          {/* Selected Product Info */}
          <Card className="bg-gray-800 border-yellow-500">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-gray-100">
                    {selectedProduct.product.productName}
                  </div>
                  <div className="text-sm text-gray-400">
                    Code: {selectedProduct.product.productCode}
                  </div>
                  <div className="text-sm text-yellow-500 font-semibold">
                    ₹{selectedProduct.perUnitPrice?.toFixed(2)} per {selectedProduct.unit.name}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReset}
                  className="text-gray-400 hover:text-white"
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              className={`flex-1 ${
                calculationMode === "quantity"
                  ? "bg-yellow-500 text-black hover:bg-yellow-600"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
              onClick={() => {
                setCalculationMode("quantity");
                setPriceInput("");
                setCalculatedResult(null);
              }}
            >
              <Package className="mr-2 h-4 w-4" />
              By Quantity
            </Button>
            <Button
              className={`flex-1 ${
                calculationMode === "price"
                  ? "bg-yellow-500 text-black hover:bg-yellow-600"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
              onClick={() => {
                setCalculationMode("price");
                setQuantityInput("");
                setCalculatedResult(null);
              }}
            >
              <IndianRupee className="mr-2 h-4 w-4" />
              By Price
            </Button>
          </div>

          {/* Input Fields */}
          {calculationMode === "quantity" ? (
            <div className="space-y-3">
              <div>
                <Label className="text-gray-300 mb-2 block">
                  Enter Quantity ({selectedProduct.unit.name})
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={`e.g., 150 ${selectedProduct.unit.name}`}
                    className="bg-gray-800 border-gray-700 text-white"
                    value={quantityInput}
                    onChange={(e) => {
                      setQuantityInput(e.target.value);
                      setCalculatedResult(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") calculateFromQuantity();
                    }}
                  />
                  <Button
                    onClick={calculateFromQuantity}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-gray-300 mb-2 block">
                  Enter Amount (₹)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 500"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={priceInput}
                    onChange={(e) => {
                      setPriceInput(e.target.value);
                      setCalculatedResult(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") calculateFromPrice();
                    }}
                  />
                  <Button
                    onClick={calculateFromPrice}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Calculation Result */}
          {calculatedResult && (
            <Card className="bg-green-900/20 border-green-500">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-300">
                    <span>Quantity:</span>
                    <span className="font-semibold text-white">
                      {calculatedResult.displayQuantity}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Price per {selectedProduct.unit.name}:</span>
                    <span className="font-semibold text-white">
                      ₹{selectedProduct.perUnitPrice?.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-300">Total Amount:</span>
                      <span className="font-bold text-yellow-500">
                        ₹{calculatedResult.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}