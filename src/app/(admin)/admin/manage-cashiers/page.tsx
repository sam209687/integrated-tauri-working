// src/app/(admin)/admin/manage-cashiers/page.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { TableUI } from "@/components/uies/table/tableui";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";



// Define the type for a Cashier item in the table
interface Cashier {
  _id: string;
  sNo: number;
  name: string;
  aadhaar: string;
  status: "active" | "inactive";
  personalEmail: string;
  email: string;
  phone: string;
  storeLocation: string;
  [key: string]: string | number | null | undefined;
}

export default function ManageCashiersPage() {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otpDialogOpened, setOtpDialogOpened] = useState(false);
  const [selectedCashierId, setSelectedCashierId] = useState<string | null>(null);
  const [tempOTPs, setTempOTPs] = useState<{
    [key: string]: { otp: string; expiresAt: Date };
  }>({});

  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  useEffect(() => {
    const fetchCashiers = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/cashier");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch cashiers");
        }
        const data: Cashier[] = await response.json();
        const cashiersWithSNo = data.map((cashier, index) => ({
          ...cashier,
          sNo: index + 1,
        }));
        setCashiers(cashiersWithSNo);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error fetching cashiers.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchCashiers();
  }, []);

  useEffect(() => {
    if (highlightId && cashiers.length > 0) {
      const targetRow = rowRefs.current[highlightId];
      if (targetRow) {
        targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
        targetRow.classList.add(
          "bg-yellow-100",
          "dark:bg-yellow-900",
          "animate-pulse"
        );
        const timer = setTimeout(() => {
          targetRow.classList.remove(
            "bg-yellow-100",
            "dark:bg-yellow-900",
            "animate-pulse"
          );
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [cashiers, highlightId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTempOTPs((prevOTPs) => {
        const newOTPs = { ...prevOTPs };
        for (const id in newOTPs) {
          if (new Date() > newOTPs[id].expiresAt) {
            delete newOTPs[id];
          }
        }
        return newOTPs;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const columns = [
    { key: "sNo", header: "S/No" },
    { key: "name", header: "Name" },
    {
      key: "aadhaar",
      header: "Aadhaar",
      render: (item: Cashier) => `XXXXXXXX${item.aadhaar.slice(-4)}`,
    },
    {
      key: "status",
      header: "Status",
      render: (item: Cashier) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            item.status === "active"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
          }`}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      ),
    },
    { key: "email", header: "Login Email" },
    { key: "personalEmail", header: "Personal Email" },
    { key: "phone", header: "Phone" },
    { key: "storeLocation", header: "Store Location" },
  ];

  const renderCashierActions = (cashier: Cashier) => (
    <>
      <Button variant="ghost" size="icon" className="hover:text-blue-600">
        <Link href={`/admin/manage-cashiers/edit/${cashier._id}`} title="Edit Cashier">
          <Edit className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hover:text-red-600"
        onClick={() => handleDeleteCashier(cashier._id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      {tempOTPs[cashier._id] &&
      new Date() < tempOTPs[cashier._id].expiresAt ? (
        <div className="relative flex items-center justify-center space-x-1 px-2 py-1 text-sm font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900 rounded-md">
          <span>{tempOTPs[cashier._id].otp}</span>
          <span className="text-xs font-normal bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full px-1 py-0.5 ml-1">
            {Math.ceil(
              (tempOTPs[cashier._id].expiresAt.getTime() -
                new Date().getTime()) /
                (60 * 1000)
            )}
            m
          </span>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="hover:text-yellow-600"
          onClick={() => handleResetPasswordClick(cashier._id)}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </>
  );

  const handleDeleteCashier = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cashier?")) return;
    try {
      const response = await fetch(`/api/cashier/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete cashier");
      }
      toast.success("Cashier deleted successfully.");
      setCashiers((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error deleting cashier.";
      toast.error(errorMessage);
    }
  };

  const handleResetPasswordClick = (id: string) => {
    setSelectedCashierId(id);
    setOtpDialogOpened(true);
  };

  const confirmResetPassword = async () => {
    if (!selectedCashierId) return;
    try {
      const response = await fetch(
        `/api/admin/cashier-reset-initiate/${selectedCashierId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to initiate cashier password reset"
        );
      }
      const result = await response.json();
      toast.success(
        result.message || "Password reset OTP generated. Displaying on screen."
      );
      setTempOTPs((prevOTPs) => ({
        ...prevOTPs,
        [selectedCashierId]: {
          otp: result.otp,
          expiresAt: new Date(result.otpExpires),
        },
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error resetting password.";
      toast.error(errorMessage);
    } finally {
      setSelectedCashierId(null);
      setOtpDialogOpened(false);
    }
  };

  const cashierToReset = selectedCashierId
    ? cashiers.find((c) => c._id === selectedCashierId)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        Loading cashiers...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center min-h-[calc(100vh-64px)]">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Cashiers</h1>
        <Link href="/admin/manage-cashiers/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Cashier
          </Button>
        </Link>
      </div>

      <TableUI<Cashier>
        data={cashiers}
        columns={columns}
        renderActions={renderCashierActions}
        rowKey="_id"
        renderRowWrapper={(rowItem: Cashier, defaultRow: React.ReactNode) => (
          <tr
            key={rowItem._id}
            ref={(el) => {
              rowRefs.current[rowItem._id] = el;
            }}
            className={cn(
              "transition-all duration-300",
              highlightId === rowItem._id
                ? "bg-yellow-100 dark:bg-yellow-900"
                : ""
            )}
          >
            {defaultRow}
          </tr>
        )}
      />

      <AlertDialog open={otpDialogOpened} onOpenChange={setOtpDialogOpened}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to reset password?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will generate a new OTP visible here for 1 hour.
              <span className="font-semibold text-blue-600 dark:text-blue-400 ml-1">
                ({cashierToReset?.personalEmail ||
                  cashierToReset?.email ||
                  "selected cashier"})
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCashierId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetPassword}>
              Confirm Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
