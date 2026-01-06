"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import * as z from "zod";
import { toast } from "sonner";

import { categorySchema } from "@/lib/schemas";
import { createCategory, updateCategory } from "@/actions/category.actions";
import { ICategory } from "@/lib/models/category";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface CategoryFormProps {
  initialData?: ICategory | null;
}

export function CategoryForm({ initialData }: CategoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name || "",
      codePrefix: initialData?.codePrefix || "",
    },
  });

  const isEditing = !!initialData;

  async function onSubmit(values: z.infer<typeof categorySchema>) {
    startTransition(async () => {
      try {
        let result;
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("codePrefix", values.codePrefix);

        if (isEditing && initialData?._id) {
          result = await updateCategory(initialData._id.toString(), formData);
        } else {
          result = await createCategory(formData);
        }

        if (result.success) {
          toast.success(result.message || "Category saved successfully!");
          router.push("/admin/category");
          router.refresh();
        } else {
          toast.error(result.message || "Failed to save category");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
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
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Electronics" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="codePrefix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code Prefix</FormLabel>
              <FormControl>
                <Input placeholder="e.g., ELEC" {...field} disabled={isPending} />
              </FormControl>
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
            "Update Category"
          ) : (
            "Add Category"
          )}
        </Button>
      </form>
    </Form>
  );
}