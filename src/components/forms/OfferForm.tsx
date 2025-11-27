// src/components/forms/OfferForm.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UploadPrize } from "@/components/offers/UploadPrize";

import {
  getVariantsForOffer,
  createFestivalHitCounterOffer,
  createFestivalAmountOffer,
  createRegularVisitCountOffer,
  createRegularPurchaseAmountOffer,
} from "@/actions/offer.actions";

import { getIndianHolidays, Holiday } from "@/actions/calendar.Actions";

type OfferType = "festival" | "regular" | null;
type FestivalSubType = "hitCounter" | "amountBased" | null;
type RegularSubType = "visitCount" | "purchaseAmount" | null;

export function OfferForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Form state
  const [variants, setVariants] = useState<any[]>([]);
  const [festivals, setFestivals] = useState<Holiday[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [offerType, setOfferType] = useState<OfferType>(null);
  const [festivalSubType, setFestivalSubType] = useState<FestivalSubType>(null);
  const [regularSubType, setRegularSubType] = useState<RegularSubType>(null);
  const [selectedFestival, setSelectedFestival] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Festival hit counter state
  const [customerLimit, setCustomerLimit] = useState("");
  const [prizes, setPrizes] = useState({
    first: { name: "", image: null as File | null },
    second: { name: "", image: null as File | null },
    third: { name: "", image: null as File | null },
  });

  // Amount-Based & Regular fields
  const [amount, setAmount] = useState("");
  const [prizeName, setPrizeName] = useState("");
  const [prizeImage, setPrizeImage] = useState<File | null>(null);
  const [visitCount, setVisitCount] = useState("");

  // Load variants + filter festivals
  useEffect(() => {
    async function loadData() {
      const [variantsRes, festivalData] = await Promise.all([
        getVariantsForOffer(),
        getIndianHolidays(),
      ]);

      if (variantsRes.success) setVariants(variantsRes.data);

      const today = new Date();

      const upcoming = festivalData
        .filter((f) => new Date(f.date) >= today)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      setFestivals(upcoming);
    }

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct || !offerType || !startDate || !endDate) {
      alert("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("product", selectedProduct);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);

    startTransition(async () => {
      let result;

      // FESTIVAL HIT COUNTER
      if (offerType === "festival" && festivalSubType === "hitCounter") {
        if (!selectedFestival || !customerLimit) {
          alert("Please fill festival hit counter fields");
          return;
        }

        formData.append("festivalName", selectedFestival);
        formData.append("customerLimit", customerLimit);

        for (const rank of ["first", "second", "third"] as const) {
          if (!prizes[rank].name || !prizes[rank].image) {
            alert(`Please provide ${rank} prize details`);
            return;
          }
          formData.append(`prize_${rank}_name`, prizes[rank].name);
          formData.append(`prize_${rank}_image`, prizes[rank].image!);
        }

        result = await createFestivalHitCounterOffer(formData);
      }

      // FESTIVAL AMOUNT BASED
      else if (offerType === "festival" && festivalSubType === "amountBased") {
        if (!selectedFestival || !amount || !prizeName || !prizeImage) {
          alert("Please fill festival amount-based fields");
          return;
        }

        formData.append("festivalName", selectedFestival);
        formData.append("minimumAmount", amount);
        formData.append("prizeName", prizeName);
        formData.append("prizeImage", prizeImage);

        result = await createFestivalAmountOffer(formData);
      }

      // REGULAR VISIT
      else if (offerType === "regular" && regularSubType === "visitCount") {
        if (!visitCount || !prizeName || !prizeImage) {
          alert("Please fill visit count fields");
          return;
        }

        formData.append("visitCount", visitCount);
        formData.append("prizeName", prizeName);
        formData.append("prizeImage", prizeImage);

        result = await createRegularVisitCountOffer(formData);
      }

      // REGULAR AMOUNT
      else if (offerType === "regular" && regularSubType === "purchaseAmount") {
        if (!amount || !prizeName || !prizeImage) {
          alert("Please fill purchase amount fields");
          return;
        }

        formData.append("targetAmount", amount);
        formData.append("prizeName", prizeName);
        formData.append("prizeImage", prizeImage);

        result = await createRegularPurchaseAmountOffer(formData);
      }

      if (result?.success) router.push("/admin/offers");
      else alert(result?.message || "Failed to create offer");
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 max-w-4xl mx-auto p-8 bg-card border rounded-xl shadow-md"
    >
      {/* PRODUCT SELECTION */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Select Product *</Label>

        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-full h-12 text-base">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>

          <SelectContent>
            {variants.map((variant) => (
              <SelectItem
                key={variant._id}
                value={variant._id}
                className="text-base"
              >
                {variant.product?.productName} - {variant.variantVolume}{" "}
                {variant.unit?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* OFFER TYPE */}
      <div className="space-y-2">
        <Label className="font-medium text-base">Offer Type *</Label>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={offerType === "festival"}
              onCheckedChange={(v) => {
                setOfferType(v ? "festival" : null);
                setFestivalSubType(null);
              }}
            />
            <span>Festival Offer</span>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={offerType === "regular"}
              onCheckedChange={(v) => {
                setOfferType(v ? "regular" : null);
                setRegularSubType(null);
              }}
            />
            <span>Regular Offer</span>
          </div>
        </div>
      </div>

      {/* FESTIVAL OPTIONS */}
      {offerType === "festival" && (
        <div className="space-y-6 bg-muted/20 p-5 rounded-xl border">
          
          {/* FESTIVAL SELECT */}
          <div className="space-y-2">
            <Label className="text-base">Select Festival *</Label>

            <Select value={selectedFestival} onValueChange={setSelectedFestival}>
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Select a festival" />
              </SelectTrigger>

              <SelectContent>
                {festivals.map((festival) => (
                  <SelectItem
                    key={festival.date + festival.name} 
                    value={festival.name}
                    className="text-base"
                  >
                    {festival.name} ({festival.date})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* FESTIVAL TYPE */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={festivalSubType === "hitCounter"}
                onCheckedChange={(v) =>
                  setFestivalSubType(v ? "hitCounter" : null)
                }
              />
              <span>Hit The Counter</span>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={festivalSubType === "amountBased"}
                onCheckedChange={(v) =>
                  setFestivalSubType(v ? "amountBased" : null)
                }
              />
              <span>Amount Based</span>
            </div>
          </div>

          {/* HIT COUNTER UI */}
          {festivalSubType === "hitCounter" && (
            <>
              <div className="space-y-2">
                <Label className="text-base">Customer Limit *</Label>
                <Input
                  type="number"
                  className="h-12 text-base"
                  value={customerLimit}
                  onChange={(e) => setCustomerLimit(e.target.value)}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  className="h-12 text-base"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  className="h-12 text-base"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {/* PRIZES */}
              <div className="space-y-4">
                <UploadPrize
                  rank="first"
                  prizeName={prizes.first.name}
                  prizeImage={prizes.first.image}
                  onPrizeNameChange={(v) =>
                    setPrizes({ ...prizes, first: { ...prizes.first, name: v } })
                  }
                  onPrizeImageChange={(file) =>
                    setPrizes({
                      ...prizes,
                      first: { ...prizes.first, image: file },
                    })
                  }
                  disabled={isPending}
                />

                <UploadPrize
                  rank="second"
                  prizeName={prizes.second.name}
                  prizeImage={prizes.second.image}
                  onPrizeNameChange={(v) =>
                    setPrizes({
                      ...prizes,
                      second: { ...prizes.second, name: v },
                    })
                  }
                  onPrizeImageChange={(file) =>
                    setPrizes({
                      ...prizes,
                      second: { ...prizes.second, image: file },
                    })
                  }
                  disabled={isPending}
                />

                <UploadPrize
                  rank="third"
                  prizeName={prizes.third.name}
                  prizeImage={prizes.third.image}
                  onPrizeNameChange={(v) =>
                    setPrizes({
                      ...prizes,
                      third: { ...prizes.third, name: v },
                    })
                  }
                  onPrizeImageChange={(file) =>
                    setPrizes({
                      ...prizes,
                      third: { ...prizes.third, image: file },
                    })
                  }
                  disabled={isPending}
                />
              </div>
            </>
          )}

          {/* FESTIVAL AMOUNT-BASED */}
          {festivalSubType === "amountBased" && (
            <>
              <Input
                type="number"
                className="h-12 text-base"
                placeholder="Minimum amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  className="h-12 text-base"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  className="h-12 text-base"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <UploadPrize
                prizeName={prizeName}
                prizeImage={prizeImage}
                onPrizeNameChange={setPrizeName}
                onPrizeImageChange={setPrizeImage}
                showRank={false}
                disabled={isPending}
              />
            </>
          )}
        </div>
      )}

      {/* REGULAR OPTIONS */}
      {offerType === "regular" && (
        <div className="space-y-6 bg-muted/20 p-5 rounded-xl border">

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={regularSubType === "visitCount"}
                onCheckedChange={(v) =>
                  setRegularSubType(v ? "visitCount" : null)
                }
              />
              <span>Visit Count</span>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={regularSubType === "purchaseAmount"}
                onCheckedChange={(v) =>
                  setRegularSubType(v ? "purchaseAmount" : null)
                }
              />
              <span>Purchase Amount</span>
            </div>
          </div>

          {/* VISIT COUNT */}
          {regularSubType === "visitCount" && (
            <>
              <Input
                type="number"
                className="h-12 text-base"
                placeholder="Visit Count"
                value={visitCount}
                onChange={(e) => setVisitCount(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  className="h-12 text-base"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  className="h-12 text-base"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <UploadPrize
                prizeName={prizeName}
                prizeImage={prizeImage}
                onPrizeNameChange={setPrizeName}
                onPrizeImageChange={setPrizeImage}
                showRank={false}
                disabled={isPending}
              />
            </>
          )}

          {/* PURCHASE AMOUNT */}
          {regularSubType === "purchaseAmount" && (
            <>
              <Input
                type="number"
                className="h-12 text-base"
                placeholder="Target Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  className="h-12 text-base"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  className="h-12 text-base"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <UploadPrize
                prizeName={prizeName}
                prizeImage={prizeImage}
                onPrizeNameChange={setPrizeName}
                onPrizeImageChange={setPrizeImage}
                showRank={false}
                disabled={isPending}
              />
            </>
          )}

        </div>
      )}

      {/* SUBMIT BUTTON */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 text-lg font-semibold"
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Creating Offer...
          </>
        ) : (
          "Create Offer"
        )}
      </Button>
    </form>
  );
}
