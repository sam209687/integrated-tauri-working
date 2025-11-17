"use client";

import { usePosStore } from "@/store/posStore";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function LiveCart() {
  const { cart, updateCartQuantity, removeFromCart, isGstEnabled } =
    usePosStore();

  const gridCols = isGstEnabled
    ? "grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr]"
    : "grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr]";

  return (
    <div className="flex flex-col h-[330px] w-full bg-gray-900 rounded-lg p-4 overflow-hidden">
      {/* Sticky Header */}
      <div
        className={`text-gray-400 text-sm font-semibold uppercase border-b border-gray-700 pb-2 mb-2 grid ${gridCols} sticky top-0 bg-gray-900 z-30`}
      >
        <div className="text-left">Product</div>
        <div className="text-center">Price</div>
        <div className="text-center">MRP</div>
        <div className="text-center">Disc. %</div>
        {isGstEnabled && <div className="text-center">GST</div>}
        <div className="text-center">Quantity</div>
        <div className="text-center">Total</div>
        <div className="text-center">Action</div>
      </div>

      {/* Scrollable Cart Items */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1 pb-4">
        {cart.length > 0 ? (
          cart.map((item) => {
            let discountPercentage = 0;
            if (item.mrp && item.price && item.mrp > item.price) {
              discountPercentage = ((item.mrp - item.price) / item.mrp) * 100;
            }

            const itemGst = isGstEnabled
              ? ((item.price * item.quantity) *
                  (item.product.tax?.gst ?? 0)) /
                100
              : 0;

            return (
              <motion.div
                key={item._id}
                className={`grid ${gridCols} items-center border border-transparent hover:border-gray-700 py-3 px-3 rounded-md bg-gray-800/30 hover:bg-gray-800/70 transition-colors duration-150`}
                // 🟢 Removed scale zoom effects — just color fade on hover
                initial={{ opacity: 0.95 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                style={{ pointerEvents: "auto" }}
              >
                {/* Product */}
                <div className="flex flex-col min-w-0 pl-1">
                  <span className="font-medium text-gray-100 truncate">
                    {item.product.productName}
                  </span>
                  {item.type === "variant" && (
                    <span className="text-xs text-gray-400 truncate">
                      {item.product.productCode}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="text-center font-bold text-gray-100">
                  ₹ {item.price.toFixed(2)}
                </div>

                {/* MRP */}
                <div className="text-center text-gray-400">
                  {item.mrp ? `₹ ${item.mrp.toFixed(2)}` : "N/A"}
                </div>

                {/* Discount */}
                <div className="text-center text-green-400">
                  {discountPercentage > 0
                    ? `${discountPercentage.toFixed(1)}%`
                    : "0%"}
                </div>

                {/* GST */}
                {isGstEnabled && (
                  <div className="text-center text-yellow-400">
                    {itemGst > 0 ? `₹ ${itemGst.toFixed(2)}` : "N/A"}
                  </div>
                )}

                {/* Quantity */}
                <div className="flex items-center justify-center space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateCartQuantity(item._id, item.quantity - 1);
                    }}
                    disabled={item.type === "oec"}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">
                    {item.quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateCartQuantity(item._id, item.quantity + 1);
                    }}
                    disabled={item.type === "oec"}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Total */}
                <div className="text-center font-bold text-gray-100">
                  ₹ {(item.price * item.quantity).toFixed(2)}
                </div>

                {/* Action */}
                <div className="text-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCart(item._id);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center text-gray-400 py-8">
            Your cart is empty. Add products to get started.
          </div>
        )}
      </div>
    </div>
  );
}
