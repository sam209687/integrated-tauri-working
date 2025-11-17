// src/app/(admin)/admin/_components/ManageCashiersTable.tsx
"use client";

import { useEffect, useState } from "react";
import { DataTableUI } from "@/components/tables/DataTableUI";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface CashierData {
  _id: string;
  name: string;
  personalEmail: string; // Renamed from email
  email: string; // Renamed from username (this is the login email)
  phone: string;
  aadhaar: string;
  storeLocation: string;
  isPasswordResetRequested: boolean;
  status: 'active' | 'inactive'; // Added status field for completeness
}

export function ManageCashiersTable() {
  const [cashiers, setCashiers] = useState<CashierData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCashiers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cashier"); // Assuming /api/cashier returns all cashiers now
      const data = await response.json();
      if (response.ok) {
        setCashiers(data); // Assuming data is directly the array of cashiers from /api/cashier
      } else {
        throw new Error(data.message || "Failed to fetch cashiers.");
      }
    } catch (error) { // 💡 FIX 1: Removed ': any'
      const errorMessage = error instanceof Error ? error.message : "Error fetching cashiers.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashiers();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this cashier?")) {
      try {
        const response = await fetch(`/api/cashier/${id}`, { // Using the specific ID route for delete
          method: "DELETE",
        });
        const data = await response.json();
        if (response.ok) {
          toast.success(data.message);
          fetchCashiers(); // Refresh list
        } else {
          throw new Error(data.message || "Failed to delete cashier.");
        }
      } catch (error) { // 💡 FIX 2: Removed ': any'
        const errorMessage = error instanceof Error ? error.message : "Error deleting cashier.";
        toast.error(errorMessage);
      }
    }
  };

  const handleResetPassword = async (cashier: CashierData) => {
    try {
      // Send the 'email' (login email) for password reset
      const response = await fetch(`/api/cashier/${cashier._id}/reset-password`, { // Adjusted API endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cashier.email }), // Sending the LOGIN email
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        fetchCashiers();
      } else {
        throw new Error(data.message || "Failed to initiate password reset.");
      }
    } catch (error) { // 💡 FIX 3: Removed ': any'
      const errorMessage = error instanceof Error ? error.message : "Error initiating password reset.";
      toast.error(errorMessage);
    }
  };

  const columns = [
    { header: "Name", accessorKey: "name" },
    { header: "Login Email", accessorKey: "email" }, // Changed
    { header: "Personal Email", accessorKey: "personalEmail" }, // New column
    { header: "Phone", accessorKey: "phone" },
    { header: "Aadhaar", accessorKey: "aadhaar" },
    { header: "Location", accessorKey: "storeLocation" },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: { row: CashierData }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            row.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
          }`}
        >
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      ),
    },
    {
      header: "Action",
      accessorKey: "actions",
      cell: ({ row }: { row: CashierData }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/manage-cashiers/edit/${row._id}`)}> {/* Direct link for edit */}
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row._id)}>
            Delete
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" disabled={!row.isPasswordResetRequested} className={row.isPasswordResetRequested ? "bg-orange-100 text-orange-700" : ""}>
                {row.isPasswordResetRequested ? "Initiate Reset" : "Reset Password"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Cashier Password</DialogTitle>
                <DialogDescription>
                  Are you sure you want to reset password for {row.name}? An OTP will be sent to their personal email.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => handleResetPassword(row)}>Confirm Reset</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="text-center p-4">Loading cashiers...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Cashiers</h2>
      <DataTableUI columns={columns} data={cashiers} caption="List of all registered cashiers." />
    </div>
  );
}