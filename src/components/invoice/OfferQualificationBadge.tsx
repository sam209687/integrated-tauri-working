// FILE: src/components/invoice/OfferQualificationBadge.tsx (NEW)
// ============================================================================
"use client";

import { Trophy, Gift, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IInvoiceOfferQualification } from "@/lib/models/invoice";

interface OfferQualificationBadgeProps {
  qualifications: IInvoiceOfferQualification[];
  compact?: boolean;
}

export function OfferQualificationBadge({ 
  qualifications, 
  compact = false 
}: OfferQualificationBadgeProps) {
  if (!qualifications || qualifications.length === 0) {
    return null;
  }

  const qualified = qualifications.filter(q => q.qualified);
  const notQualified = qualifications.filter(q => !q.qualified);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {qualified.map((q, idx) => (
          <Badge key={idx} className="bg-green-600 hover:bg-green-700">
            <Trophy className="h-3 w-3 mr-1" />
            Won: {q.prizeName || q.offerName}
          </Badge>
        ))}
        {notQualified.map((q, idx) => (
          <Badge key={idx} variant="outline" className="border-orange-400 text-orange-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            {q.progressToQualify}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Qualified Offers */}
      {qualified.length > 0 && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  🎉 Congratulations! Customer Qualified for {qualified.length} Offer(s)
                </h4>
                <div className="space-y-2">
                  {qualified.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800 dark:text-green-200">
                        <strong>{q.offerName}</strong>
                        {q.prizeName && ` - Prize: ${q.prizeName}`}
                        {q.position && ` (Position ${q.position})`}
                        {q.prizeRank && ` - ${q.prizeRank.toUpperCase()} PRIZE!`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Not Qualified Offers (Progress) */}
      {notQualified.length > 0 && (
        <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                  Keep Going! Available Offers
                </h4>
                <div className="space-y-2">
                  {notQualified.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-800 dark:text-orange-200">
                        <strong>{q.offerName}</strong>
                        {q.progressToQualify && ` - ${q.progressToQualify}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}