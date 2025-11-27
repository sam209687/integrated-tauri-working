// src/components/offers/EligibleEntriesList.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IOffer, IFestivalHitCounterOffer, IFestivalAmountOffer, IRegularVisitCountOffer, IRegularPurchaseAmountOffer } from "@/lib/models/offer";
import { calculateEligibleEntries } from "@/actions/offer.actions";

interface EligibleEntriesListProps {
  offer: IOffer;
  eligibleData: any;
}

export function EligibleEntriesList({ offer, eligibleData: initialData }: EligibleEntriesListProps) {
  const [eligibleData, setEligibleData] = useState(initialData);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleRecalculate = async () => {
    setIsCalculating(true);
    const result = await calculateEligibleEntries(offer._id);
    if (result?.success) {
      setEligibleData(result.data);
    }
    setIsCalculating(false);
  };

  const shouldShowInvoices =
    offer.offerType === "festival" &&
    ((offer as IFestivalHitCounterOffer).festivalSubType === "hitCounter" ||
      (offer as IFestivalAmountOffer).festivalSubType === "amountBased");

  const getOfferTypeDescription = () => {
    if (offer.offerType === "festival") {
      if ((offer as IFestivalHitCounterOffer).festivalSubType === "hitCounter") {
        return `First ${(offer as IFestivalHitCounterOffer).customerLimit} customers who purchased this product`;
      }
      if ((offer as IFestivalAmountOffer).festivalSubType === "amountBased") {
        return `Customers with invoice amount ≥ ₹${(offer as IFestivalAmountOffer).minimumAmount}`;
      }
    }
    if (offer.offerType === "regular") {
      if ((offer as IRegularVisitCountOffer).regularSubType === "visitCount") {
        return `Customers with ${(offer as IRegularVisitCountOffer).visitCount} or more visits`;
      }
      if ((offer as IRegularPurchaseAmountOffer).regularSubType === "purchaseAmount") {
        return `Customers with total purchase ≥ ₹${(offer as IRegularPurchaseAmountOffer).targetAmount}`;
      }
    }
    return "";
  };

  const renderInvoicesList = () => {
    if (!eligibleData?.invoices || eligibleData.invoices.length === 0) {
      return <div className="text-center py-10"><p className="text-muted-foreground">No eligible invoices found.</p></div>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {eligibleData.invoices.map((invoice: any) => (
            <TableRow key={invoice._id}>
              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
              <TableCell>{invoice.customer?.name || "N/A"}</TableCell>
              <TableCell>{invoice.customer?.phone || "N/A"}</TableCell>
              <TableCell>₹{Number(invoice.totalPayable || 0).toFixed(2)}</TableCell>
              <TableCell>{format(new Date(invoice.createdAt), "MMM dd, yyyy HH:mm")}</TableCell>
              <TableCell>
                <Badge variant={invoice.status === "active" ? "default" : "secondary"}>{invoice.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderCustomersList = () => {
    if (!eligibleData?.customers || eligibleData.customers.length === 0) {
      return <div className="text-center py-10"><p className="text-muted-foreground">No eligible customers found.</p></div>;
    }

    const isVisitCount = offer.offerType === "regular" && (offer as IRegularVisitCountOffer).regularSubType === "visitCount";
    const isPurchaseAmount = offer.offerType === "regular" && (offer as IRegularPurchaseAmountOffer).regularSubType === "purchaseAmount";

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Mobile</TableHead>
            {isVisitCount && <TableHead>Visit Count</TableHead>}
            {isPurchaseAmount && <TableHead>Total Amount</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {eligibleData.customers.map((customer: any) => (
            <TableRow key={customer._id}>
              <TableCell className="font-medium">{customer.customerName}</TableCell>
              <TableCell>{customer._id}</TableCell>
              {isVisitCount && <TableCell><Badge>{customer.visitCount} visits</Badge></TableCell>}
              {isPurchaseAmount && <TableCell><Badge>₹{Number(customer.totalAmount || 0).toFixed(2)}</Badge></TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/admin/offers/${offer._id}`}>
            <Button variant="ghost" size="icon" title="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold">Eligible Entries</h2>
            <p className="text-sm text-muted-foreground">{getOfferTypeDescription()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleRecalculate} disabled={isCalculating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isCalculating ? "animate-spin" : ""}`} />
            Recalculate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Eligible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{eligibleData?.count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Start</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium">{format(new Date(offer.startDate), "MMM dd, yyyy")}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>End</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium">{format(new Date(offer.endDate), "MMM dd, yyyy")}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{shouldShowInvoices ? "Eligible Invoices" : "Eligible Customers"}</CardTitle>
        </CardHeader>
        <CardContent>
          {shouldShowInvoices ? renderInvoicesList() : renderCustomersList()}
        </CardContent>
      </Card>
    </div>
  );
}

export default EligibleEntriesList;
