"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Trash2, Eye, Users, Trophy, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useOfferStore } from "@/store/offer.store";
import { IOffer } from "@/lib/models/offer";

interface OffersListProps {
  initialOffers: IOffer[];
}

export function OffersList({ initialOffers }: OffersListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  
  const { offers, setOffers, deleteOffer } = useOfferStore();

  // Initialize store with server data
  useState(() => {
    if (offers.length === 0 && initialOffers.length > 0) {
      setOffers(initialOffers);
    }
  });

  const handleDeleteClick = (offerId: string) => {
    setOfferToDelete(offerId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (offerToDelete) {
      await deleteOffer(offerToDelete);
      setDeleteDialogOpen(false);
      setOfferToDelete(null);
    }
  };

  const getOfferTypeLabel = (offer: IOffer) => {
    if (offer.offerType === 'festival') {
      return offer.festivalSubType === 'hitCounter' 
        ? 'Festival Hit Counter' 
        : 'Festival Amount';
    }
    return offer.regularSubType === 'visitCount' 
      ? 'Regular Visit Count' 
      : 'Regular Purchase Amount';
  };

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

  const displayOffers = offers.length > 0 ? offers : initialOffers;

  if (displayOffers.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No offers found. Create your first offer!</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Offer Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayOffers.map((offer) => {
              const product = offer.product as any;
              return (
                <TableRow key={offer._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product?.image && (
                        <div className="relative h-10 w-10 rounded overflow-hidden">
                          <Image
                            src={product.image}
                            alt={product?.product?.productName || 'Product'}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {product?.product?.productName || 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {product?.variantVolume} {product?.unit?.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getOfferTypeLabel(offer)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{format(new Date(offer.startDate), 'MMM dd, yyyy')}</p>
                      <p className="text-muted-foreground">
                        to {format(new Date(offer.endDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(offer.status)}>
                      {offer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {offer.offerType === 'festival' && (
                      <div className="text-sm">
                        {offer.festivalSubType === 'hitCounter' ? (
                          <>
                            <p className="font-medium">{offer.festivalName}</p>
                            <p className="text-muted-foreground">
                              First {offer.customerLimit} customers
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium">{offer.festivalName}</p>
                            <p className="text-muted-foreground">
                              Min: ₹{offer.minimumAmount}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                    {offer.offerType === 'regular' && (
                      <div className="text-sm">
                        {offer.regularSubType === 'visitCount' ? (
                          <p className="text-muted-foreground">
                            {offer.visitCount} visits required
                          </p>
                        ) : (
                          <p className="text-muted-foreground">
                            Target: ₹{offer.targetAmount}
                          </p>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* View Details */}
                      <Link href={`/admin/offers/${offer._id}`}>
                        <Button variant="ghost" size="icon" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      {/* ✅ NEW: Edit Button */}
                      <Link href={`/admin/offers/${offer._id}/edit`}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Edit Offer"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>

                      {/* View Eligible Entries */}
                      <Link href={`/admin/offers/${offer._id}/eligible`}>
                        <Button variant="ghost" size="icon" title="View Eligible Entries">
                          <Users className="h-4 w-4" />
                        </Button>
                      </Link>

                      {/* Select Winners (Hit Counter only) */}
                      {offer.offerType === 'festival' && 
                       offer.festivalSubType === 'hitCounter' && 
                       offer.status === 'active' && (
                        <Link href={`/admin/offers/${offer._id}/winners`}>
                          <Button variant="ghost" size="icon" title="Select Winners">
                            <Trophy className="h-4 w-4 text-yellow-600" />
                          </Button>
                        </Link>
                      )}

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete Offer"
                        onClick={() => handleDeleteClick(offer._id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the offer
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}