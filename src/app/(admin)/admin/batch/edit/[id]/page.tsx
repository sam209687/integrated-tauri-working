import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { redirect } from "next/navigation";
import { getBatchById, createBatch, updateBatch, generateBatchNumber } from "@/actions/batch.actions";
import BatchFormWrapper from "@/components/forms/BatchFormWrapper";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function EditBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getBatchById(id);

  if (!result.success || !result.data) {
    redirect("/admin/batch");
  }

  return (
    <div className="p-8 pt-6 space-y-4">
      <Heading title="Edit Batch" description="Update existing batch details." />
      <Separator />
      <BatchFormWrapper
        initialData={result.data}
        createBatchAction={createBatch}
        updateBatchAction={updateBatch}
        generateBatchNumberAction={generateBatchNumber}
      />
    </div>
  );
}
