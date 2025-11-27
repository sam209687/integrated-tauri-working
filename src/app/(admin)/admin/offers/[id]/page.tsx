import { getOfferById } from "@/actions/offer.actions";
import { OfferDetails } from "@/components/offers/OfferDetails";
import { notFound } from "next/navigation";

export default async function OfferDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const result = await getOfferById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <OfferDetails offer={result.data} />
    </div>
  );
}