// FILE: src/components/invoice/OfferSuccessModal.tsx (NEW)
// ============================================================================
"use client";

import { useState, useEffect } from "react";
import { Trophy, X, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IInvoiceOfferQualification } from "@/lib/models/invoice";

interface OfferSuccessModalProps {
  qualifications: IInvoiceOfferQualification[];
  customerName?: string;
  onClose: () => void;
}

export function OfferSuccessModal({ 
  qualifications, 
  customerName,
  onClose 
}: OfferSuccessModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const qualified = qualifications.filter(q => q.qualified);

  useEffect(() => {
    if (qualified.length > 0) {
      setIsOpen(true);
    }
  }, [qualified.length]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (qualified.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-7 w-7 text-yellow-500" />
            Congratulations! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <Sparkles className="h-16 w-16 mx-auto text-yellow-400 animate-pulse" />
            {customerName && (
              <p className="text-lg font-semibold mt-2">{customerName}</p>
            )}
            <p className="text-muted-foreground mt-1">
              Qualified for {qualified.length} offer{qualified.length > 1 ? 's' : ''}!
            </p>
          </div>

          <div className="space-y-3">
            {qualified.map((q, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-lg bg-linear-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900"
              >
                <h4 className="font-bold text-lg">{q.offerName}</h4>
                {q.prizeName && (
                  <p className="text-sm mt-1">
                    🎁 Prize: <strong>{q.prizeName}</strong>
                  </p>
                )}
                {q.prizeRank && (
                  <p className="text-sm mt-1">
                    🏆 Rank: <strong className="uppercase">{q.prizeRank} PRIZE</strong>
                  </p>
                )}
                {q.position && (
                  <p className="text-sm mt-1">
                    📍 Position: <strong>{q.position}</strong>
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 The customer will be notified about their prize. Details will be printed on the invoice.
            </p>
          </div>
        </div>

        <Button onClick={handleClose} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}