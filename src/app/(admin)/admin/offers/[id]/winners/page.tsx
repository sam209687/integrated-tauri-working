import { getOfferById } from "@/actions/offer.actions";
import { WinnersSelection } from "@/components/offers/WinnersSelection";
import { IFestivalHitCounterOffer } from "@/lib/models/offer";
import { notFound } from "next/navigation";

export default async function WinnersPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const result = await getOfferById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const offer = result.data;

  // Only allow for festival hit counter offers
  if (offer.offerType !== 'festival' || offer.festivalSubType !== 'hitCounter') {
    notFound();
  }

  // Type assertion since we've verified it's a festival hit counter offer
  const hitCounterOffer = offer as IFestivalHitCounterOffer;

  return (
    <div className="container mx-auto py-10">
      <WinnersSelection offer={hitCounterOffer} />
    </div>
  );
}