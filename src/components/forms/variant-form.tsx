// src/components/forms/variant-form.tsx
"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import Image from "next/image";
import QRCode from "qrcode";
import { Loader2, QrCode, XCircle } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  createVariant,
  updateVariant,
  VariantData,
} from "@/actions/variant.actions";
import { useVariantStore } from "@/store/variantStore";
import { variantSchema } from "@/lib/schemas";
import { IPopulatedVariant } from "@/lib/models/variant";
import { IUnit } from "@/lib/models/unit";
import { IPopulatedProduct } from "@/lib/models/product";

interface VariantFormProps {
  initialData?: IPopulatedVariant | null;
}

type VariantFormValues = z.infer<typeof variantSchema>;

const numberInputStyles = `
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type=number] {
    -moz-appearance: textfield;
  }
`;

const VariantForm: React.FC<VariantFormProps> = ({ initialData }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { products, units, fetchFormData, fetchProductDetails, productDetails, isLoading } = useVariantStore();

  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image || null
  );
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(
    initialData?.qrCode || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);

  const isEditing = !!initialData;

  const form = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      product: initialData?.product._id || "",
      variantVolume: initialData?.variantVolume || 0,
      unit: initialData?.unit._id || "",
      unitConsumed: initialData?.unitConsumed || 0,
      unitConsumedUnit: initialData?.unitConsumedUnit?._id || "",
      variantColor: initialData?.variantColor || "",
      price: initialData?.price || 0,
      mrp: initialData?.mrp || 0,
      discount: initialData?.discount || 0,
      stockQuantity: initialData?.stockQuantity || 0,
      stockAlertQuantity: initialData?.stockAlertQuantity || 0,
      image: initialData?.image || undefined,
      qrCode: initialData?.qrCode || undefined,
      packingCharges: initialData?.packingCharges || 0, 
      laborCharges: initialData?.laborCharges || 0, 
      electricityCharges: initialData?.electricityCharges || 0, 
      others1: initialData?.others1 || 0, 
      others2: initialData?.others2 || 0, 
    } as VariantFormValues,
  });

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  // 💡 FIX: React Hook Warnings resolved by watching the field inside the effect
  useEffect(() => {
  const subscription = form.watch((value, { name }) => {
    if (name === "product" && value.product) {
      fetchProductDetails(value.product);
    } else if (name === "product") {
      useVariantStore.setState({
        productDetails: { productCode: "", totalPrice: 0, purchasePrice: 0, sellingPrice: 0 },
      });
    }
  });
  return () => subscription.unsubscribe();
}, [form, fetchProductDetails]);

  const calculateDiscount = (price: number, mrp: number): number => {
    if (mrp <= 0) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      const fieldsToWatch = [
        "product",
        "unitConsumed",
        "packingCharges",
        "laborCharges",
        "electricityCharges",
        "others1",
        "others2"
      ];
      
      if (fieldsToWatch.includes(name as string)) {
        const sellingPrice = (productDetails.sellingPrice || 0);
        const unitConsumed = (Number(value.unitConsumed) || 0);
        
        // Price calculation logic
        const newPrice = (unitConsumed * sellingPrice) + 
                         (Number(value.packingCharges) || 0) + 
                         (Number(value.laborCharges) || 0) + 
                         (Number(value.electricityCharges) || 0) +
                         (Number(value.others1) || 0) + 
                         (Number(value.others2) || 0); 
        form.setValue("price", newPrice);
      }

      if (name === "price" || name === "mrp") {
        const price = Number(value.price);
        const mrp = Number(value.mrp);
        const calculatedDiscount = calculateDiscount(price, mrp);
        form.setValue("discount", calculatedDiscount);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, productDetails]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      form.setValue("image", file);
    } else {
      setImageFile(null);
      setImagePreview(null);
      form.setValue("image", undefined);
    }
  };

  const onGenerateQrCode = async () => {
    const values = form.getValues();
    if (!productDetails.productCode) {
      toast.error("Product code is required to generate QR code.");
      return;
    }

    const qrData = JSON.stringify({
      productCode: productDetails.productCode,
      price: values.price,
      mrp: values.mrp,
      discount: values.discount,
      variantVolume: values.variantVolume,
      unit: values.unit,
      variantColor: values.variantColor,
      stockQuantity: values.stockQuantity,
      stockAlertQuantity: values.stockAlertQuantity,
    });

    try {
      const qrCodeUrl = await QRCode.toDataURL(qrData);
      setQrCodePreview(qrCodeUrl);
      toast.success("QR Code generated successfully!");
      form.setValue("qrCode", qrCodeUrl);
    } 
    // 💡 FIX: Add eslint-disable-next-line to ignore unused '_' variable
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (_) { 
      toast.error("Failed to generate QR Code.");
    }
  };

  const onSubmit = async (values: VariantFormValues) => {
    startTransition(async () => {
      let result;
      let imagePath = isEditing ? initialData?.image || "" : "";
      let qrCodePath = isEditing ? initialData?.qrCode || "" : "";

      // Image upload logic
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          imagePath = data.data.url;
        } else {
          toast.error("Image upload failed.");
          return;
        }
      }

      // QR Code upload logic
      if (qrCodePreview) {
        const qrCodeBlob = await fetch(qrCodePreview).then(res => res.blob());
        const qrCodeFormData = new FormData();
        qrCodeFormData.append("file", new File([qrCodeBlob], 'variant-qr..png', { type: 'image/png' }));
        const res = await fetch("/api/upload", { method: "POST", body: qrCodeFormData });
        const data = await res.json();
        if (data.success) {
          qrCodePath = data.data.url;
        } else {
          toast.error("QR Code upload failed.");
          return;
        }
      }

      const variantData: VariantData = {
        ...values,
        mrp: Number(values.mrp),
        price: Number(values.price),
        variantVolume: Number(values.variantVolume),
        discount: Number(values.discount),
        stockQuantity: Number(values.stockQuantity),
        stockAlertQuantity: Number(values.stockAlertQuantity),
        packingCharges: Number(values.packingCharges),
        laborCharges: Number(values.laborCharges),
        electricityCharges: Number(values.electricityCharges),
        others1: Number(values.others1),
        others2: Number(values.others2),
        unitConsumed: Number(values.unitConsumed),
        unitConsumedUnit: values.unitConsumedUnit,
        image: imagePath,
        qrCode: qrCodePath,
      };

      if (isEditing && initialData) {
        result = await updateVariant(initialData._id, variantData);
      } else {
        result = await createVariant(variantData);
      }

      if (result.success) {
        toast.success(result.message);
        router.push("/admin/variants");
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
    <>
      <style>{numberInputStyles}</style>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* Product Details Section */}
          <h2 className="text-xl font-semibold text-gray-700">Product Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Product</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending || isEditing} // Disable product change in edit mode
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product: IPopulatedProduct) => (
                        <SelectItem key={product._id} value={product._id}>
                          {product.productName}
                        </SelectItem>
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
                <Input value={productDetails.productCode} disabled />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>Purchase Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={productDetails.purchasePrice}
                  disabled
                />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>Selling/Board Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={productDetails.sellingPrice}
                  disabled
                />
              </FormControl>
            </FormItem>
          </div>
          <Separator className="my-6" />

          {/* Variant and Consumption Details Section */}
          <h2 className="text-xl font-semibold text-gray-700">Variant and Material Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Row 1: Variant Volume and Unit */}
            <FormField
              control={form.control}
              name="variantVolume"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Volume</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onWheel={(e) => e.currentTarget.blur()}
                      disabled={isPending}
                      className={numberInputStyles}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Unit</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
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
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Row 2: Unit Consumed and Unit */}
            <FormField
              control={form.control}
              name="unitConsumed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Consumed (for this variant)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onWheel={(e) => e.currentTarget.blur()}
                      disabled={isPending}
                      className={numberInputStyles}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unitConsumedUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consumed Unit</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="variantColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Color</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Red, Blue"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Separator className="my-6" />

          {/* Pricing Details Section */}
          <h2 className="text-xl font-semibold text-gray-700">Pricing and Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end  p-4 rounded-lg border">
            {/* Calculated Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-blue-700">Price of Variant (Calculated Field)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onWheel={(e) => e.currentTarget.blur()}
                      readOnly={true}
                      disabled={true}
                      className={`${numberInputStyles} bg-blue-50 border-blue-300  font-bold`}
                    />
                  </FormControl>
                  <span className="text-xs text-gray-500 block mt-1">
                    Calculated as: (Consumed Unit * Selling Price) + Total Charges.
                  </span>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Discount Display */}
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Calculated Discount</p>
              <div className="flex items-center space-x-2 h-10">
                <span className="text-2xl font-extrabold text-green-600">
                  {form.watch("discount") || 0}%
                </span>
              </div>
            </div>
            {/* MRP Input */}
            <FormField
              control={form.control}
              name="mrp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Retail Price (MRP)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onWheel={(e) => e.currentTarget.blur()}
                      disabled={isPending}
                      className={numberInputStyles}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Stock Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="stockQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity (SKU)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onWheel={(e) => e.currentTarget.blur()}
                      disabled={isPending}
                      className={numberInputStyles}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stockAlertQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Alert Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onWheel={(e) => e.currentTarget.blur()}
                      disabled={isPending}
                      className={numberInputStyles}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Separator className="my-6" />

          {/* Charges Section */}
          <h2 className="text-xl font-semibold text-gray-700">Operational Charges</h2>
          <span className="text-sm text-gray-500 block mb-4">
            These fields contribute to the calculated **Price of Variant**.
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
             <FormField
              control={form.control}
              name="packingCharges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Packing Charges</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="laborCharges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Labor Charges</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="electricityCharges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Electricity Charges</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="others1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Oil Expelling Charges</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="others2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Others</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Separator className="my-6" />

          {/* Media Section */}
          <h2 className="text-xl font-semibold text-gray-700">Media and Identification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                  <FormLabel>Variant Image</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      onChange={handleImageChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  {imagePreview && (
                    <div className="relative w-48 h-48 mt-2 border rounded-lg p-1">
                      <Image
                        src={imagePreview}
                        alt="Image Preview"
                        fill
                        style={{ objectFit: "contain" }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                          form.setValue("image", undefined);
                        }}
                        className="absolute top-0 right-0 p-1 bg-white rounded-full shadow-md"
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel>QR Code</FormLabel>
              <p className="text-sm text-muted-foreground mb-2">
                Generate or upload a QR code for quick scanning.
              </p>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  onClick={onGenerateQrCode}
                  disabled={isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <QrCode className="mr-2 h-4 w-4" /> Generate QR Code
                </Button>
              </div>
              {qrCodePreview && (
                <div className="relative w-48 h-48 mt-4 border rounded-lg p-1">
                  <Image
                    src={qrCodePreview}
                    alt="QR Code Preview"
                    fill
                    style={{ objectFit: "contain" }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setQrCodePreview(null);
                      form.setValue("qrCode", undefined);
                    }}
                    className="absolute top-0 right-0 p-1 bg-white rounded-full shadow-md"
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="min-w-[150px]">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : isEditing ? (
                "Update Variant"
              ) : (
                "Add Variant"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

export default VariantForm;