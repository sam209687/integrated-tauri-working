// src/components/offers/OfferDetails.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  IOffer, 
  IFestivalHitCounterOffer, 
  IFestivalAmountOffer,
  IRegularVisitCountOffer,
  IRegularPurchaseAmountOffer,
  IPrize 
} from "@/lib/models/offer";

interface OfferDetailsProps {
  offer: IOffer;
}

export function OfferDetails({ offer }: OfferDetailsProps) {
  const product = offer.product as any;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/offers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Offer Details</h1>
            <p className="text-muted-foreground">
              View comprehensive offer information
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(offer.status)}>
          {offer.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product?.image && (
              <div className="relative h-48 w-full rounded-md overflow-hidden">
                <Image
                  src={product.image}
                  alt={product?.product?.productName || 'Product'}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Product Name</p>
              <p className="font-medium">{product?.product?.productName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Variant</p>
              <p className="font-medium">
                {product?.variantVolume} {product?.unit?.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Brand</p>
              <p className="font-medium">{product?.product?.brand?.name || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Offer Duration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">
                {format(new Date(offer.startDate), 'MMMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="font-medium">
                {format(new Date(offer.endDate), 'MMMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="font-medium">
                {format(new Date(offer.createdAt), 'MMMM dd, yyyy HH:mm')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offer Type Specific Details */}
      {offer.offerType === 'festival' && offer.festivalSubType === 'hitCounter' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Festival Hit Counter Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">Festival Name</p>
              <p className="text-xl font-bold">{offer.festivalName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer Limit</p>
              <p className="text-lg font-medium">
                First {offer.customerLimit} customers
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-4">Prizes</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {offer.prizes?.map((prize) => (
                  <Card key={prize.rank}>
                    <CardHeader>
                      <CardTitle className="capitalize">{prize.rank} Prize</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {prize.imageUrl && (
                        <div className="relative h-32 w-full rounded-md overflow-hidden">
                          <Image
                            src={prize.imageUrl}
                            alt={prize.prizeName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <p className="font-medium">{prize.prizeName}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {offer.winners && offer.winners.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-4">Winners</h3>
                  <div className="space-y-3">
                    {offer.winners.map((winner) => (
                      <div key={winner.rank} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold capitalize">{winner.rank} Prize</p>
                            <p className="text-sm">{winner.customerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {winner.mobileNumber}
                            </p>
                          </div>
                          {winner.announcedAt && (
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(winner.announcedAt), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {offer.offerType === 'festival' && offer.festivalSubType === 'amountBased' && (
        <Card>
          <CardHeader>
            <CardTitle>Festival Amount-Based Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Festival Name</p>
              <p className="text-xl font-bold">{offer.festivalName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Minimum Purchase Amount</p>
              <p className="text-lg font-medium">₹{offer.minimumAmount}</p>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Prize Name</p>
                <p className="font-medium">{offer.prizeName}</p>
              </div>
              {offer.prizeImageUrl && (
                <div className="relative h-32 w-full rounded-md overflow-hidden">
                  <Image
                    src={offer.prizeImageUrl}
                    alt={offer.prizeName || 'Prize'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            {offer.eligibleInvoices && (
              <div>
                <p className="text-sm text-muted-foreground">Eligible Invoices</p>
                <p className="font-medium">{offer.eligibleInvoices.length} invoices</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {offer.offerType === 'regular' && offer.regularSubType === 'visitCount' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Visit Count Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Required Visits</p>
              <p className="text-lg font-medium">{offer.visitCount} visits</p>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Prize Name</p>
                <p className="font-medium">{offer.prizeName}</p>
              </div>
              {offer.prizeImageUrl && (
                <div className="relative h-32 w-full rounded-md overflow-hidden">
                  <Image
                    src={offer.prizeImageUrl}
                    alt={offer.prizeName || 'Prize'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            {offer.eligibleCustomers && (
              <div>
                <p className="text-sm text-muted-foreground">Eligible Customers</p>
                <p className="font-medium">{offer.eligibleCustomers.length} customers</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {offer.offerType === 'regular' && offer.regularSubType === 'purchaseAmount' && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Amount Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Target Amount</p>
              <p className="text-lg font-medium">₹{offer.targetAmount}</p>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Prize Name</p>
                <p className="font-medium">{offer.prizeName}</p>
              </div>
              {offer.prizeImageUrl && (
                <div className="relative h-32 w-full rounded-md overflow-hidden">
                  <Image
                    src={offer.prizeImageUrl}
                    alt={offer.prizeName || 'Prize'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            {offer.eligibleCustomers && (
              <div>
                <p className="text-sm text-muted-foreground">Eligible Customers</p>
                <p className="font-medium">{offer.eligibleCustomers.length} customers</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link href={`/admin/offers/${offer._id}/eligible`}>
          <Button>
            <Users className="mr-2 h-4 w-4" />
            View Eligible Entries
          </Button>
        </Link>
        {offer.offerType === 'festival' && 
         offer.festivalSubType === 'hitCounter' && 
         offer.status === 'active' && (
          <Link href={`/admin/offers/${offer._id}/winners`}>
            <Button variant="secondary">
              <Trophy className="mr-2 h-4 w-4" />
              Select Winners
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}