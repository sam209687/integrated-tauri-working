// src/components/forms/VariantForm.tsx
// 🎨 UI LAYER: Pure presentational component

"use client";

import React from "react";
import Image from "next/image";
import { Loader2, QrCode, XCircle, Info } from "lucide-react";

import { useVariantForm, UseVariantFormProps } from "@/hooks/variants/useVariantForm";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IUnit } from "@/lib/models/unit";
import { IPopulatedProduct } from "@/lib/models/product";

const VariantForm: React.FC<UseVariantFormProps> = ({ initialData }) => {
  const {
    form,
    onSubmit,
    isPending,
    isEditing,
    isLoading,
    categories,
    selectedCategoryId,
    handleCategoryChange,
    filteredProducts,
    units,
    selectedProduct,
    imagePreview,
    handleImageChange,
    removeImage,
    qrCodePreview,
    generateQRCode,
    removeQRCode,
  } = useVariantForm({ initialData });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        {/* 📦 PRODUCT SELECTION SECTION */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Product Information
              <Info className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 🆕 CATEGORY DROPDOWN */}
              <FormItem>
                <FormLabel>Select Category *</FormLabel>
                <Select
                  onValueChange={handleCategoryChange}
                  value={selectedCategoryId}
                  disabled={isPending || isEditing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a category first" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category: any) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Select category to filter products
                </FormDescription>
              </FormItem>

              {/* PRODUCT DROPDOWN - Now filtered by category */}
              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Product *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPending || isEditing || !selectedCategoryId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            selectedCategoryId 
                              ? "Choose a product" 
                              : "Select category first"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredProducts.length === 0 ? (
                          <div className="px-2 py-3 text-sm text-gray-500">
                            No products in this category
                          </div>
                        ) : (
                          filteredProducts.map((product: IPopulatedProduct) => (
                            <SelectItem key={product._id} value={product._id}>
                              {product.productName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedProduct && (
                <>
                  <FormItem>
                    <FormLabel>Product Code</FormLabel>
                    <FormControl>
                      <Input
                        value={selectedProduct.productCode || "N/A"}
                        disabled
                        className="bg-gray-50"
                      />
                    </FormControl>
                  </FormItem>

                  <FormItem>
                    <FormLabel>Base Unit</FormLabel>
                    <FormControl>
                      <Input
                        value={selectedProduct.baseUnit.name}
                        disabled
                        className="bg-gray-50"
                      />
                    </FormControl>
                  </FormItem>

                  <FormItem className="md:col-span-2">
                    <FormLabel>Selling Types Supported</FormLabel>
                    <div className="flex gap-2 flex-wrap p-2 bg-gray-50 rounded border">
                      {selectedProduct.sellingTypes.map((type) => (
                        <span
                          key={type}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </FormItem>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* 📏 VARIANT DETAILS SECTION */}
        <Card>
          <CardHeader>
            <CardTitle>Variant Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="variantVolume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variant Volume/Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 1, 0.5, 250"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Size of this variant (e.g., 1L, 500ml, 250g)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
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

              <FormField
                control={form.control}
                name="variantColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variant Color/Label</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Red, Premium"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* 💰 PRICING SECTION */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price (Calculated)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        disabled
                        className="bg-blue-50 font-semibold"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Auto-calculated: Purchase + All Charges
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mrp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MRP *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Discount Display */}
            <div className="p-4 bg-gray-500 border border-black rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-200">
                  Calculated Discount
                </span>
                <span className="text-2xl font-bold text-green-400">
                  {form.watch("discount") || 0}%
                </span>
              </div>
            </div>

            {/* Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        disabled={isPending}
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
                    <FormLabel>Low Stock Alert At</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* 💸 CHARGES SECTION */}
        <Card>
          <CardHeader>
            <CardTitle>Operational Charges</CardTitle>
            <p className="text-sm text-gray-500">
              These charges are added to the purchase price to calculate selling price
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <FormField
                control={form.control}
                name="packingCharges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Packing</FormLabel>
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
                    <FormLabel>Labor</FormLabel>
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
                    <FormLabel>Electricity</FormLabel>
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
                    <FormLabel>Other 1</FormLabel>
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
                    <FormLabel>Other 2</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* 📸 MEDIA SECTION */}
        <Card>
          <CardHeader>
            <CardTitle>Media & Identification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <FormLabel>Variant Image</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isPending}
                />
                {imagePreview && (
                  <div className="relative w-48 h-48 mt-2 border rounded-lg p-1">
                    <Image
                      src={imagePreview}
                      alt="Variant Image"
                      fill
                      className="object-contain"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-white rounded-full shadow-md"
                    >
                      <XCircle className="h-5 w-5 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className="space-y-2">
                <FormLabel>QR Code</FormLabel>
                <Button
                  type="button"
                  onClick={generateQRCode}
                  disabled={isPending || !selectedProduct}
                  className="w-full"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Generate QR Code
                </Button>
                {qrCodePreview && (
                  <div className="relative w-48 h-48 mt-2 border rounded-lg p-1">
                    <Image
                      src={qrCodePreview}
                      alt="QR Code"
                      fill
                      className="object-contain"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeQRCode}
                      className="absolute -top-2 -right-2 bg-white rounded-full shadow-md"
                    >
                      <XCircle className="h-5 w-5 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="min-w-[150px]">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Update Variant"
            ) : (
              "Create Variant"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default VariantForm;