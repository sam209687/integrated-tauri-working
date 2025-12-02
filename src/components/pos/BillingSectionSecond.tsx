// src/components/pos/BillingSectionSecond.tsx
"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, ShoppingCart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { ProductSuggestion } from "@/types/ProductSuggestion"; 

interface OEC {
  _id: string;
  product: { productName: string; productCode: string };
  oilExpellingCharges: number;
}

interface CartItem {
  _id: string;
  product: any;
  price: number;
  quantity: number;
  mrp?: number;
  type?: string;
}

interface BillingSectionSecondProps {
  // computed values
  cart: CartItem[];
  subtotal: number;
  totalGstAmount: number;
  totalPayable: number;
  changeAmount: number;
  debouncedChangeAmount: number;

  // discount
  discount: number;
  setDiscount: (n: number) => void;

  // payment
  paymentMethod: "cash" | "upi" | "card";
  setPaymentMethod: (m: "cash" | "upi" | "card") => void;
  paidAmount: number;
  setPaidAmount: (n: number) => void;

  // GST toggle
  isGstEnabled: boolean;
  toggleGst: () => void;

  // suggestions
  suggestedProducts: ProductSuggestion[];
  isSuggestionLoading: boolean;
  fetchSuggestions: (amount: number) => void;
  clearSuggestions: () => void;
  addToCart: (p: any) => void;

  // OEC
  isOilExpelling: boolean;
  setIsOilExpelling: (v: boolean) => void;
  oecs: OEC[];
  selectedOecId: string | null;
  setSelectedOecId: (id: string | null) => void;
  oecQuantity: number;
  setOecQuantity: (n: number) => void;
  handleAddOec: () => void;

  // packing & others
  excludePacking: boolean;
  setExcludePacking: (v: boolean) => void;
  packingCharges: number;
  setPackingCharges: (n: number) => void;
}

export default function BillingSectionSecond({
  cart,
  subtotal,
  totalGstAmount,
  totalPayable,
  changeAmount,
  debouncedChangeAmount,
  discount,
  setDiscount,
  paymentMethod,
  setPaymentMethod,
  paidAmount,
  setPaidAmount,
  isGstEnabled,
  toggleGst,
  suggestedProducts,
  isSuggestionLoading,
  fetchSuggestions,
  clearSuggestions,
  addToCart,
  isOilExpelling,
  setIsOilExpelling,
  oecs,
  selectedOecId,
  setSelectedOecId,
  oecQuantity,
  setOecQuantity,
  handleAddOec,
  excludePacking,
  setExcludePacking,
  packingCharges,
  setPackingCharges,
}: BillingSectionSecondProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
      <div className="flex justify-between items-center text-sm">
        <span>Total Items:</span>
        <span className="font-semibold">{cart.length}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span>Subtotal:</span>
        <span className="font-semibold">₹ {subtotal.toFixed(2)}</span>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span>Discount (₹):</span>
        <Input
          type="number"
          placeholder="0"
          className="h-8 w-20 bg-gray-800 border-none text-white text-xs text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={discount || ""}
          onChange={(e) => setDiscount(e.target.valueAsNumber || 0)}
        />
      </div>

      {isGstEnabled && (
        <div className="flex justify-between items-center text-sm text-green-400">
          <span>GST Amount:</span>
          <span className="font-semibold">₹ {totalGstAmount.toFixed(2)}</span>
        </div>
      )}

      <div className="flex gap-2 justify-center pt-2">
        <Button
          onClick={() => setPaymentMethod("cash")}
          className={cn(
            "flex-1 font-semibold",
            paymentMethod === "cash"
              ? "bg-green-500 hover:bg-green-600 text-black"
              : "bg-gray-700 hover:bg-gray-600 text-white"
          )}
        >
          Cash
        </Button>
        <Button
          onClick={() => setPaymentMethod("upi")}
          className={cn(
            "flex-1 font-semibold",
            paymentMethod === "upi"
              ? "bg-blue-500 hover:bg-blue-600 text-black"
              : "bg-gray-700 hover:bg-gray-600 text-white"
          )}
        >
          UPI
        </Button>
        <Button
          onClick={() => setPaymentMethod("card")}
          className={cn(
            "flex-1 font-semibold",
            paymentMethod === "card"
              ? "bg-purple-500 hover:bg-purple-600 text-black"
              : "bg-gray-700 hover:bg-gray-600 text-white"
          )}
        >
          Card
        </Button>
      </div>

      {paymentMethod === "cash" && (
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center text-sm">
            <span>Paid Amount:</span>
            <Input
              type="number"
              placeholder="0"
              className="h-8 w-20 bg-gray-800 border-none text-white text-xs text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={paidAmount || ""}
              onChange={(e) => setPaidAmount(e.target.valueAsNumber || 0)}
            />
          </div>

          <div className="flex justify-between items-center text-sm">
            <span>Change:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Input
                  readOnly
                  value={changeAmount.toFixed(2)}
                  className="h-8 w-20 bg-gray-800 border-yellow-500 text-yellow-400 font-bold text-xs text-right cursor-pointer"
                />
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-gray-800 border-gray-700 text-white">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Product Suggestions</h4>
                  <p className="text-sm text-gray-400">
                    Products you can buy with the change amount.
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  {isSuggestionLoading && <Loader2 className="animate-spin" />}
                  {suggestedProducts.length === 0 && !isSuggestionLoading && (
                    <p className="text-xs text-gray-500">No products found.</p>
                  )}
                  {suggestedProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between text-xs p-2 rounded-md hover:bg-gray-700"
                    >
                      <div>
                        <div>{product.productName || product.name}</div>
                        <div className="text-gray-400">
                          {product.variantVolume} {product.unitName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">₹{product.price.toFixed(2)}</span>
                        <Button
                          size="icon"
                          className="h-6 w-6 bg-yellow-500 hover:bg-yellow-600"
                          onClick={() => addToCart(product)}
                        >
                          <ShoppingCart className="h-4 w-4 text-black" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      <Separator className="bg-gray-700" />

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 text-orange-600 bg-gray-600"
          checked={isOilExpelling}
          onChange={(e) => setIsOilExpelling(e.target.checked)}
        />
        <span className="text-sm">Oil Expelling Charges</span>
      </div>

      {isOilExpelling && (
        <div className="p-3 rounded-lg flex flex-col gap-2 border border-gray-700">
          <Select onValueChange={(val) => setSelectedOecId(val || null)} value={selectedOecId || ""}>
            <SelectTrigger className="h-8 bg-gray-700 border-none text-white text-xs">
              <SelectValue placeholder="Select Product..." />
            </SelectTrigger>
            <SelectContent>
              {oecs.map((oec) => (
                <SelectItem key={oec._id} value={oec._id}>
                  {oec.product.productName} ({oec.product.productCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Qty"
              className="h-8 bg-gray-700 border-none text-white text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={oecQuantity || ""}
              onChange={(e) => setOecQuantity(e.target.valueAsNumber || 0)}
            />
            <Input
              readOnly
              placeholder="Charges"
              className="h-8 bg-gray-700 border-none text-white text-xs"
              value={
                oecs.find((o) => o._id === selectedOecId)
                  ? `₹ ${oecs.find((o) => o._id === selectedOecId)!.oilExpellingCharges.toFixed(2)}`
                  : "Charges"
              }
            />
            <Button size="sm" onClick={handleAddOec} className="h-8 bg-blue-500 hover:bg-blue-600 text-black">
              Add
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 text-orange-600 bg-gray-600"
          checked={excludePacking}
          onChange={(e) => setExcludePacking(e.target.checked)}
        />
        <span className="text-sm">Exclude Packing Charges</span>
      </div>

      {excludePacking && (
        <div className="flex justify-between items-center text-sm">
          <span>Packing Charges (₹):</span>
          <Input
            type="number"
            placeholder="0"
            className="h-8 w-20 bg-gray-800 border-none text-white text-xs text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={packingCharges || ""}
            onChange={(e) => setPackingCharges(e.target.valueAsNumber || 0)}
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 text-orange-600 bg-gray-600"
          checked={isGstEnabled}
          onChange={toggleGst}
        />
        <span className="text-sm">Enable GST</span>
      </div>
    </div>
  );
}