// src/app/(admin)/admin/_components/CashierCreationForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CashierCreationFormUI } from "@/components/forms/CashierCreationFormUI"; // Correct path to UI component

// Define the schema based on your backend expectations (which should align with IUser now)
const CashierSchema = z.object({
  name: z.string().min(1, "Cashier name is required."), // Renamed from cashierName
  personalEmail: z.string().email("Invalid personal email address."), // Renamed from email
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits."),
  aadhaar: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits."),
  storeLocation: z.string().min(1, "Store location is required."),
  // Note: 'email' (login email) and 'temp_password' are likely generated
  // in AddCashierForm.tsx, so they won't be in this simplified creation form.
  // This component likely focuses on initial *cashier data entry*, not login credentials.
  // If this form is for creating a cashier with login credentials, these fields must be here too.
  // Given your existing code, this form seems to be for partial data entry.
});

export function CashierCreationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof CashierSchema>>({
    resolver: zodResolver(CashierSchema),
    defaultValues: {
      name: "", // Renamed
      personalEmail: "", // Renamed
      phone: "",
      aadhaar: "",
      storeLocation: "",
    },
  });

  async function onSubmit(values: z.infer<typeof CashierSchema>) {
    setIsLoading(true);
    try {
      // This API route will need to generate the 'email' (login) and 'password'
      // based on the received 'name' and 'aadhaar' (or other logic).
      const response = await fetch("/api/admin/cashiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        // Assuming data.message contains the error message from the API
        throw new Error(data.message || "Failed to create cashier.");
      }

      toast.success(data.message);
      form.reset();
      router.push("/admin/manage-cashiers");
    } catch (error) { // 💡 FIX: Removed ': any'
      // 💡 FIX: Safely access error.message using a type guard
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unexpected error occurred.";
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const mappedErrors = {
    name: form.formState.errors.name?.message, // Renamed
    personalEmail: form.formState.errors.personalEmail?.message, // Renamed
    phone: form.formState.errors.phone?.message,
    aadhaar: form.formState.errors.aadhaar?.message,
    storeLocation: form.formState.errors.storeLocation?.message,
  };

  return (
    <CashierCreationFormUI
      cashierName={form.watch("name")} // Watch 'name'
      personalEmail={form.watch("personalEmail")} // Watch 'personalEmail'
      phone={form.watch("phone")}
      aadhaar={form.watch("aadhaar")}
      storeLocation={form.watch("storeLocation")}
      onCashierNameChange={(e) => form.setValue("name", e.target.value)} // Set 'name'
      onPersonalEmailChange={(e) => form.setValue("personalEmail", e.target.value)} // Set 'personalEmail'
      onPhoneChange={(e) => form.setValue("phone", e.target.value)}
      onAadhaarChange={(e) => form.setValue("aadhaar", e.target.value)}
      onStoreLocationChange={(e) => form.setValue("storeLocation", e.target.value)}
      onSubmit={form.handleSubmit(onSubmit)}
      isLoading={isLoading}
      errors={mappedErrors}
    />
  );
}