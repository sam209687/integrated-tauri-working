// src/components/admin/AddCashierForm.tsx
"use client";
import React, { useState } from "react"; // 💡 FIX 1: Removed 'useEffect' from import
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


// --- Zod Schema for Cashier Validation ---
const AddCashierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  personalEmail: z.string().email("Invalid personal email address."), // Renamed
  aadhaar: z.string().length(12, "Aadhaar must be exactly 12 digits.").regex(/^\d+$/, "Aadhaar must contain only digits."),
  phone: z.string().min(10, "Phone number must be at least 10 digits.").regex(/^\d+$/, "Phone number must contain only digits."),
  storeLocation: z.string().min(2, "Store Location is required."),
  email: z.string().regex(/^[a-z0-9]+@rs\.com$/, "Login Email format invalid (e.g., user123@rs.com)."), // Renamed from username
  temp_password: z.string().min(6, "Temporary password must be at least 6 characters."),
});

export function AddCashierForm() {
  const router = useRouter();
  const [emailDomain] = useState("@rs.com"); // Hardcoded domain for login email

  const form = useForm<z.infer<typeof AddCashierSchema>>({
    resolver: zodResolver(AddCashierSchema),
    defaultValues: {
      name: "",
      personalEmail: "", // Renamed
      aadhaar: "",
      phone: "",
      storeLocation: "",
      email: "", // Renamed from username
      temp_password: "",
    },
  });

  // --- Generate Login Email and Temp Password dynamically ---
  const name = form.watch("name");
  const aadhaar = form.watch("aadhaar");

  // Update login email and temp_password when name or aadhaar change
  React.useEffect(() => {
    let generatedLoginEmailBase = "";
    let generatedTempPassword = "";

    if (name.length >= 4) {
      generatedLoginEmailBase += name.slice(0, 4).toLowerCase();
    } else if (name.length > 0) {
      generatedLoginEmailBase += name.toLowerCase();
    }

    if (aadhaar.length === 12) {
      generatedLoginEmailBase += aadhaar.slice(-4);
    }

    if (generatedLoginEmailBase) {
      generatedTempPassword = generatedLoginEmailBase;
      form.setValue("email", generatedLoginEmailBase + emailDomain, { shouldValidate: true }); // Renamed from username
      form.setValue("temp_password", generatedTempPassword, { shouldValidate: true });
    } else {
      form.setValue("email", "", { shouldValidate: true }); // Renamed from username
      form.setValue("temp_password", "", { shouldValidate: true });
    }
  }, [name, aadhaar, form, emailDomain]);

  async function onSubmit(values: z.infer<typeof AddCashierSchema>) {
    try {
      const response = await fetch('/api/cashier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values), // values already has the correct personalEmail/email structure
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add cashier');
      }

      toast.success("Cashier added successfully!");
      form.reset(); // Clear the form
      router.push('/admin/manage-cashiers'); // Redirect to manage cashiers page
    } catch (error) { // 💡 FIX 2: Removed ': any'
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      console.error("Error adding cashier:", error);
      toast.error(errorMessage);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md mx-auto">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Joseph Sam" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="personalEmail" // Renamed from email
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personal Email</FormLabel> {/* Label changed */}
              <FormControl>
                <Input type="email" placeholder="cashier@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="aadhaar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aadhaar (12 digits)</FormLabel>
              <FormControl>
                <Input placeholder="123456789012" {...field} maxLength={12} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="9876543210" {...field} maxLength={10} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="storeLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store Location</FormLabel>
              <FormControl>
                <Input placeholder="Main Store" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email" // Renamed from username
          render={({ field }) => (
            <FormItem>
              <FormLabel>Login Email</FormLabel> {/* Label changed */}
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="joseph1234" // Example base part
                    {...field}
                    readOnly
                    className="pr-16"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 sm:text-sm">
                    {emailDomain}
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="temp_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temporary Password</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="joseph1234"
                  {...field}
                  readOnly
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Add Cashier
        </Button>
      </form>
    </Form>
  );
}