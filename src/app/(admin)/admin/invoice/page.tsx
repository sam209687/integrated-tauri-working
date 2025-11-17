// src/app/(admin)/admin/invoice/page.tsx
import { getInvoices } from "@/actions/invoice.actions";
import { InvoiceTable } from "@/components/invoice/InvoiceTable";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// ✅ Force runtime rendering to avoid build serialization issues
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminInvoicePage() {
  const result = await getInvoices();

  // ✅ Safely serialize and normalize invoices
  const invoices = result.success && Array.isArray(result.data)
    ? JSON.parse(JSON.stringify(result.data))
    : [];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Invoices</h1>
        <Button asChild>
          <Link href="/admin/pos">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Invoice
          </Link>
        </Button>
      </div>

      {/* ✅ Always provide a serialized, defined array */}
      <InvoiceTable initialInvoices={invoices} />
    </div>
  );
}
