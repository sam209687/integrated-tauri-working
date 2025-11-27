import { OfferForm } from "@/components/forms/OfferForm";

export default function NewOfferPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Create New Offer</h1>
      <OfferForm />
    </div>
  );
}