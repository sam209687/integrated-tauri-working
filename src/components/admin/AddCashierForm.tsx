"use client";
import React, { useState } from "react";
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
import { User, Mail, Phone, CreditCard, MapPin, Key, Loader2, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AddCashierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  personalEmail: z.string().email("Invalid personal email address."),
  aadhaar: z.string().length(12, "Aadhaar must be exactly 12 digits.").regex(/^\d+$/, "Aadhaar must contain only digits."),
  phone: z.string().min(10, "Phone number must be at least 10 digits.").regex(/^\d+$/, "Phone number must contain only digits."),
  storeLocation: z.string().min(2, "Store Location is required."),
  email: z.string().regex(/^[a-z0-9]+@rs\.com$/, "Login Email format invalid (e.g., user123@rs.com)."),
  temp_password: z.string().min(6, "Temporary password must be at least 6 characters."),
});

export function AddCashierForm() {
  const router = useRouter();
  const [emailDomain] = useState("@rs.com");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof AddCashierSchema>>({
    resolver: zodResolver(AddCashierSchema),
    defaultValues: {
      name: "",
      personalEmail: "",
      aadhaar: "",
      phone: "",
      storeLocation: "",
      email: "",
      temp_password: "",
    },
  });

  const name = form.watch("name");
  const aadhaar = form.watch("aadhaar");

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
      form.setValue("email", generatedLoginEmailBase + emailDomain, { shouldValidate: true });
      form.setValue("temp_password", generatedTempPassword, { shouldValidate: true });
    } else {
      form.setValue("email", "", { shouldValidate: true });
      form.setValue("temp_password", "", { shouldValidate: true });
    }
  }, [name, aadhaar, form, emailDomain]);

  async function onSubmit(values: z.infer<typeof AddCashierSchema>) {
    try {
      setSubmitting(true);
      const response = await fetch('/api/cashier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add cashier');
      }

      toast.success("Cashier added successfully!");
      form.reset();
      router.push('/admin/manage-cashiers');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    /* Fixed positioning at 0,0 with 100vw/vh ensures the card 
       ignores any parent padding or width restrictions.
    */
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 overflow-hidden flex flex-col">
      <Card className="flex-1 flex flex-col border-0 rounded-none bg-slate-900 shadow-none overflow-hidden">
        
        {/* Header Section */}
        <CardHeader className="shrink-0 bg-slate-800/60 border-b border-slate-700/50 py-8 px-10">
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <User className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-white">
                  Add New Cashier
                </CardTitle>
                <CardDescription className="text-slate-400 text-lg">
                  System will auto-generate login credentials based on user details
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/admin/manage-cashiers')}
              className="text-slate-400 hover:text-white"
            >
              Back to Dashboard
            </Button>
          </div>
        </CardHeader>
        
        {/* Scrollable Content Area */}
        <CardContent className="flex-1 overflow-y-auto py-12 px-10 bg-slate-900/50">
          <div className="max-w-7xl mx-auto w-full">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
                
                {/* Section: Personal Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-400" />
                      Personal Details
                    </h3>
                    <p className="text-sm text-slate-500">Legal identification and contact information for the cashier.</p>
                  </div>
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" className="h-12 bg-slate-800 border-slate-700 text-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="personalEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Personal Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" className="h-12 bg-slate-800 border-slate-700 text-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Phone Number</FormLabel>
                        <FormControl>
                          <Input maxLength={10} placeholder="10-digit mobile" className="h-12 bg-slate-800 border-slate-700 text-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="aadhaar" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Aadhaar Number</FormLabel>
                        <FormControl>
                          <Input maxLength={12} placeholder="12-digit UID" className="h-12 bg-slate-800 border-slate-700 text-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <hr className="border-slate-800" />

                {/* Section: Store & Credentials */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-400" />
                      Access Control
                    </h3>
                    <p className="text-sm text-slate-500">Assign store location and review generated login access.</p>
                  </div>
                  <div className="lg:col-span-2 space-y-8">
                    <FormField control={form.control} name="storeLocation" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Assigned Store Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Downtown Branch" className="h-12 bg-slate-800 border-slate-700 text-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-950/50 border border-slate-800 rounded-xl">
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400">System Login Email</FormLabel>
                          <FormControl>
                            <Input readOnly className="h-12 bg-slate-900 border-slate-800 text-blue-400 font-mono" {...field} />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="temp_password" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-400">System Temporary Password</FormLabel>
                          <FormControl>
                            <Input readOnly className="h-12 bg-slate-900 border-slate-800 text-blue-400 font-mono" {...field} />
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </div>

                {/* Submit Section */}
                <div className="flex items-center justify-end gap-4 pt-10 border-t border-slate-800 pb-20">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push('/admin/manage-cashiers')}
                    className="h-12 px-8 border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="h-12 px-12 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-900/20"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Register Cashier"
                    )}
                  </Button>
                </div>

              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}