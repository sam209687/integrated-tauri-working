// src/components/BillingSection.tsx
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, ShoppingCart } from "lucide-react";

import { usePosStore } from "@/store/posStore";
import { useOecStore } from "@/store/oecStore";
import { useCustomerStore } from "@/store/customerStore";
import { usePrintStore } from "@/store/printStore";
import { useSuggestionStore } from "@/store/suggestionStore";
import { createInvoice, InvoiceDataPayload } from "@/actions/invoice.actions";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BillingSection() {
  const { data: session } = useSession();

  // ✅ 1. Create a ref for the input element
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    cart,
    clearCart,
    addOecToCart,
    isGstEnabled,
    toggleGst,
    addToCart,
    // ✅ NEW: Destructure the stock update action
    updateStocksAfterSale,
  } = usePosStore();
  
  const { oecs, fetchOecs } = useOecStore();
  const {
    phone,
    name,
    address,
    setPhone,
    setName,
    setAddress,
    searchCustomersByPhonePrefix,
    selectCustomer,
    createCustomer,
    resetCustomer,
    isCustomerFound,
    isLoading,
    customer,
    visitCount,
    suggestions,
  } = useCustomerStore();

  const { openModal } = usePrintStore();
  const {
    suggestedProducts,
    fetchSuggestions,
    clearSuggestions,
    isLoading: isSuggestionLoading,
  } = useSuggestionStore();

  const [isSaving, setIsSaving] = useState(false);
  const [selectedOecId, setSelectedOecId] = useState<string | null>(null);
  const [oecQuantity, setOecQuantity] = useState<number>(0);

  useEffect(() => {
    fetchOecs();
  }, [fetchOecs]);

  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">(
    "cash"
  );
  const [paidAmount, setPaidAmount] = useState(0);
  const [isOilExpelling, setIsOilExpelling] = useState(false);
  const [excludePacking, setExcludePacking] = useState(false);

  // Debounce hook for search-as-you-type API calls
  const debouncedPhonePrefix = useDebounce(phone, 300);

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );
  const totalGstAmount = useMemo(() => {
    if (!isGstEnabled) return 0;
    return cart.reduce((acc, item) => {
      const gstRate = item.product.tax?.gst ?? 0;
      const itemTotal = item.price * item.quantity;
      const itemGst = (itemTotal * gstRate) / 100;
      return acc + itemGst;
    }, 0);
  }, [cart, isGstEnabled]);
  const totalPayable = useMemo(() => {
    const packingDiscount = excludePacking ? 10 : 0;
    const total = subtotal - discount - packingDiscount + totalGstAmount;
    return total > 0 ? total : 0;
  }, [subtotal, discount, excludePacking, totalGstAmount]);
  const changeAmount = useMemo(() => {
    if (paymentMethod !== "cash" || paidAmount < totalPayable) return 0;
    return paidAmount - totalPayable;
  }, [paidAmount, totalPayable, paymentMethod]);

  const debouncedChangeAmount = useDebounce(changeAmount, 750);

  // SEARCH-AS-YOU-TYPE LOGIC: Triggers customer search after a pause
  useEffect(() => {
    // Search only if length is between 3 and 9 digits
    if (debouncedPhonePrefix.length >= 3 && debouncedPhonePrefix.length < 10) {
      searchCustomersByPhonePrefix(debouncedPhonePrefix);
    } else if (
      debouncedPhonePrefix.length < 3 ||
      debouncedPhonePrefix.length === 10
    ) {
      // Clear suggestions immediately if too short or exactly 10 digits
      useCustomerStore.setState({ suggestions: [] });
    }
  }, [debouncedPhonePrefix, searchCustomersByPhonePrefix]);

  // RESET/INSTANT POPULATE LOGIC: Handles clearing and instant selection logic
  useEffect(() => {
    // If phone drops to 0, reset everything
    if (phone.length === 0) {
      resetCustomer();
    }
    // If a customer was found, but the user starts deleting the phone number, reset the form fields.
    else if (phone.length < 10 && isCustomerFound) {
      useCustomerStore.setState({
        isCustomerFound: false,
        customer: null,
        name: "",
        address: "",
        visitCount: 0,
      });
    }
  }, [phone, resetCustomer, isCustomerFound]);

  useEffect(() => {
    if (debouncedChangeAmount > 0) {
      fetchSuggestions(debouncedChangeAmount);
    } else {
      clearSuggestions();
    }
  }, [debouncedChangeAmount, fetchSuggestions, clearSuggestions]);

  const selectedOec = useMemo(
    () => oecs.find((oec) => oec._id === selectedOecId),
    [oecs, selectedOecId]
  );

  const handleClear = () => {
    clearCart();
    resetCustomer();
    clearSuggestions();
    setDiscount(0);
    setPaidAmount(0);
    setPaymentMethod("cash");
    setIsOilExpelling(false);
    setExcludePacking(false);
  };

  const handleAddOec = () => {
    if (!selectedOec || !oecQuantity || oecQuantity <= 0) {
      toast.error("Please select a product and enter a valid quantity.");
      return;
    }
    addOecToCart({
      productName: `Oil Expelling: ${selectedOec.product.productName}`,
      quantity: oecQuantity,
      price: selectedOec.oilExpellingCharges,
    });
    toast.success("OEC added to cart.");
    setSelectedOecId(null);
    setOecQuantity(0);
  };

  const handlePrintBill = async () => {
    if (!session?.user?.id) {
      toast.error("User not logged in. Cannot create invoice.");
      return;
    }
    // Updated check to prevent printing without confirming customer
    if (!isCustomerFound || !customer) {
      // If 10 digits and name are present, prompt user to click 'Add' first
      if (phone.length === 10 && name.trim().length > 1) {
        toast.error(
          "Please click the 'Add' button to confirm the new customer first."
        );
        return;
      }
      toast.error("Please add or select a customer before printing.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Cannot print an empty cart.");
      return;
    }
    setIsSaving(true);

    const invoicePayload: InvoiceDataPayload = {
      billedById: session.user.id,
      customerId: customer._id,
      items: cart.map((item) => ({
        variantId: item._id,
        name: item.product.productName,
        price: item.price,
        quantity: item.quantity,
        mrp: item.mrp ?? 0,
        gstRate: isGstEnabled ? (item.product.tax?.gst ?? 0) : 0,
        hsn: isGstEnabled ? (item.product.tax?.hsn ?? "") : "",
      })),
      subtotal: subtotal,
      discount: discount,
      packingChargeDiscount: excludePacking ? 10 : 0,
      gstAmount: totalGstAmount,
      totalPayable: totalPayable,
      paymentMethod: paymentMethod,
    };

    const result = await createInvoice(invoicePayload);
    if (result.success && result.data) {
      toast.success("Invoice saved successfully!");
      openModal(result.data);

      // ✅ 1. Prepare payload for stock update: filter out OEC items
      const stockUpdatePayload = cart
        .filter(item => item.type === "variant")
        .map(item => ({
          variantId: item._id,
          quantity: item.quantity,
        }));
      
      // ✅ 2. Call the REAL store action to update stock quantities in the database
      await updateStocksAfterSale(stockUpdatePayload);

      // ✅ 3. Fetch updated product stock to refresh the list in the Searchbar
      const { fetchProducts } = usePosStore.getState();
      await fetchProducts();

      // ✅ 4. Clear cart and customer state after stock update
      handleClear();
    } else {
      toast.error(result.message || "Failed to save invoice.");
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg text-gray-200 h-full flex flex-col">
      {/* ======================= STATIC TOP SECTION ======================= */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Cart ({cart.length})</h3>
          <span className="text-2xl font-bold">
            ₹ {totalPayable.toFixed(2)}
          </span>
        </div>
        <div className="p-3 rounded-lg mt-2">
          <h4 className="font-semibold mb-1 text-sm">Customer Details</h4>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="relative flex-1">
                {/* Customer Phone Input with Popover for Suggestions */}
                <Popover
                  // 1. Strict open condition: open ONLY if suggestions exist AND phone is less than 10 digits.
                  open={
                    suggestions.length > 0 &&
                    phone.length >= 3 &&
                    phone.length < 10
                  }
                  // 2. Set modal=false to prevent the popover from stealing focus
                  modal={false}
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  onOpenChange={(_) => {
                    // The 'open' prop handles the display, allowing the input to retain focus.
                  }}
                >
                  <PopoverTrigger asChild>
                    {/* The input acts as the trigger */}
                    <Input
                      // ✅ 3. Attach the ref to the input field
                      ref={inputRef}
                      placeholder="Phone Number"
                      className="h-8 bg-gray-700 border-none text-white"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, "");
                        setPhone(rawValue.slice(0, 10)); // Limits input to 10 characters
                      }}
                      maxLength={10}
                    />
                  </PopoverTrigger>

                  {/* Popover Content: Display Search Results */}
                  <PopoverContent className="w-[300px] p-0 bg-gray-800 border-gray-700 max-h-60 overflow-y-auto z-50">
                    {isLoading && (
                      <div className="p-2 flex items-center justify-center">
                        <Loader2 className="animate-spin h-4 w-4" />
                      </div>
                    )}
                    {!isLoading &&
                      suggestions.length === 0 &&
                      phone.length >= 3 && (
                        <p className="p-2 text-xs text-gray-400">
                          No matches found.
                        </p>
                      )}
                    {suggestions.map((cust) => (
                      <div
                        key={cust._id}
                        className="p-2 border-b border-gray-700 hover:bg-gray-700 cursor-pointer text-xs"
                        // ✅ 4. Re-focus the input after selecting a suggestion
                        onClick={() => {
                          selectCustomer(cust);
                          useCustomerStore.setState({ suggestions: [] });
                          inputRef.current?.focus(); // Manually return focus to the input
                        }}
                      >
                        <span className="font-bold text-white">
                          {cust.phone}
                        </span>
                        <span className="ml-2 text-gray-400">{cust.name}</span>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>

                {isLoading && (
                  <Loader2 className="animate-spin h-4 w-4 absolute right-2 top-2 text-gray-400" />
                )}
              </div>
              <Input
                placeholder="Name"
                className="h-8 bg-gray-700 border-none text-white flex-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                readOnly={isCustomerFound} // Name is readOnly once a customer is found/selected
              />
              <Input
                placeholder="Address (Optional)"
                className="h-8 bg-gray-700 border-none text-white flex-1"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              {/* ADD BUTTON LOGIC: Show only if not found but all necessary fields are complete */}
              {!isCustomerFound &&
                phone.length === 10 &&
                name.trim().length > 1 && (
                  <Button
                    onClick={createCustomer}
                    variant="outline"
                    className="h-8 px-2 py-1 text-black bg-yellow-500 hover:bg-yellow-600 font-semibold text-xs"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                )}
            </div>
            {isCustomerFound && visitCount > 0 && (
              <div className="bg-gray-800 text-center text-xs text-yellow-400 p-1 rounded-md">
                Customer has made {visitCount} previous purchase(s).
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================= SCROLLABLE MIDDLE SECTION ======================= */}
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
                    <h4 className="font-medium leading-none">
                      Product Suggestions
                    </h4>
                    <p className="text-sm text-gray-400">
                      Products you can buy with the change amount.
                    </p>
                  </div>
                  <div className="mt-4 space-y-2">
                    {isSuggestionLoading && (
                      <Loader2 className="animate-spin" />
                    )}
                    {suggestedProducts.length === 0 && !isSuggestionLoading && (
                      <p className="text-xs text-gray-500">
                        No products found.
                      </p>
                    )}
                    {suggestedProducts.map((product) => (
                      <div
                        key={product._id}
                        className="flex items-center justify-between text-xs p-2 rounded-md hover:bg-gray-700"
                      >
                        <div>
                          <div>{product.product.productName}</div>
                          <div className="text-gray-400">
                            {product.variantVolume} {product.unit.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            ₹{product.price.toFixed(2)}
                          </span>
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
            <Select
              onValueChange={setSelectedOecId}
              value={selectedOecId || ""}
            >
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
                  selectedOec
                    ? `₹ ${selectedOec.oilExpellingCharges.toFixed(2)}`
                    : "Charges"
                }
              />
              <Button
                size="sm"
                onClick={handleAddOec}
                className="h-8 bg-blue-500 hover:bg-blue-600 text-black"
              >
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

      {/* ======================= STATIC BOTTOM SECTION ======================= */}
      <div>
        <Separator className="bg-gray-700 my-4" />
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-bold">Total Payable:</span>
          <span className="text-lg font-bold">₹ {totalPayable.toFixed(2)}</span>
        </div>
        <div className="flex justify-center gap-2">
          <Button
            onClick={handlePrintBill}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : null}
            {isSaving ? "Saving..." : "Print Bill"}
          </Button>
          <Button
            onClick={handleClear}
            className="flex-1 bg-red-500 hover:bg-red-600 text-black font-semibold"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}