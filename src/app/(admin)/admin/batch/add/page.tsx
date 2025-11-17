import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import BatchFormWrapper from "@/components/forms/BatchFormWrapper";
import {
  createBatch,
  updateBatch,
  generateBatchNumber,
} from "@/actions/batch.actions";

// ✅ Force dynamic rendering to prevent static build serialization
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function AddBatchPage() {
  return (
    <div className="flex flex-col p-8 pt-6 space-y-4">
      <Heading title="Add New Batch" description="Create a new batch entry." />
      <Separator />
      <BatchFormWrapper
        initialData={null}
        createBatchAction={createBatch}
        updateBatchAction={updateBatch}
        generateBatchNumberAction={generateBatchNumber}
      />
    </div>
  );
}
