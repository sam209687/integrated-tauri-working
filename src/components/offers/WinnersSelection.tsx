"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { IFestivalHitCounterOffer, IPrize } from "@/lib/models/offer";
import { selectWinners } from "@/actions/offer.actions";

interface WinnersSelectionProps {
  offer: IFestivalHitCounterOffer;
}

export function WinnersSelection({ offer }: WinnersSelectionProps) {
  const router = useRouter();
  const [isSelecting, setIsSelecting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedWinners, setSelectedWinners] = useState(offer.winners || null);

  const handleSelectWinners = async () => {
    setIsSelecting(true);
    const result = await selectWinners(offer._id);
    
    if (result.success && result.data) {
      setSelectedWinners(result.data as any);
      setConfirmDialogOpen(false);
      router.refresh();
    } else {
      alert(result.message || 'Failed to select winners');
    }
    
    setIsSelecting(false);
  };

  const hasWinners = selectedWinners && selectedWinners.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/offers/${offer._id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Select Winners</h1>
            <p className="text-muted-foreground">
              Randomly select winners from eligible customers
            </p>
          </div>
        </div>
        {!hasWinners && (
          <Button 
            onClick={() => setConfirmDialogOpen(true)}
            disabled={isSelecting}
          >
            <Trophy className="mr-2 h-4 w-4" />
            Select Winners
          </Button>
        )}
      </div>

      {/* Offer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Offer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Festival Name</p>
              <p className="font-medium">{offer.festivalName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer Limit</p>
              <p className="font-medium">First {offer.customerLimit} customers</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">
                {format(new Date(offer.startDate), 'MMM dd, yyyy')} - {format(new Date(offer.endDate), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={offer.status === 'completed' ? 'bg-blue-500' : 'bg-green-500'}>
                {offer.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prizes */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Prizes</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {offer.prizes?.map((prize: IPrize) => (
            <Card key={prize.rank}>
              <CardHeader>
                <CardTitle className="capitalize flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {prize.rank} Prize
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{prize.prizeName}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Winners */}
      {hasWinners ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Selected Winners 🎉</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {selectedWinners.map((winner: any) => (
              <Card key={winner.rank} className="border-2 border-yellow-500">
                <CardHeader>
                  <CardTitle className="capitalize flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    {winner.rank} Prize Winner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                    <p className="font-bold text-lg">{winner.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mobile Number</p>
                    <p className="font-medium">{winner.mobileNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice ID</p>
                    <p className="font-mono text-sm">{winner.invoiceId}</p>
                  </div>
                  {winner.announcedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Announced At</p>
                      <p className="text-sm">
                        {format(new Date(winner.announcedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Winners Selected Yet</h3>
            <p className="text-muted-foreground mb-4">
              Click the "Select Winners" button to randomly choose 3 winners from eligible customers
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Select Winners?</AlertDialogTitle>
            <AlertDialogDescription>
              This will randomly select 3 winners (1st, 2nd, and 3rd prize) from the first {offer.customerLimit} eligible customers. 
              This action cannot be undone. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSelecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSelectWinners}
              disabled={isSelecting}
            >
              {isSelecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Selecting...
                </>
              ) : (
                'Select Winners'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}