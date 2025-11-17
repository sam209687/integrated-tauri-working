// src/components/tables/batchTable.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useBatchStore, IPopulatedBatch } from "@/store/batch.store";
import { useDebounce } from "@/hooks/use-debounce";
import { deleteBatch } from "@/actions/batch.actions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, Pencil, Trash2, Plus, FileText } from "lucide-react";

// The IPopulatedBatch interface is now imported from the store.
// We'll define a temporary type for the prop to prevent a circular dependency.
type BatchTableProps = {
  initialBatches: IPopulatedBatch[];
};

export function BatchTable({ initialBatches }: BatchTableProps) {
  const { batches, setBatches } = useBatchStore();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  // Removed isPending and startTransition as they are not needed for simple Link navigation
  const [selectedBatchForReport, setSelectedBatchForReport] = useState<IPopulatedBatch | null>(null);

  useEffect(() => {
    setBatches(initialBatches);
  }, [initialBatches, setBatches]);

  const filteredBatches = batches.filter((batch: IPopulatedBatch) =>
    (batch.batchNumber?.toLowerCase() || "").includes(debouncedSearchTerm.toLowerCase()) ||
    (batch.vendorName?.toLowerCase() || "").includes(debouncedSearchTerm.toLowerCase()) ||
    (batch.product?.productName?.toLowerCase() || "").includes(debouncedSearchTerm.toLowerCase())
  );

  const handleDelete = (batchId: string) => {
    if (window.confirm("Are you sure you want to delete this batch?")) {
      setDeletingId(batchId);
      startDeleteTransition(() => {
        deleteBatch(batchId).finally(() => setDeletingId(null));
      });
    }
  };

  // ✅ REMOVED: handleAddBatchClick is no longer necessary as Link handles transition

  const handleOpenReport = (batch: IPopulatedBatch) => {
    setSelectedBatchForReport(batch);
  };

  const handlePrint = () => {
    if (!selectedBatchForReport) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    // We no longer need to call renderReport here, just ensure the styles are good
    const contentString = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Batch Report</title>
          <style>
            body { font-family: sans-serif; margin: 0; padding: 1rem; font-size: 14px; line-height: 1.5; }
            h2 { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
            strong { font-weight: bold; }
            .space-y-2 > p + p { margin-top: 0.5rem; }
            .text-xl { font-size: 1.25rem; }
            .font-extrabold { font-weight: 800; }
            .rounded-md { border-radius: 0.375rem; }
            .border { border: 1px solid #e5e7eb; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 0.75rem; text-align: left; border: 1px solid #e5e7eb; }
            thead tr { background-color: #f9fafb; }
            .flex { display: flex; }
            .justify-end { justify-content: flex-end; }
            .gap-2 { gap: 0.5rem; }
            .p-6 { padding: 1.5rem; }
          </style>
        </head>
        <body>
          <div id="report-content">${document.getElementById("report-content")?.innerHTML}</div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(contentString);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const renderReport = () => {
    if (!selectedBatchForReport) return null;
    // ✅ FIX: Remove 'variant' from destructuring to resolve TS2339
    const { product, vendorName, batchNumber, qty, price, oilExpelled, createdAt } = selectedBatchForReport;
    const date = new Date(createdAt).toLocaleDateString();
    
    // Safety check for calculations
    const safeQty = qty ?? 0;
    const safeOilExpelled = oilExpelled ?? 0;
    const safePrice = price ?? 0;

    const seedsConsumed = (safeQty > 0 && safeOilExpelled > 0) ? safeQty / safeOilExpelled : 0;
    const purchasePricePerKg = (safePrice > 0 && safeQty > 0) ? safePrice / safeQty : 0;
    
    // Round down to one decimal place for calculations
    const roundedSeedsConsumed = Math.floor(seedsConsumed * 10) / 10;
    
    // New calculation for Oil Price / Ltr
    const oilPricePerLtr = purchasePricePerKg * roundedSeedsConsumed; 
    
    // Fallback if product or sellingPrice is null/undefined
    const sellingPrice = product?.sellingPrice ?? 0; 

    return (
      <div id="report-content" className="space-y-4 p-6 border rounded-md">
        <h2 className="text-xl font-extrabold text-gray-800">Batch Details</h2>
        <div className="grid grid-cols-2 gap-y-2 text-gray-700">
          <p><strong>Batch Number:</strong></p>
          <p>{batchNumber}</p>
          <p><strong>Product:</strong></p>
          <p>{product?.productName}</p>
          <p><strong>Category:</strong></p>
          {/* Note: product.category is not populated here, relying on product.productName for context */}
          <p>{product?.category?.name || "N/A"}</p> 
          <p><strong>Vendor:</strong></p>
          <p>{vendorName}</p>
          <p><strong>Date:</strong></p>
          <p>{date}</p>
        </div>
        
        <Separator />
        
        <h3 className="text-lg font-bold mt-4 text-gray-800">Financial & Production Summary</h3>
        <div className="grid grid-cols-2 gap-y-2 text-gray-700">
          <p><strong>Quantity Purchased (KG):</strong></p>
          <p>{safeQty.toFixed(2)}</p>
          <p><strong>Total Price (INR):</strong></p>
          <p>₹{safePrice.toFixed(2)}</p>
          <p><strong>Purchase Price (INR/KG):</strong></p>
          <p>₹{purchasePricePerKg.toFixed(2)}</p>

          {safeOilExpelled > 0 && (
            <>
              <p><strong>Oil Expelled (Ltrs):</strong></p>
              <p>{safeOilExpelled.toFixed(2)}</p>
              <p><strong>Seeds Consumed per Ltr (KG):</strong></p>
              <p>{seedsConsumed.toFixed(2)}</p>
              <p><strong>Cost Price of Oil (INR/Ltr):</strong></p>
              <p>₹{oilPricePerLtr.toFixed(2)}</p>
            </>
          )}

          {sellingPrice > 0 && (
            <>
              <p><strong>Product Selling Price (INR/Unit):</strong></p>
              <p>₹{sellingPrice.toFixed(2)}</p>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search batches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        {/* ✅ FIX: Removed unnecessary onClick={handleAddBatchClick} and isPending from the Button */}
        <Link href="/admin/batch/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Batch
          </Button>
        </Link>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch No.</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Qty (KG)</TableHead>
              <TableHead className="text-right">Price (₹)</TableHead>
              <TableHead className="text-right">Oil Expelled (Ltr)</TableHead>
              <TableHead className="text-center w-20">Actions</TableHead> {/* ✅ FIX: w-20 */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBatches.length > 0 ? (
              filteredBatches.map((batch) => (
                <TableRow key={batch._id}>
                  <TableCell className="font-medium min-w-20">{batch.batchNumber}</TableCell> {/* ✅ FIX: min-w-20 */}
                  <TableCell>{batch.product?.productName}</TableCell>
                  <TableCell>{batch.vendorName}</TableCell>
                  <TableCell className="text-right">{batch.qty?.toFixed(2) ?? 'N/A'}</TableCell>
                  <TableCell className="text-right">₹{batch.price?.toFixed(2) ?? 'N/A'}</TableCell>
                  <TableCell className="text-right">{batch.oilExpelled?.toFixed(2) ?? 'N/A'}</TableCell>
                  <TableCell className="flex justify-center items-center gap-2 min-w-20"> {/* ✅ FIX: min-w-20 */}
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleOpenReport(batch)} 
                      title="View Report"
                      disabled={isDeleting}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Link href={`/admin/batch/edit/${batch._id}`} className="min-w-fit">
                      <Button variant="outline" size="icon" title="Edit" disabled={isDeleting}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => handleDelete(batch._id)}
                      disabled={isDeleting && deletingId === batch._id}
                      title="Delete"
                    >
                      {isDeleting && deletingId === batch._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No batches found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog 
        open={!!selectedBatchForReport} 
        onOpenChange={(open) => !open && setSelectedBatchForReport(null)}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Report</DialogTitle>
          </DialogHeader>
          <div className="no-print">
            <p className="text-sm text-muted-foreground">This is a summary of the batch details and key metrics.</p>
          </div>
          <Separator />
          {/* The report content is rendered here */}
          {renderReport()}
          {/* Place print/close buttons outside the renderReport function but inside DialogContent */}
          <div className="flex justify-end gap-2 mt-4 no-print">
            <Button onClick={handlePrint} className="no-print">Print</Button>
            <Button variant="outline" onClick={() => setSelectedBatchForReport(null)} className="no-print">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
      <style jsx global>
        {`
          @media print {
            body > * {
              display: none !important;
            }
            #report-content, #report-content * {
              display: block !important;
            }
            /* Add some spacing for better print readability */
            #report-content {
              width: 100%;
              padding: 0;
              margin: 0;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}