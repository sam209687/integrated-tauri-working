import { getOfferById } from "@/actions/offer.actions";
import { EditOfferForm } from "@/components/forms/EditOfferForm";
import { notFound } from "next/navigation";

export default async function EditOfferPage({ 
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
      <h1 className="text-3xl font-bold mb-6">Edit Offer</h1>
      <EditOfferForm initialData={result.data} />
    </div>
  );
}