// src/components/pos/RetailBilling.tsx
"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { IPosVariant, usePosStore } from "@/store/posStore";
import { Calculator, Package, IndianRupee, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import type { IPosVariant } from "@/types/pos.types";

type CalculationMode = "quantity" | "price";

export function RetailBilling() {
  const {
    products,
    searchQuery,
    setSearchQuery,
    isLoading,
    addToCart,
  } = usePosStore();

  const [selectedProduct, setSelectedProduct] = useState<IPosVariant | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [calculationMode, setCalculationMode] = useState<CalculationMode>("quantity");
  const [quantityInput, setQuantityInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [calculatedResult, setCalculatedResult] = useState<{
    quantity: number;
    price: number;
    displayQuantity: string;
  } | null>(null);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, IPosVariant[]> = {};

    products.forEach((variant) => {
      if (!variant?.product?.category) return;
      
      const categoryId = variant.product.category._id;
      
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push(variant);
    });

    return grouped;
  }, [products]);

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

  // Get filtered products by category
  const filteredByCategory = useMemo(() => {
    if (!selectedCategoryId) return [];
    return productsByCategory[selectedCategoryId] || [];
  }, [selectedCategoryId, productsByCategory]);

  // Further filter by search query and exclude products below 1 liter
  const filteredProducts = useMemo(() => {
    let filtered = filteredByCategory.filter((p) => {
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
  }, [filteredByCategory, searchQuery]);

  const formatQuantityDisplay = (quantity: number, unitName: string): string => {
    const lowerUnit = unitName.toLowerCase();
    
    // Handle weight measurements (kg to grams)
    if (lowerUnit.includes("kg") || lowerUnit === "kilogram") {
      // Input is in kg, need to show in appropriate format
      const grams = quantity * 1000; // Convert kg to grams
      
      if (grams >= 1000) {
        // Show in kg
        const kg = grams / 1000;
        
        // Check if it's a clean decimal (like 0.5 kg = 500g)
        if (kg < 1 && kg > 0) {
          const gramsValue = Math.round(grams);
          return `${gramsValue} grams`;
        }
        
        // For 1kg or more, show as kg
        if (kg % 1 === 0) {
          return `${kg} ${kg === 1 ? 'Kg' : 'Kgs'}`;
        }
        
        // Show with 1-2 decimal places
        return `${kg.toFixed(kg < 10 ? 2 : 1)} Kgs`;
      } else {
        // Less than 1kg, show in grams
        return `${Math.round(grams)} grams`;
      }
    }
    
    // Handle weight measurements (grams input)
    if (lowerUnit.includes("gram") || lowerUnit === "g" || lowerUnit === "gm") {
      const grams = Math.round(quantity);
      
      if (grams >= 1000) {
        const kg = grams / 1000;
        
        if (kg % 1 === 0) {
          return `${kg} ${kg === 1 ? 'Kg' : 'Kgs'}`;
        }
        
        return `${kg.toFixed(kg < 10 ? 2 : 1)} Kgs`;
      }
      return `${grams} grams`;
    }
    
    // Handle liquid measurements (liters to ml)
    if (lowerUnit.includes("ltr") || lowerUnit.includes("liter") || lowerUnit === "l") {
      // Input is in liters
      const ml = quantity * 1000; // Convert liters to ml
      
      if (ml >= 1000) {
        // Show in liters
        const liters = ml / 1000;
        
        if (liters < 1 && liters > 0) {
          const mlValue = Math.round(ml);
          return `${mlValue} ml`;
        }
        
        if (liters % 1 === 0) {
          return `${liters} ${liters === 1 ? 'Liter' : 'Liters'}`;
        }
        
        return `${liters.toFixed(liters < 10 ? 2 : 1)} Liters`;
      } else {
        return `${Math.round(ml)} ml`;
      }
    }
    
    // Handle liquid measurements (ml input)
    if (lowerUnit.includes("ml") || lowerUnit === "milliliter") {
      const ml = Math.round(quantity);
      
      if (ml >= 1000) {
        const liters = ml / 1000;
        
        if (liters % 1 === 0) {
          return `${liters} ${liters === 1 ? 'Liter' : 'Liters'}`;
        }
        
        return `${liters.toFixed(liters < 10 ? 2 : 1)} Liters`;
      }
      return `${ml} ml`;
    }
    
    // For other units (pieces, qty, sets, etc.)
    const roundedQuantity = Math.round(quantity);
    return `${roundedQuantity} ${unitName}${roundedQuantity > 1 ? 's' : ''}`;
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSearchQuery(""); // Reset search when category changes
    setSelectedProduct(null);
    setCalculatedResult(null);
  };

  const handleProductSelect = (product: IPosVariant) => {
    if (!product.perUnitPrice || product.perUnitPrice === 0) {
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

    // Create a modified variant for cart with retail billing data
    const customVariant: IPosVariant = {
      ...selectedProduct,
      price: calculatedResult.price,
      quantity: 1,
      retailBillingData: {
        originalQuantity: calculatedResult.quantity,
        displayQuantity: calculatedResult.displayQuantity,
        perUnitPrice: selectedProduct.perUnitPrice,
      },
    };

    addToCart(customVariant);
    
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
      {/* Category Selection */}
      <div className="mb-4">
        <Label className="text-gray-300 mb-2 inline-flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Select Category
        </Label>
        <Select
          value={selectedCategoryId}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="h-10 bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-yellow-500">
            <SelectValue placeholder="Choose a category first" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
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

      {/* Search Header (only shows if category is selected) */}
      {selectedCategoryId && (
        <div className="mb-4">
          <Label className="text-gray-300 mb-2 block">Search Product in Category</Label>
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
      )}

      {/* Product Selection Area */}
      {!selectedProduct && selectedCategoryId && (
        <div className="flex-1 overflow-y-auto pr-2 mb-4">
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {searchQuery 
                ? "No products found matching your search." 
                : "No products available in this category."}
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
                          {variant.perUnitPrice > 0
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

      {/* Show message when no category is selected */}
      {!selectedCategoryId && !selectedProduct && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Please select a category first</p>
            <p className="text-sm mt-2">Choose a category to view products</p>
          </div>
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
                    ₹{selectedProduct.perUnitPrice.toFixed(2)} per {selectedProduct.unit.name}
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
                      ₹{selectedProduct.perUnitPrice.toFixed(2)}
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