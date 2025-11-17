// src/components/admin/EditCashierForm.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Reuse or extend the AddCashierSchema
const EditCashierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").optional(),
  personalEmail: z.string().email("Invalid personal email address.").optional(), // Renamed
  aadhaar: z.string().length(12, "Aadhaar must be exactly 12 digits.").regex(/^\d+$/, "Aadhaar must contain only digits.").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits.").regex(/^\d+$/, "Phone number must contain only digits.").optional(),
  storeLocation: z.string().min(2, "Store Location is required.").optional(),
  email: z.string().regex(/^[a-z0-9]+@rs\.com$/, "Login Email format invalid.").optional(), // Renamed from username
  status: z.enum(['active', 'inactive']).optional(),
});

interface EditCashierFormProps {
  cashierId: string;
}

// Utility function to safely extract error message
function getErrorMessage(error: unknown, defaultMessage: string = 'An unexpected error occurred.'): string {
  return error instanceof Error ? error.message : defaultMessage;
}

export function EditCashierForm({ cashierId }: EditCashierFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof EditCashierSchema>>({
    resolver: zodResolver(EditCashierSchema),
    defaultValues: {},
  });

  useEffect(() => {
    const fetchCashier = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/cashier/${cashierId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch cashier data');
        }
        const data = await response.json();
        // Populate form fields with fetched data
        // Ensure data keys match schema keys for form.reset
        form.reset({
          name: data.name,
          personalEmail: data.personalEmail, // Renamed
          aadhaar: data.aadhaar,
          phone: data.phone,
          storeLocation: data.storeLocation,
          email: data.email, // Renamed from username
          status: data.status,
        });
      } catch (err) { // 💡 FIX 1: Removed ': any'
        const errorMessage = getErrorMessage(err, 'Error fetching cashier data.');
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (cashierId) {
      fetchCashier();
    }
  }, [cashierId, form]);

  async function onSubmit(values: z.infer<typeof EditCashierSchema>) {
    try {
      const response = await fetch(`/api/cashier/${cashierId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values), // values already has the correct personalEmail/email structure
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update cashier');
      }

      toast.success("Cashier updated successfully!");
      router.push('/admin/manage-cashiers');
    } catch (error) { // 💡 FIX 2: Removed ': any'
      const errorMessage = getErrorMessage(error);
      console.error("Error updating cashier:", error);
      toast.error(errorMessage);
    }
  }

  if (loading) return <p>Loading cashier data...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

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
          name="personalEmail" // Renamed
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
                <Input {...field} readOnly />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Update Cashier
        </Button>
      </form>
    </Form>
  );
}