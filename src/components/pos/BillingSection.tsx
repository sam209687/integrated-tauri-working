// src/components/pos/BillingSection.tsx
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Trophy, Sparkles, X, Gift } from "lucide-react";

import { usePosStore } from "@/store/posStore";
import { useOecStore } from "@/store/oecStore";
import { useCustomerStore } from "@/store/customerStore";
import { usePrintStore } from "@/store/printStore";
import { useSuggestionStore } from "@/store/suggestionStore";

import { createInvoice, InvoiceDataPayload } from "@/actions/invoice.actions";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";

import BillingSectionSecond from "./BillingSectionSecond";
import type { ProductSuggestion } from "@/types/ProductSuggestion";
import { IInvoiceOfferQualification } from "@/lib/models/invoice";

type SuggestedVariantFromStore = {
  _id: string;
  productName?: string;
  name?: string;
  variantVolume?: string | number;
  price: number;
  product?: { productName: string } | null;
  unit?: { name: string } | null;
};

type InvoiceToSend = {
  invoiceNumber: string;
  items: InvoiceDataPayload["items"];
  totalPayable: number;
  offerQualifications?: IInvoiceOfferQualification[]; // ✅ Add this
};

export function BillingSection() {
  const { data: session } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    cart,
    clearCart,
    addOecToCart,
    isGstEnabled,
    toggleGst,
    addToCart,
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
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">(
    "cash"
  );
  const [paidAmount, setPaidAmount] = useState(0);
  const [isOilExpelling, setIsOilExpelling] = useState(false);
  const [excludePacking, setExcludePacking] = useState(false);

  // ✅ Offer Modal State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerQualifications, setOfferQualifications] = useState<
    IInvoiceOfferQualification[]
  >([]);
  const [customerNameForOffer, setCustomerNameForOffer] = useState("");

  useEffect(() => {
    fetchOecs();
  }, [fetchOecs]);

  const debouncedPhonePrefix = useDebounce(phone, 300);

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  const totalGstAmount = useMemo(() => {
    if (!isGstEnabled) return 0;
    return cart.reduce((acc, item) => {
      const gstRate = item.product?.tax?.gst ?? 0;
      const itemTotal = item.price * item.quantity;
      return acc + (itemTotal * gstRate) / 100;
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

  useEffect(() => {
    if (debouncedPhonePrefix.length >= 3 && debouncedPhonePrefix.length < 10) {
      searchCustomersByPhonePrefix(debouncedPhonePrefix);
    } else {
      useCustomerStore.setState({ suggestions: [] });
    }
  }, [debouncedPhonePrefix, searchCustomersByPhonePrefix]);

  useEffect(() => {
    if (phone.length === 0) {
      resetCustomer();
    } else if (phone.length < 10 && isCustomerFound) {
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
    if (debouncedChangeAmount > 0) fetchSuggestions(debouncedChangeAmount);
    else clearSuggestions();
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

  // ✅ Updated: Send PDF invoice to Telegram with proper return type
  async function sendPdfToTelegram(
    invoice: InvoiceToSend,
    customerData: { name: string; phone: string },
    chatId?: string | null
  ) {
    try {
      const response = await fetch("/api/telegram/send-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice,
          customer: customerData,
          chatId: chatId ?? null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Telegram API error:", result);
        return {
          success: false,
          registered: false,
          message: result.message,
        };
      }

      return {
        success: result.success,
        registered: result.registered,
        hasPrizes: result.hasPrizes || false,
        prizeCount: result.prizeCount || 0,
        message: result.message,
      };
    } catch (err) {
      console.error("Failed to send Telegram message:", err);
      return {
        success: false,
        registered: false,
        message: "Network error",
      };
    }
  }

  const handlePrintBill = async () => {
    if (!session?.user?.id) {
      toast.error("User not logged in.");
      return;
    }

    if (!isCustomerFound || !customer) {
      if (phone.length === 10 && name.trim().length > 1) {
        toast.error("Click 'Add' to confirm new customer first.");
        return;
      }
      toast.error("Please select or add a customer before billing.");
      return;
    }

    if (cart.length === 0) {
      toast.error("Cannot print an empty cart.");
      return;
    }

    setIsSaving(true);

    try {
      const invoicePayload: InvoiceDataPayload = {
        billedById: session.user.id,
        customerId: customer._id,
        items: cart
          .filter((item) => item.type === "variant")
          .map((item) => ({
            variantId: item._id,
            name: item.product.productName,
            price: item.price,
            quantity: item.quantity,
            mrp: item.mrp ?? 0,
            gstRate: isGstEnabled ? (item.product?.tax?.gst ?? 0) : 0,
            hsn: isGstEnabled ? (item.product?.tax?.hsn ?? "") : "",
          })),
        subtotal,
        discount,
        packingChargeDiscount: excludePacking ? 10 : 0,
        gstAmount: totalGstAmount,
        totalPayable,
        paymentMethod,
      };

      // Save invoice to database
      const result = await createInvoice(invoicePayload);

      if (result.success && result.data) {
        toast.success("Invoice saved successfully!");

        // ✅ Check for offer qualifications
        if (
          result.data.offerQualifications &&
          result.data.offerQualifications.length > 0
        ) {
          const qualified = result.data.offerQualifications.filter(
            (q) => q.qualified
          );

          if (qualified.length > 0) {
            setOfferQualifications(qualified);
            setCustomerNameForOffer((customer as any)?.name || "Customer");
            setShowOfferModal(true);
          }
        }

        // Open print modal
        openModal(result.data);

        // ✅ Prepare invoice data for Telegram (include offerQualifications)
        const invoiceToSend: InvoiceToSend = {
          invoiceNumber:
            (result.data as any).invoiceNumber ??
            (result.data as any)._id ??
            "",
          items: cart.map((item) => ({
            name:
              item.type === "oec"
                ? item.product.productName
                : item.product.productName,
            price: item.price,
            quantity: item.quantity,
            variantId: item._id,
            mrp: item.mrp ?? 0,
            gstRate: isGstEnabled ? (item.product?.tax?.gst ?? 0) : 0,
            hsn: isGstEnabled ? (item.product?.tax?.hsn ?? "") : "",
          })),
          totalPayable,
          offerQualifications: result.data.offerQualifications, // ✅ Include prizes
        };

        const customerData = {
          name: (customer as any)?.name ?? "",
          phone: (customer as any)?.phone ?? "",
        };

        // ✅ AUTO-REGISTER: Check if customer has Telegram, if not, register them
        let chatId = (customer as any)?.telegramChatId;

        if (!chatId) {
          console.log("⚡ Customer not registered, auto-registering...");

          const storeChatId = "8559870798"; // Your store's Telegram chat ID

          try {
            const autoRegisterResponse = await fetch(
              "/api/customer/auto-register",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  customerId: (customer as any)._id,
                  chatId: storeChatId,
                }),
              }
            );

            const autoRegisterResult = await autoRegisterResponse.json();

            if (autoRegisterResult.success) {
              console.log("✅ Customer auto-registered successfully");
              chatId = storeChatId;
            } else {
              console.warn(
                "⚠️ Auto-registration failed, using store chat anyway"
              );
              chatId = storeChatId;
            }
          } catch (error) {
            console.error("❌ Auto-registration error:", error);
            chatId = storeChatId; // Fallback to store chat
          }
        } else {
          console.log("✅ Customer already registered with chat ID:", chatId);
        }

        console.log("🔍 DEBUG - Customer Data:");
        console.log("   Customer Object:", customer);
        console.log("   Customer Name:", customerData.name);
        console.log("   Customer Phone:", customerData.phone);
        console.log("   Telegram Chat ID:", chatId);
        console.log("   Chat ID Type:", typeof chatId);
        console.log("   Is Chat ID null?:", chatId === null);
        console.log("   Is Chat ID undefined?:", chatId === undefined);
        // ✅ Send invoice to Telegram with proper handling
        const telegramResult = await sendPdfToTelegram(
          invoiceToSend,
          customerData,
          chatId
        );

        if (telegramResult.success) {
          if (telegramResult.hasPrizes && telegramResult.prizeCount > 0) {
            toast.success(
              `✅ Invoice sent to Telegram!\n🎉 Customer won ${telegramResult.prizeCount} prize(s)!`,
              { duration: 5000 }
            );
          } else {
            toast.success("✅ Invoice sent to Telegram!");
          }
        } else {
          toast.error("⚠️ Failed to send invoice via Telegram");
        }
        // Update stock quantities
        const stockUpdatePayload = cart
          .filter((item) => item.type === "variant")
          .map((item) => ({
            variantId: item._id,
            quantity: item.quantity,
          }));

        await updateStocksAfterSale(stockUpdatePayload);

        // Refresh products
        const { fetchProducts } = usePosStore.getState();
        await fetchProducts();

        // Clear form
        handleClear();
      } else {
        toast.error(result.message || "Failed to save invoice.");
      }
    } catch (err) {
      console.error("Error processing invoice:", err);
      toast.error("An error occurred while processing the invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  const mappedSuggestedProducts: ProductSuggestion[] = (
    suggestedProducts ?? []
  ).map((item: SuggestedVariantFromStore) => ({
    _id: item._id,
    name:
      item.name ??
      (item.productName as string) ??
      (item.product as any)?.productName ??
      "",
    variantVolume: String(item.variantVolume ?? ""),
    price: item.price,
    productName:
      (item.productName as string) ?? (item.product as any)?.productName ?? "",
    unitName: ((item.unit as any)?.name as string) ?? "",
  }));

  return (
    <>
      <div className="bg-gray-900 p-4 rounded-lg text-gray-200 h-full flex flex-col">
        {/* TOP */}
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
                  <Popover
                    open={
                      suggestions.length > 0 &&
                      phone.length >= 3 &&
                      phone.length < 10
                    }
                    modal={false}
                    onOpenChange={() => {}}
                  >
                    <PopoverTrigger asChild>
                      <Input
                        ref={inputRef}
                        placeholder="Phone Number"
                        className="h-8 bg-gray-700 border-none text-white"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, "");
                          setPhone(rawValue.slice(0, 10));
                        }}
                        maxLength={10}
                      />
                    </PopoverTrigger>

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
                          onClick={() => {
                            selectCustomer(cust);
                            useCustomerStore.setState({ suggestions: [] });
                            inputRef.current?.focus();
                          }}
                        >
                          <span className="font-bold text-white">
                            {cust.phone}
                          </span>
                          <span className="ml-2 text-gray-400">
                            {cust.name}
                          </span>
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
                  readOnly={isCustomerFound}
                />

                <Input
                  placeholder="Address (Optional)"
                  className="h-8 bg-gray-700 border-none text-white flex-1"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />

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

        {/* MIDDLE */}
        <BillingSectionSecond
          cart={cart}
          subtotal={subtotal}
          totalGstAmount={totalGstAmount}
          totalPayable={totalPayable}
          changeAmount={changeAmount}
          debouncedChangeAmount={debouncedChangeAmount}
          discount={discount}
          setDiscount={setDiscount}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          paidAmount={paidAmount}
          setPaidAmount={setPaidAmount}
          isGstEnabled={isGstEnabled}
          toggleGst={toggleGst}
          suggestedProducts={mappedSuggestedProducts}
          isSuggestionLoading={isSuggestionLoading}
          fetchSuggestions={fetchSuggestions}
          clearSuggestions={clearSuggestions}
          addToCart={addToCart}
          isOilExpelling={isOilExpelling}
          setIsOilExpelling={setIsOilExpelling}
          oecs={oecs}
          selectedOecId={selectedOecId}
          setSelectedOecId={setSelectedOecId}
          oecQuantity={oecQuantity}
          setOecQuantity={setOecQuantity}
          handleAddOec={handleAddOec}
          excludePacking={excludePacking}
          setExcludePacking={setExcludePacking}
        />

        {/* BOTTOM */}
        <div>
          <Separator className="bg-gray-700 my-4" />

          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold">Total Payable:</span>
            <span className="text-lg font-bold">
              ₹ {totalPayable.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-center gap-2">
            <Button
              onClick={handlePrintBill}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
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

      {/* ✅ Offer Success Modal */}
      <Dialog open={showOfferModal} onOpenChange={setShowOfferModal}>
        <DialogContent className="sm:max-w-md bg-linear-to-br from-yellow-50 via-orange-50 to-pink-50 dark:from-yellow-950 dark:via-orange-950 dark:to-pink-950 border-4 border-yellow-400">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl text-center justify-center">
              <Trophy className="h-8 w-8 text-yellow-500 animate-bounce" />
              <span className="bg-linear-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Congratulations! 🎉
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="relative">
                <Sparkles className="h-20 w-20 mx-auto text-yellow-400 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Gift className="h-10 w-10 text-orange-500" />
                </div>
              </div>
              <p className="text-xl font-bold mt-3 text-gray-900 dark:text-white">
                {customerNameForOffer}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Qualified for <strong>{offerQualifications.length}</strong>{" "}
                offer{offerQualifications.length > 1 ? "s" : ""}!
              </p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {offerQualifications.map((offer, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-linear-to-r from-purple-100 via-pink-100 to-orange-100 dark:from-purple-900 dark:via-pink-900 dark:to-orange-900 border-2 border-yellow-400 shadow-lg transform hover:scale-105 transition-transform"
                >
                  <div className="flex items-start gap-3">
                    <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400 shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                        {offer.offerName}
                      </h4>
                      {offer.prizeName && (
                        <p className="text-sm mt-1 text-gray-700 dark:text-gray-200">
                          🎁 Prize: <strong>{offer.prizeName}</strong>
                        </p>
                      )}
                      {offer.prizeRank && (
                        <p className="text-sm mt-1 font-bold text-orange-700 dark:text-orange-300">
                          🏆 Rank:{" "}
                          <span className="uppercase">
                            {offer.prizeRank} PRIZE!
                          </span>
                        </p>
                      )}
                      {offer.position && (
                        <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                          📍 Position: <strong>#{offer.position}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg border-2 border-blue-300 dark:border-blue-700">
              <p className="text-sm text-blue-900 dark:text-blue-100 text-center">
                💡 <strong>Prize details are printed on the invoice.</strong>
                <br />
                Customer should contact staff to claim their prize(s).
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowOfferModal(false)}
            className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 shadow-lg"
          >
            <X className="h-5 w-5 mr-2" />
            Close & Continue
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BillingSection;
