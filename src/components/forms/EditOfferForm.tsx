// src/components/forms/EditOfferForm.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

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

import { updateOffer, getVariantsForOffer } from "@/actions/offer.actions";
import { getIndianHolidays, Holiday } from "@/actions/calendar.Actions";
import { IOffer } from "@/lib/models/offer";
import { toast } from "sonner";

interface EditOfferFormProps {
  initialData: IOffer;
}

export function EditOfferForm({ initialData }: EditOfferFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [variants, setVariants] = useState<any[]>([]);
  const [festivals, setFestivals] = useState<Holiday[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>(
    (initialData.product as any)?._id || ""
  );
  const [selectedFestival, setSelectedFestival] = useState<string>(
    (initialData as any).festivalName || ""
  );
  const [startDate, setStartDate] = useState<string>(
    format(new Date(initialData.startDate), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(initialData.endDate), "yyyy-MM-dd")
  );

  // Type-specific fields
  const [customerLimit, setCustomerLimit] = useState<string>(
    String((initialData as any).customerLimit || "")
  );
  const [minimumAmount, setMinimumAmount] = useState<string>(
    String((initialData as any).minimumAmount || "")
  );
  const [visitCount, setVisitCount] = useState<string>(
    String((initialData as any).visitCount || "")
  );
  const [targetAmount, setTargetAmount] = useState<string>(
    String((initialData as any).targetAmount || "")
  );
  const [prizeName, setPrizeName] = useState<string>(
    (initialData as any).prizeName || ""
  );

  useEffect(() => {
    async function loadData() {
      const [variantsRes, festivalsData] = await Promise.all([
        getVariantsForOffer(),
        getIndianHolidays(),
      ]);

      if (variantsRes.success) {
        setVariants(variantsRes.data);
      }
      setFestivals(festivalsData);
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("product", selectedProduct);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);

    // Add type-specific fields
    if ((initialData as any).festivalName) {
      formData.append("festivalName", selectedFestival);
    }
    if ((initialData as any).customerLimit) {
      formData.append("customerLimit", customerLimit);
    }
    if ((initialData as any).minimumAmount) {
      formData.append("minimumAmount", minimumAmount);
    }
    if ((initialData as any).visitCount) {
      formData.append("visitCount", visitCount);
    }
    if ((initialData as any).targetAmount) {
      formData.append("targetAmount", targetAmount);
    }
    if ((initialData as any).prizeName) {
      formData.append("prizeName", prizeName);
    }

    startTransition(async () => {
      const result = await updateOffer(initialData._id, formData);

      if (result.success) {
        toast.success("Offer updated successfully!");
        router.push("/admin/offers");
      } else {
        toast.error(result.message || "Failed to update offer");
      }
    });
  };

  const getOfferTypeLabel = () => {
    if (initialData.offerType === 'festival' && (initialData as any).festivalSubType === 'hitCounter') {
      return 'Festival Hit Counter';
    }
    if (initialData.offerType === 'festival' && (initialData as any).festivalSubType === 'amountBased') {
      return 'Festival Amount-Based';
    }
    if (initialData.offerType === 'regular' && (initialData as any).regularSubType === 'visitCount') {
      return 'Regular Visit Count';
    }
    if (initialData.offerType === 'regular' && (initialData as any).regularSubType === 'purchaseAmount') {
      return 'Regular Purchase Amount';
    }
    return 'Unknown';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      {/* Offer Type (Read-only) */}
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">Offer Type</p>
        <p className="font-semibold text-lg">{getOfferTypeLabel()}</p>
      </div>

      {/* Product Selection */}
      <div className="space-y-2">
        <Label htmlFor="product">
          Product <span className="text-red-500">*</span>
        </Label>
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger>
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {variants.map((variant) => (
              <SelectItem key={variant._id} value={variant._id}>
                {variant.product?.productName} - {variant.variantVolume} {variant.unit?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Festival Selection (if applicable) */}
      {(initialData as any).festivalName && (
        <div className="space-y-2">
          <Label htmlFor="festival">
            Select Festival <span className="text-red-500">*</span>
          </Label>
          <Select value={selectedFestival} onValueChange={setSelectedFestival}>
            <SelectTrigger>
              <SelectValue placeholder="Select a festival" />
            </SelectTrigger>
            <SelectContent>
              {festivals.map((festival) => (
                <SelectItem key={festival.date} value={festival.name}>
                  {festival.name} ({festival.date})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">
            Start Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">
            End Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Type-specific fields */}
      {(initialData as any).customerLimit !== undefined && (
        <div className="space-y-2">
          <Label htmlFor="customer-limit">
            Customer Limit <span className="text-red-500">*</span>
          </Label>
          <Input
            id="customer-limit"
            type="number"
            value={customerLimit}
            onChange={(e) => setCustomerLimit(e.target.value)}
          />
        </div>
      )}

      {(initialData as any).minimumAmount !== undefined && (
        <div className="space-y-2">
          <Label htmlFor="minimum-amount">
            Minimum Amount <span className="text-red-500">*</span>
          </Label>
          <Input
            id="minimum-amount"
            type="number"
            value={minimumAmount}
            onChange={(e) => setMinimumAmount(e.target.value)}
          />
        </div>
      )}

      {(initialData as any).visitCount !== undefined && (
        <div className="space-y-2">
          <Label htmlFor="visit-count">
            Visit Count <span className="text-red-500">*</span>
          </Label>
          <Input
            id="visit-count"
            type="number"
            value={visitCount}
            onChange={(e) => setVisitCount(e.target.value)}
          />
        </div>
      )}

      {(initialData as any).targetAmount !== undefined && (
        <div className="space-y-2">
          <Label htmlFor="target-amount">
            Target Amount <span className="text-red-500">*</span>
          </Label>
          <Input
            id="target-amount"
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
          />
        </div>
      )}

      {(initialData as any).prizeName !== undefined && (
        <div className="space-y-2">
          <Label htmlFor="prize-name">
            Prize Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="prize-name"
            value={prizeName}
            onChange={(e) => setPrizeName(e.target.value)}
          />
        </div>
      )}

      {/* Note about images */}
      {((initialData as any).prizes || (initialData as any).prizeImageUrl) && (
        <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Prize images cannot be changed through editing. 
            To change images, please create a new offer.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/offers")}
          className="flex-1"
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Offer"
          )}
        </Button>
      </div>
    </form>
  );
}