import { getOffers } from "@/actions/offer.actions";
import { OffersList } from "@/components/offers/OffersList";

export default async function OffersPage() {
  const result = await getOffers();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Offers Management</h1>
        <a 
          href="/admin/offers/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
        >
          Create New Offer
        </a>
      </div>
      {result.success ? (
        <OffersList initialOffers={result.data} />
      ) : (
        <p className="text-red-500">{result.message}</p>
      )}
    </div>
  );
}