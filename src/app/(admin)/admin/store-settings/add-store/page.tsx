import { StoreForm } from "@/components/forms/StoreForm";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

// ✅ Prevent build-time serialization issues with MongoDB/BSON types
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const AddStorePage = () => {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Heading title="Add Store" description="Create a new store setting" />
      <Separator />
      <StoreForm />
    </div>
  );
};

export default AddStorePage;
