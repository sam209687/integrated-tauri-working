// src/app/(admin)/admin/manage-cashiers/edit/[id]/page.tsx
import React from "react";
import PageHeader from "@/components/admin/PageHeader";
import { EditCashierForm } from "@/components/admin/EditCashierForm";

// ✅ Prevent static rendering or data collection issues
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function EditCashierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ Await params to extract id safely

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Edit Cashier" />
      <EditCashierForm cashierId={id} />
    </div>
  );
}
