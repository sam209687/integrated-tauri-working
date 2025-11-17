import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { getStores } from "@/actions/store.actions";
import { StoreForm } from "@/components/forms/StoreForm";
import { IStore } from "@/lib/models/store";

// ✅ Force dynamic rendering to prevent build-time serialization issues
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function EditStorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ Must await in Next.js 15

  const result = await getStores();

  const stores: IStore[] = result.success ? (result.data as IStore[]) : [];
  const initialData = stores.find((store) => store._id === id) || null;

  if (!initialData) {
    return <div>Store not found.</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Heading title="Edit Store" description="Update a store setting" />
      <Separator />
      <StoreForm initialData={initialData} />
    </div>
  );
}
