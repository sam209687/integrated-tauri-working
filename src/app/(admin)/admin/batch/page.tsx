// src/app/(admin)/admin/batch/page.tsx
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { BatchTable } from "@/components/tables/batchTable";
import { getBatches } from "@/actions/batch.actions";
import { IPopulatedBatch } from "@/store/batch.store";

// 🚀 Prevent static optimization & enforce runtime rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function BatchListPage() {
  try {
    // ✅ Always run server-side during runtime
    const batchesResult = await getBatches();

    // ✅ Ensure data safety
    const batches: IPopulatedBatch[] =
      batchesResult.success && Array.isArray(batchesResult.data)
        ? (batchesResult.data as IPopulatedBatch[])
        : [];

    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <Heading
            title="Batch List"
            description="View and manage all created batches"
          />
          <Separator />
          <BatchTable initialBatches={batches} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("❌ Error loading batch list page:", error);

    // ✅ Graceful fallback
    return (
      <div className="p-8">
        <Heading
          title="Batch List"
          description="View and manage all created batches"
        />
        <Separator className="my-4" />
        <p className="text-red-500">
          Failed to load batches. Please try again later.
        </p>
      </div>
    );
  }
}
