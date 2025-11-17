"use client";

import { useEffect, useState, useTransition } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { IInvoice } from "@/lib/models/invoice";
import { useInvoiceStore } from "@/store/invoice.store";
import { usePrintStore } from "@/store/printStore";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ------------------------------------------------------------------
// 💡 Define interfaces for populated fields
// ------------------------------------------------------------------
interface ICustomerRef {
  name?: string;
  phone?: string;
}

interface IBilledByRef {
  name?: string;
}

// ✅ Define PopulatedInvoice type with optional populated refs
export type PopulatedInvoice = Omit<IInvoice, "customer" | "billedBy"> & {
  customer?: ICustomerRef | null;
  billedBy?: IBilledByRef | null;
};

// ------------------------------------------------------------------
// 💡 Component
// ------------------------------------------------------------------
interface InvoiceTableProps {
  initialInvoices: PopulatedInvoice[];
}

export function InvoiceTable({ initialInvoices }: InvoiceTableProps) {
  const { invoices: storeInvoices, setInvoices, cancelInvoiceAction } =
    useInvoiceStore();
  const { openModal: openPrintModal } = usePrintStore();

  const invoices = storeInvoices as unknown as PopulatedInvoice[];

  const [isCancelling, startCancelTransition] = useTransition();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // ✅ Initialize invoices from props
  useEffect(() => {
    setInvoices(initialInvoices as unknown as IInvoice[]);
  }, [initialInvoices, setInvoices]);

  // ------------------------------------------------------------------
  // ✅ Filtering logic — safe against null or unpopulated references
  // ------------------------------------------------------------------
  const filteredInvoices = invoices.filter((invoice) => {
    const searchString = debouncedSearchTerm.toLowerCase();

    const customer = invoice.customer ?? null;
    const billedBy = invoice.billedBy ?? null;

    const customerName =
      customer && typeof customer === "object" && "name" in customer
        ? customer.name ?? ""
        : "";
    const customerPhone =
      customer && typeof customer === "object" && "phone" in customer
        ? customer.phone ?? ""
        : "";
    const billedByName =
      billedBy && typeof billedBy === "object" && "name" in billedBy
        ? billedBy.name ?? ""
        : "";

    const invoiceNumber = invoice.invoiceNumber || "";

    return (
      invoiceNumber.toLowerCase().includes(searchString) ||
      customerName.toLowerCase().includes(searchString) ||
      customerPhone.toLowerCase().includes(searchString) ||
      billedByName.toLowerCase().includes(searchString)
    );
  });

  // ------------------------------------------------------------------
  // ✅ Handlers
  // ------------------------------------------------------------------
  const handleCancel = (invoiceId: string) => {
    if (
      window.confirm(
        "Are you sure you want to cancel this invoice? This cannot be undone."
      )
    ) {
      setCancellingId(invoiceId);
      startCancelTransition(() => {
        cancelInvoiceAction(invoiceId).finally(() => setCancellingId(null));
      });
    }
  };

  const handleView = (invoice: PopulatedInvoice) => {
    openPrintModal(invoice as unknown as IInvoice);
  };

  // ------------------------------------------------------------------
  // ✅ Render
  // ------------------------------------------------------------------
  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Input
          placeholder="Search by Invoice No, Customer Name, Mobile, Billed By..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">S/No</TableHead>
                <TableHead>Invoice No</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Billed By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice, index) => (
                  <TableRow
                    key={invoice._id}
                    className={cn(
                      invoice.status === "cancelled" &&
                        "text-gray-500 line-through"
                    )}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>

                    {/* ✅ Customer Safe Render */}
                    <TableCell>
                      {invoice.customer &&
                      typeof invoice.customer === "object" &&
                      "name" in invoice.customer
                        ? invoice.customer.name ?? ""
                        : ""}
                    </TableCell>

                    <TableCell>
                      {invoice.customer &&
                      typeof invoice.customer === "object" &&
                      "phone" in invoice.customer
                        ? invoice.customer.phone ?? ""
                        : ""}
                    </TableCell>

                    {/* ✅ Billed By Safe Render */}
                    <TableCell>
                      {invoice.billedBy &&
                      typeof invoice.billedBy === "object" &&
                      "name" in invoice.billedBy
                        ? invoice.billedBy.name ?? ""
                        : ""}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          invoice.status === "cancelled"
                            ? "destructive"
                            : "default"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Invoice */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleView(invoice)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Invoice</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Cancel Invoice */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleCancel(invoice._id)}
                              disabled={
                                (isCancelling &&
                                  cancellingId === invoice._id) ||
                                invoice.status === "cancelled"
                              }
                            >
                              {isCancelling &&
                              cancellingId === invoice._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cancel Invoice</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No invoices found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
