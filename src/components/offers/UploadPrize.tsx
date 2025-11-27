// src/components/offers/UploadPrize.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadPrizeProps {
  rank?: "first" | "second" | "third";
  prizeName: string;
  onPrizeNameChange: (name: string) => void;
  prizeImage: File | null;
  onPrizeImageChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
  showRank?: boolean;
}

export function UploadPrize({
  rank,
  prizeName,
  onPrizeNameChange,
  prizeImage,
  onPrizeImageChange,
  error,
  disabled = false,
  showRank = true,
}: UploadPrizeProps) {

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onPrizeImageChange(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const clearImage = () => {
    onPrizeImageChange(null);
    setImagePreview(null);
  };

  const rankLabel = rank
    ? rank.charAt(0).toUpperCase() + rank.slice(1)
    : "Prize";

  return (
    <div className="space-y-4 p-5 rounded-xl border bg-muted/30 shadow-sm w-full">
      
      {showRank && rank && (
        <h3 className="font-semibold text-lg capitalize text-foreground/90 dark:text-foreground">
          {rankLabel} Prize
        </h3>
      )}

      {/* Prize Name */}
      <div className="space-y-2">
        <Label className="text-base">Prize Name <span className="text-red-500">*</span></Label>
        <Input
          placeholder="e.g., iPhone 15 Pro"
          className="h-12 text-base"
          value={prizeName}
          disabled={disabled}
          onChange={(e) => onPrizeNameChange(e.target.value)}
        />
      </div>

      {/* Prize Image */}
      <div className="space-y-2">
        <Label className="text-base">Prize Image <span className="text-red-500">*</span></Label>

        <Input
          type="file"
          accept="image/*"
          className="h-12 text-base"
          disabled={disabled}
          onChange={handleImageChange}
        />

        {imagePreview && (
          <div className="relative w-full h-52 mt-2 rounded-lg overflow-hidden border shadow-sm">
            <Image
              src={imagePreview}
              alt="Preview"
              fill
              className="object-cover"
            />

            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 w-8 h-8 dark:bg-red-600/80 dark:hover:bg-red-700"
              onClick={clearImage}
              disabled={disabled}
            >
              <X className="h-4 w-4 text-white" />
            </Button>
          </div>
        )}
      </div>

      {error && <FormMessage>{error}</FormMessage>}
    </div>
  );
}
