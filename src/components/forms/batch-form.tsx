"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as z from "zod";
import { batchSchema } from "@/lib/schemas";
import { useBatchStore, IPopulatedBatch } from "@/store/batch.store";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// ✅ Generic action result type
interface ActionResult<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface BatchFormProps {
  initialData?: IPopulatedBatch | null;
  createBatchAction: (formData: FormData) => Promise<ActionResult<IPopulatedBatch>>;
  updateBatchAction: (id: string, formData: FormData) => Promise<ActionResult<IPopulatedBatch>>;
  generateBatchNumberAction: (productCode: string) => Promise<ActionResult<string>>;
}

// ✅ Infer from schema for strict form control
type FormValues = z.infer<typeof batchSchema>;

export function BatchForm({
  initialData,
  createBatchAction,
  updateBatchAction,
  generateBatchNumberAction,
}: BatchFormProps) {
  const [isPending, startTransition] = useTransition();
  const {
    products,
    selectedProductCode,
    fetchProducts,
    setSelectedProductCode,
    isLoading,
    updateBatch: updateBatchInStore,
    categories,
    fetchCategories,
  } = useBatchStore();

  const router = useRouter();
  const isEditing = Boolean(initialData);
  const initialCategory = initialData?.product?.category?._id?.toString() ?? "";
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  const form = useForm<FormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      product: initialData?.product?._id?.toString() ?? "",
      batchNumber: initialData?.batchNumber ?? "",
      vendorName: initialData?.vendorName ?? "",
      qty: initialData?.qty ?? 0,
      price: initialData?.price ?? 0,
      perUnitPrice: initialData?.perUnitPrice ?? 0,
      oilCakeProduced: initialData?.oilCakeProduced ?? 0,
      oilExpelled: initialData?.oilExpelled ?? 0,
    },
  });

  const batchNumberValue = form.watch("batchNumber");

  const isEdibleOil =
    categories.find((cat) => cat._id?.toString() === selectedCategory)?.name === "Edible Oil";

  // ✅ Load initial data
  useEffect(() => {
    void fetchProducts();
    void fetchCategories();

    if (initialData?.product?.productCode) {
      setSelectedProductCode(initialData.product.productCode);
    }
  }, [fetchProducts, fetchCategories, initialData, setSelectedProductCode]);

  // ✅ Watch for changes in form fields
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "product" && value.product) {
        const selectedProduct = products.find(
          (p) =>
            p.category?._id?.toString() === selectedCategory &&
            p._id?.toString() === value.product
        );
        setSelectedProductCode(selectedProduct?.productCode ?? null);
      } else if (name === "price" || name === "qty") {
        const price = form.getValues("price") ?? 0;
        const qty = form.getValues("qty") ?? 0;
        const perUnitPrice = price > 0 && qty > 0 ? price / qty : 0;
        form.setValue("perUnitPrice", perUnitPrice);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, products, selectedCategory, setSelectedProductCode]);

  // ✅ Handle Batch Number Generation
  const handleGenerateBatch = async (): Promise<void> => {
    if (!selectedProductCode) {
      toast.error("Please select a product first.");
      return;
    }

    const result = await generateBatchNumberAction(selectedProductCode);
    if (result.success && result.data) {
      form.setValue("batchNumber", result.data);
    } else {
      toast.error(result.message || "Failed to generate batch number.");
    }
  };

  // ✅ Handle Submit
  async function onSubmit(values: FormValues): Promise<void> {
    startTransition(async () => {
      const formData = new FormData();
      for (const [key, val] of Object.entries(values)) {
        formData.append(key, String(val ?? ""));
      }

      let result: ActionResult<IPopulatedBatch>;

      if (isEditing && initialData) {
        result = await updateBatchAction(initialData._id, formData);
        if (result.success && result.data) {
          updateBatchInStore(result.data);
        }
      } else {
        result = await createBatchAction(formData);
      }

      if (result.success) {
        toast.success(result.message);
        router.push("/admin/batch");
      } else {
        toast.error(result.message);
      }
    });
  }

  const qty = form.watch("qty") ?? 0;
  const oilExpelled = form.watch("oilExpelled") ?? 0;
  const perUnitPrice = form.watch("perUnitPrice") ?? 0;

  const volumeConsumed = qty > 0 && oilExpelled > 0 ? qty / oilExpelled : 0;
  const priceOfConsumedVolume =
    perUnitPrice > 0 && qty > 0 && oilExpelled > 0 ? perUnitPrice * volumeConsumed : 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select
              onValueChange={(value) => {
                setSelectedCategory(value);
                form.setValue("product", "");
                setSelectedProductCode(null);
              }}
              value={selectedCategory}
              disabled={isPending || isLoading}
            >
              <FormControl>
                <SelectTrigger>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Select a category" />
                  )}
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <SelectItem key={category._id?.toString()} value={category._id?.toString()}>
                      {category.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-categories" disabled>
                    No categories available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </FormItem>

          {/* Product */}
          <FormField
            control={form.control}
            name="product"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isPending || isLoading || !selectedCategory}
                >
                  <FormControl>
                    <SelectTrigger>
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Select a product" />
                      )}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {products.length > 0 ? (
                      products
                        .filter(
                          (p) => p.category?._id?.toString() === selectedCategory
                        )
                        .map((product) => (
                          <SelectItem key={product._id?.toString()} value={product._id?.toString()}>
                            {product.productName}
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem value="no-products" disabled>
                        No products available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vendor */}
          <FormField
            control={form.control}
            name="vendorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quantity */}
          <FormField
            control={form.control}
            name="qty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity (KG)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Price (INR)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Per Unit */}
          <FormField
            control={form.control}
            name="perUnitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Per Unit Price (INR/KG)</FormLabel>
                <FormControl>
                  <Input {...field} readOnly disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEdibleOil && (
            <>
              <FormField
                control={form.control}
                name="oilExpelled"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oil Expelled (Ltrs)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="oilCakeProduced"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oil Cake Produced (KG)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        {isEdibleOil && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>Volume Consumed to Produce 1 Ltr (KG)</FormLabel>
              <FormControl>
                <Input value={volumeConsumed.toFixed(2)} readOnly />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>Price of Consumed Volume</FormLabel>
              <FormControl>
                <Input value={priceOfConsumedVolume.toFixed(2)} readOnly />
              </FormControl>
            </FormItem>
          </div>
        )}

        {/* Batch Number */}
        <div className="flex items-end gap-4">
          <FormField
            control={form.control}
            name="batchNumber"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Batch Number</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isEditing} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!isEditing && (
            <Button
              type="button"
              onClick={handleGenerateBatch}
              disabled={!selectedProductCode || isPending}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Batch"}
            </Button>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end mt-8">
          <Button type="submit" disabled={isPending || !batchNumberValue}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : isEditing ? (
              "Update Batch"
            ) : (
              "Add Batch"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
