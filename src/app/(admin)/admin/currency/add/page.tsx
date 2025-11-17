// src/app/(admin)/admin/currency/add/page.tsx
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import CurrencyForm from "@/components/forms/CurrencyForm";

// ✅ Fix: Disable static optimization so Next.js renders dynamically at runtime
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const AddCurrencyPage = () => {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Heading title="Add Currency" description="Create a new currency entry" />
      <Separator />
      <CurrencyForm />
    </div>
  );
};

export default AddCurrencyPage;
