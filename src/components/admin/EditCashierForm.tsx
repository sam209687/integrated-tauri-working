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
import { User, Mail, Phone, CreditCard, MapPin, Shield, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const EditCashierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").optional(),
  personalEmail: z.string().email("Invalid personal email address.").optional(),
  aadhaar: z.string().length(12, "Aadhaar must be exactly 12 digits.").regex(/^\d+$/, "Aadhaar must contain only digits.").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits.").regex(/^\d+$/, "Phone number must contain only digits.").optional(),
  storeLocation: z.string().min(2, "Store Location is required.").optional(),
  email: z.string().regex(/^[a-z0-9]+@rs\.com$/, "Login Email format invalid.").optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

interface EditCashierFormProps {
  cashierId: string;
}

function getErrorMessage(error: unknown, defaultMessage: string = 'An unexpected error occurred.'): string {
  return error instanceof Error ? error.message : defaultMessage;
}

export function EditCashierForm({ cashierId }: EditCashierFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
        form.reset({
          name: data.name,
          personalEmail: data.personalEmail,
          aadhaar: data.aadhaar,
          phone: data.phone,
          storeLocation: data.storeLocation,
          email: data.email,
          status: data.status,
        });
      } catch (err) {
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
      setSubmitting(true);
      const response = await fetch(`/api/cashier/${cashierId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update cashier');
      }

      toast.success("Cashier updated successfully!");
      router.push('/admin/manage-cashiers');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error updating cashier:", error);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading cashier data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="text-destructive text-lg font-semibold">Error</div>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto shadow-lg">
      <CardHeader className="space-y-1 bg-linear-to-br from-primary/5 to-primary/10 border-b">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          Edit Cashier Details
        </CardTitle>
        <CardDescription>
          Update cashier information and account settings
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Personal Information
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Joseph Sam" 
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personalEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Personal Email
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="cashier@example.com" 
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                          {...field} 
                        />
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
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="9876543210" 
                          maxLength={10}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                          {...field} 
                        />
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
                      <FormLabel className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        Aadhaar Number
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123456789012" 
                          maxLength={12}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Work Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Work Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="storeLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        Store Location
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Main Store" 
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                          {...field} 
                        />
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
                      <FormLabel className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Account Status
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              Active
                            </div>
                          </SelectItem>
                          <SelectItem value="inactive">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-gray-400" />
                              Inactive
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Login Credentials Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Login Credentials
                </h3>
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="md:max-w-md">
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Login Email
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        readOnly 
                        className="bg-muted/50 cursor-not-allowed"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Login email cannot be changed
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t">
              <Button 
                type="submit" 
                className="flex-1 md:flex-initial md:min-w-[200px] transition-all hover:shadow-lg"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Cashier'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/manage-cashiers')}
                disabled={submitting}
                className="transition-all hover:shadow-md"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}