// src/components/forms/oec-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useTransition, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as z from "zod";

import { createOec, updateOec } from "@/actions/oec.actions";
import { oecSchema } from "@/lib/schemas";
import { useOecStore } from "@/store/oecStore";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// 💡 FIX: Define a proper interface for the initial data
interface IOec {
    _id: string;
    product: {
        _id: string;
        productCode: string;
    };
    oilExpellingCharges: number;
    // Add other properties if necessary based on your schema
}

interface OecFormProps {
  initialData?: IOec; // 💡 FIX: Replaced 'any' with the specific interface
}

type OecFormValues = z.infer<typeof oecSchema>;

export function OecForm({ initialData }: OecFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEditing = !!initialData;
  
  const { products, fetchProducts } = useOecStore();
  const [selectedProductCode, setSelectedProductCode] = useState<string>("");

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const form = useForm<OecFormValues>({
    resolver: zodResolver(oecSchema),
    defaultValues: isEditing ? {
      ...initialData,
      product: initialData.product._id,
    } : {
      product: "",
      oilExpellingCharges: 0,
    },
  });

  useEffect(() => {
    if (isEditing && initialData?.product) {
      setSelectedProductCode(initialData.product.productCode);
    }
    const subscription = form.watch((value, { name }) => {
      if (name === "product") {
        // value.product is the ID string
        const product = products.find(p => p._id === value.product); 
        setSelectedProductCode(product?.productCode || "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form, products, isEditing, initialData]);

  async function onSubmit(values: OecFormValues) {
    startTransition(async () => {
      const formData = new FormData();
      // Safely iterate over the keys of the validated object
      Object.keys(values).forEach(key => { 
        const value = values[key as keyof typeof values];
        if (value !== undefined && value !== null) {
          // Ensure numbers are converted to strings for FormData
          formData.append(key, String(value)); 
        }
      });
      
      let result;
      if (isEditing) {
        result = await updateOec(initialData!._id, formData); // Use non-null assertion since isEditing is true
      } else {
        result = await createOec(formData);
      }

      if (result.success) {
        toast.success(result.message);
        router.push("/admin/oec");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="product"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product._id} value={product._id}>{product.productName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Product Code</FormLabel>
            <FormControl>
              <Input value={selectedProductCode} disabled={true} />
            </FormControl>
          </FormItem>
        </div>

        <FormField
          control={form.control}
          name="oilExpellingCharges"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Oil Expelling Charges (₹)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="any" 
                  {...field} 
                  onChange={e => {
                    const value = e.target.value;
                    field.onChange(value === "" ? 0 : parseFloat(value)); // Handle empty string by setting 0
                  }} 
                  disabled={isPending} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 mt-8">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : isEditing ? (
              "Update OEC"
            ) : (
              "Add OEC"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}