import { getOfferById, calculateEligibleEntries } from "@/actions/offer.actions";
import { EligibleEntriesList } from "@/components/offers/EligibleEntriesList";
import { notFound } from "next/navigation";

export default async function EligibleEntriesPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  const [offerResult, eligibleResult] = await Promise.all([
    getOfferById(id),
    calculateEligibleEntries(id),
  ]);

  if (!offerResult.success || !offerResult.data) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Eligible Entries</h1>
      <EligibleEntriesList 
        offer={offerResult.data}
        eligibleData={eligibleResult.success ? eligibleResult.data : null}
      />
    </div>
  );
}