"use client";

import { Trophy, Gift } from "lucide-react";
import { IInvoiceOfferQualification } from "@/lib/models/invoice";
import { Separator } from "@/components/ui/separator";

interface InvoiceOfferSectionProps {
  qualifications?: IInvoiceOfferQualification[];
}

export function InvoiceOfferSection({ qualifications }: InvoiceOfferSectionProps) {
  if (!qualifications || qualifications.length === 0) {
    return null;
  }

  const qualified = qualifications.filter(q => q.qualified);

  if (qualified.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t-2 border-dashed pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h3 className="font-bold text-lg">Offer Prizes Won! 🎉</h3>
      </div>

      <div className="space-y-3">
        {qualified.map((q, idx) => (
          <div key={idx} className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <Gift className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  {q.offerName}
                </p>
                {q.prizeName && (
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Prize: {q.prizeName}
                  </p>
                )}
                {q.prizeRank && (
                  <p className="text-sm font-bold text-green-800 dark:text-green-200 mt-1">
                    🏆 {q.prizeRank.toUpperCase()} PRIZE WINNER!
                  </p>
                )}
                {q.position && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Position: #{q.position}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-3" />
      
      <p className="text-xs text-muted-foreground">
        * Please contact our staff to claim your prize. Terms and conditions apply.
      </p>
    </div>
  );
}