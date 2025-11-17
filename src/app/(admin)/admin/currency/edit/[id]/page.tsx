// src/app/(admin)/admin/currency/edit/[id]/page.tsx
import { getCurrencies } from "@/actions/currency.actions";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import CurrencyForm from "@/components/forms/CurrencyForm";

// ✅ Fix: Force dynamic rendering (prevents static serialization of DB data)
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

interface Currency {
  _id: string;
  sNo: string;
  currencyName: string;
  currencySymbol: string;
}

export default async function EditCurrencyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCurrencies();

  const currencies: Currency[] = result.success ? result.data : [];
  const initialData = currencies.find((c) => c._id === id) || null;

  if (!initialData) {
    return <div>Currency not found.</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Heading title="Edit Currency" description="Update a currency symbol" />
      <Separator />
      <CurrencyForm initialData={initialData} />
    </div>
  );
}
