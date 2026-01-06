"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Info } from "lucide-react";

import {
  createProduct,
  updateProduct,
  generateProductCodeForUI,
  ProductData,
} from "@/actions/product.actions";
import { productSchema } from "@/lib/schemas";
import { useProductStore } from "@/store/product.store";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { IProduct } from "@/lib/models/product";
import { IBrand } from "@/lib/models/brand";
import { ITax } from "@/lib/models/tax";
import { ICategory } from "@/lib/models/category";
import { IUnit } from "@/lib/models/unit";

interface ProductFormProps {
  initialData?: IProduct | null;
}

type ProductFormValues = z.infer<typeof productSchema>;

const ProductForm: React.FC<ProductFormProps> = ({ initialData }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const { 
    categories, 
    brands, 
    taxes, 
    units,
    fetchFormData, 
    isLoading 
  } = useProductStore();
  
  const isEditing = !!initialData;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      category: initialData?.category?._id?.toString() || initialData?.category?.toString() || "",
      brand: initialData?.brand?._id?.toString() || initialData?.brand?.toString() || "",
      productCode: initialData?.productCode || "",
      productName: initialData?.productName || "",
      description: initialData?.description || "",
      tax: initialData?.tax?._id?.toString() || initialData?.tax?.toString() || "",
      sellingTypes: initialData?.sellingTypes || [],
      baseUnit: initialData?.baseUnit?._id?.toString() || initialData?.baseUnit?.toString() || "",
      allowLooseSale: initialData?.allowLooseSale ?? false,
    },
  });

  const { watch, setValue } = form;
  const categoryId = watch("category");
  const sellingTypes = watch("sellingTypes");

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  // Auto-generate product code when category changes
  useEffect(() => {
    if (!categoryId || isEditing) return;
    setIsGeneratingCode(true);

    const generateCode = async () => {
      try {
        const result = await generateProductCodeForUI(categoryId);
        if (result.success && result.data) {
          setValue("productCode", result.data);
        } else {
          toast.error(result.message || "Failed to generate product code.");
        }
      } catch (err) {
        toast.error("Error generating product code.");
        console.error(err);
      } finally {
        setIsGeneratingCode(false);
      }
    };

    generateCode();
  }, [categoryId, setValue, isEditing]);

  // ✅ REMOVED: The problematic auto-enable loose sale effect that caused infinite loop

  const sellingTypeOptions = [
    { value: "FIXED", label: "Fixed Quantity", icon: "📦", description: "Pre-packaged items (1 bottle, 1 packet)" },
    { value: "WEIGHT", label: "By Weight", icon: "⚖️", description: "Sell by kg/grams (250g, 1.5kg)" },
    { value: "VOLUME", label: "By Volume", icon: "🧪", description: "Sell by ml/liters (100ml, 2L)" },
    { value: "VALUE", label: "By Value", icon: "💰", description: "Sell by amount (₹100 worth)" },
  ] as const;

  // Toggle selling type selection
  const toggleSellingType = (type: "FIXED" | "WEIGHT" | "VOLUME" | "VALUE") => {
    const currentTypes = form.getValues("sellingTypes");
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    setValue("sellingTypes", newTypes);
    
    // ✅ FIXED: Auto-enable loose sale only when adding WEIGHT/VOLUME, not on every render
    const hasWeightOrVolume = newTypes.some(t => t === "WEIGHT" || t === "VOLUME");
    if (hasWeightOrVolume && !currentTypes.some(t => t === "WEIGHT" || t === "VOLUME")) {
      setValue("allowLooseSale", true);
    }
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (values.sellingTypes.length === 0) {
      toast.error("Please select at least one selling type");
      return;
    }

    startTransition(async () => {
      const payload: ProductData = {
        ...values,
        productCode: values.productCode || "",
      };

      const result = isEditing
        ? await updateProduct(initialData!._id, payload)
        : await createProduct(payload);

      if (result.success) {
        toast.success(result.message);
        router.push("/admin/products");
      } else {
        toast.error(result.message);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Product General Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="productName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Sesame Oil" {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat: ICategory) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {brands.map((brand: IBrand) => (
                      <SelectItem key={brand._id} value={brand._id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the product..." {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tax" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {taxes.map((tax: ITax) => (
                      <SelectItem key={tax._id} value={tax._id}>
                        {tax.name} ({tax.gst}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-6" />

        {/* ✅ MULTI-SELECT SELLING TYPES */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Selling Configuration</h2>
            <Info className="h-4 w-4 text-gray-400" />
          </div>

          <FormField
            control={form.control}
            name="sellingTypes"
            render={() => (
              <FormItem>
                <FormLabel>Selling Types (Select All That Apply)</FormLabel>
                <FormDescription className="text-xs mb-3">
                  Choose how customers can purchase this product. You can enable multiple options!
                </FormDescription>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sellingTypeOptions.map((option) => {
                    const isSelected = sellingTypes.includes(option.value);
                    return (
                      <div
                        key={option.value}
                        className={`border rounded-lg p-4 transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSellingType(option.value)}
                            disabled={isPending}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">{option.icon}</span>
                              <span className="font-medium">{option.label}</span>
                            </div>
                            <p className="text-xs text-gray-600">{option.description}</p>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Base Unit */}
          <FormField
            control={form.control}
            name="baseUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Unit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select base unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {units.map((unit: IUnit) => (
                      <SelectItem key={unit._id} value={unit._id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Primary unit for pricing (e.g., kg, liter). Used for loose sales and value-based selling.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Allow Loose Sale */}
          {(sellingTypes.includes("WEIGHT") || sellingTypes.includes("VOLUME")) && (
            <FormField
              control={form.control}
              name="allowLooseSale"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-green-50 border-green-200">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Allow Loose Sale (Fractional Quantities)</FormLabel>
                    <FormDescription>
                      Customers can buy any quantity (250g, 1.5kg, 100ml). System auto-calculates price.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          )}

          {/* Example Usage Display */}
          {sellingTypes.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-sm mb-2 text-blue-900">Example: How customers can buy this product</h3>
              <ul className="space-y-1 text-xs text-blue-800">
                {sellingTypes.includes("FIXED") && <li>• "I want 2 bottles" → ₹370 × 2</li>}
                {sellingTypes.includes("WEIGHT") && <li>• "I want 250 grams" → ₹370 ÷ 4 = ₹92.50</li>}
                {sellingTypes.includes("VOLUME") && <li>• "I want 500ml" → ₹370 ÷ 2 = ₹185</li>}
                {sellingTypes.includes("VALUE") && <li>• "Give me ₹100 worth" → ~270ml delivered</li>}
              </ul>
            </div>
          )}
        </div>

        <Separator className="my-6" />

        <h2 className="text-lg font-semibold">Inventory Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="productCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Code</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input {...field} disabled className="pr-8 bg-gray-50" />
                    {isGeneratingCode && (
                      <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>
                </FormControl>
                <FormDescription className="text-xs">
                  Auto-generated based on category
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
              "Update Product"
            ) : (
              "Create Product"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;