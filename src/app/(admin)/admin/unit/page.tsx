// src/app/(admin)/admin/unit/page.tsx
import { UnitTable } from "@/components/tables/UnitTable";
import { IUnit } from "@/lib/models/unit";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

// ✅ Prevent build-time static data collection issues
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// ✅ Safe data fetch with runtime rendering
async function getUnits(): Promise<IUnit[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/unit`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch units.");
  }

  return res.json();
}

export default async function UnitPage() {
  const units = await getUnits();

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Units</h1>
            <Button asChild>
              <Link href="/admin/unit/add-unit">
                <Plus className="mr-2 h-4 w-4" />
                Add Unit
              </Link>
            </Button>
          </div>
          <UnitTable initialUnits={units} />
        </div>
      </div>
    </div>
  );
}
