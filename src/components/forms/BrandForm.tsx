// src/components/forms/BrandForm.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import * as z from "zod";
import Image from "next/image";

import { createBrand, updateBrand } from "@/actions/brand.actions";
import { IBrand } from "@/lib/models/brand";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

// Universal schema that handles both create and edit
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const brandFormSchema = z.object({
  name: z.string().min(2, {
    message: "Brand name must be at least 2 characters long.",
  }),
  image: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.size === 0 || file.size <= MAX_FILE_SIZE,
      `Max image size is 5MB.`
    )
    .refine(
      (file) => !file || file.size === 0 || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;

interface BrandFormProps {
  initialData?: IBrand | null;
}

export function BrandForm({ initialData }: BrandFormProps) {
  const [isPending, startTransition] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const router = useRouter();

  const isEditing = !!initialData;
  
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      image: undefined,
    },
  });

  function onSubmit(values: BrandFormValues) {
    // Validate: Image is required when creating a new brand
    if (!isEditing && (!values.image || values.image.size === 0)) {
      form.setError("image", {
        type: "manual",
        message: "Image is required when creating a brand.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", values.name);
    
    // Only append image if it exists and has content
    if (values.image && values.image.size > 0) {
      formData.append("image", values.image);
    }
    
    startTransition(async () => {
      let result;
      if (isEditing && initialData?._id) {
        result = await updateBrand(initialData._id, formData);
      } else {
        result = await createBrand(formData);
      }
      
      if (result.success) {
        router.push("/admin/brand");
      } else {
        // Handle duplicate name error
        if (result.message?.includes("E11000") || result.message?.includes("duplicate")) {
          form.setError("name", {
            type: "manual",
            message: "This brand name already exists. Please use a different name.",
          });
        } else {
          // Show generic error for other issues
          form.setError("root", {
            type: "manual",
            message: result.message || "Failed to save brand. Please try again.",
          });
        }
        console.error(result.errors || result.message);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Nike" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Show root error if any */}
        {form.formState.errors.root && (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
            {form.formState.errors.root.message}
          </div>
        )}
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Brand Image {isEditing && <span className="text-sm text-gray-500">(optional)</span>}
                {!isEditing && <span className="text-red-500">*</span>}
              </FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    field.onChange(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImagePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  disabled={isPending}
                />
              </FormControl>
              {imagePreview && (
                <div className="relative h-40 w-40 mt-4 rounded-md overflow-hidden mx-auto border">
                  <Image
                    src={imagePreview}
                    alt="Brand Image Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait...
            </>
          ) : isEditing ? (
            "Update Brand"
          ) : (
            "Add Brand"
          )}
        </Button>
      </form>
    </Form>
  );
}