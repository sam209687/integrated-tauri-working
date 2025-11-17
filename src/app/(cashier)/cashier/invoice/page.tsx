import { auth } from "@/lib/auth";
import { getInvoices } from "@/actions/invoice.actions";
import { InvoiceTable } from "@/components/invoice/InvoiceTable";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

// ✅ Prevent Next.js from statically serializing the session or data
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function CashierInvoicePage() {
  // 1️⃣ Authenticate cashier
  const session = await auth();
  if (!session || session.user.role !== "cashier") {
    redirect("/auth");
  }

  // 2️⃣ Fetch invoices from server
  const result = await getInvoices();
  const rawInvoices = result.success && Array.isArray(result.data) ? result.data : [];

  // 3️⃣ ✅ Deep serialize invoices to plain JSON objects
  const invoices = JSON.parse(JSON.stringify(rawInvoices));

  // 4️⃣ Render Client Component
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Invoices</h1>
        <Button asChild>
          <Link href="/cashier/pos">
            <PlusCircle className="h-4 w-4 mr-2" />
            Go to POS
          </Link>
        </Button>
      </div>

      {/* ✅ Pass only plain JSON objects */}
      <InvoiceTable initialInvoices={invoices} />
    </div>
  );
}
