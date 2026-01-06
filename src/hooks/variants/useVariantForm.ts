// src/hooks/variants/useVariantForm.ts
// 🎯 LOGIC LAYER: All business logic, state management, and side effects

import { useState, useEffect, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import QRCode from "qrcode";

import { variantSchema } from "@/lib/schemas";
import { useProductStore } from "@/store/product.store";
import { IPopulatedVariant } from "@/lib/models/variant";
import { IPopulatedProduct } from "@/lib/models/product";
import {
  createVariant,
  updateVariant,
  VariantData,
} from "@/actions/variant.actions";
import { useVariantStore } from "@/store/variantStore";

type VariantFormValues = z.infer<typeof variantSchema>;

export interface UseVariantFormProps {
  initialData?: IPopulatedVariant | null;
}

export function useVariantForm({ initialData }: UseVariantFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData;

  // Zustand stores
  const variantStore = useVariantStore();
  const productStore = useProductStore();

  // Local state
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image || null
  );
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(
    initialData?.qrCode || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<IPopulatedProduct | null>(
    initialData?.product || null
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialData?.product?.category?._id || ""
  );

  // Form setup with proper default values
  const form = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      product: initialData?.product._id || "",
      variantVolume: initialData?.variantVolume || 0,
      unit: initialData?.unit._id || "",
      purchasePrice: initialData?.purchasePrice || 0,
      sellingPrice: initialData?.sellingPrice || 0,
      mrp: initialData?.mrp || 0,
      discount: initialData?.discount || 0,
      stockQuantity: initialData?.stockQuantity || 0,
      stockAlertQuantity: initialData?.stockAlertQuantity || 0,
      variantColor: initialData?.variantColor || "",
      packingCharges: initialData?.packingCharges || 0,
      laborCharges: initialData?.laborCharges || 0,
      electricityCharges: initialData?.electricityCharges || 0,
      others1: initialData?.others1 || 0,
      others2: initialData?.others2 || 0,
      image: initialData?.image,
      qrCode: initialData?.qrCode,
    },
  });

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, IPopulatedProduct[]> = {};

    productStore.products.forEach((product) => {
      const categoryId = product.category?._id || "uncategorized";
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push(product);
    });

    return grouped;
  }, [productStore.products]);

  // Get filtered products for selected category
  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    return productsByCategory[selectedCategoryId] || [];
  }, [selectedCategoryId, productsByCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Map();
    productStore.products.forEach((product) => {
      if (product.category) {
        uniqueCategories.set(product.category._id, product.category);
      }
    });
    return Array.from(uniqueCategories.values());
  }, [productStore.products]);

  // 🎯 Effect: Load initial data
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        productStore.fetchProducts(),
        productStore.fetchFormData(),
      ]);
    };
    loadData();
  }, []);

  // 🎯 Effect: Set initial category if editing
  useEffect(() => {
    if (initialData?.product?.category?._id) {
      setSelectedCategoryId(initialData.product.category._id);
    }
  }, [initialData]);

  // 🎯 Effect: Handle product selection
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "product" && value.product) {
        const selected = productStore.products.find(
          (p) => p._id === value.product
        );
        setSelectedProduct(selected || null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, productStore.products]);

  // 🎯 Effect: Reset product when category changes
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    // Reset product selection when category changes
    form.setValue("product", "");
    setSelectedProduct(null);
  };

  // 🎯 Effect: Auto-calculate pricing
  useEffect(() => {
    const subscription = form.watch((value) => {
      const purchase = Number(value.purchasePrice) || 0;
      const charges =
        (Number(value.packingCharges) || 0) +
        (Number(value.laborCharges) || 0) +
        (Number(value.electricityCharges) || 0) +
        (Number(value.others1) || 0) +
        (Number(value.others2) || 0);

      const calculatedSelling = purchase + charges;
      const mrp = Number(value.mrp) || 0;
      const discount = mrp > calculatedSelling ? 
        Number(((mrp - calculatedSelling) / mrp * 100).toFixed(2)) : 0;

      const currentSelling = Number(value.sellingPrice) || 0;
      const currentDiscount = Number(value.discount) || 0;

      if (Math.abs(currentSelling - calculatedSelling) > 0.01) {
        form.setValue("sellingPrice", calculatedSelling, { shouldValidate: false });
      }
      
      if (Math.abs(currentDiscount - discount) > 0.01) {
        form.setValue("discount", discount, { shouldValidate: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // 🎯 Image handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  // 🎯 QR Code generation
  const generateQRCode = async () => {
    const values = form.getValues();
    
    if (!selectedProduct?.productCode) {
      toast.error("Product code is required to generate QR code.");
      return;
    }

    const qrData = JSON.stringify({
      productCode: selectedProduct.productCode,
      productName: selectedProduct.productName,
      sellingPrice: values.sellingPrice,
      mrp: values.mrp,
      discount: values.discount,
      variantVolume: values.variantVolume,
      unit: values.unit,
      variantColor: values.variantColor,
    });

    try {
      const qrCodeUrl = await QRCode.toDataURL(qrData);
      setQrCodePreview(qrCodeUrl);
      toast.success("QR Code generated successfully!");
    } catch (error) {
      console.error("QR Code generation error:", error);
      toast.error("Failed to generate QR Code.");
    }
  };

  const removeQRCode = () => {
    setQrCodePreview(null);
  };

  // 🎯 Form submission
  const onSubmit = async (values: VariantFormValues) => {
    startTransition(async () => {
      let imagePath = isEditing ? initialData?.image || "" : "";
      let qrCodePath = isEditing ? initialData?.qrCode || "" : "";

      // Upload image if changed
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.success) {
            imagePath = data.data.url;
          } else {
            toast.error("Image upload failed.");
            return;
          }
        } catch (error) {
          toast.error("Image upload error.");
          return;
        }
      }

      // Upload QR code if generated
      if (qrCodePreview && qrCodePreview.startsWith("data:")) {
        try {
          const qrCodeBlob = await fetch(qrCodePreview).then((res) =>
            res.blob()
          );
          const qrCodeFormData = new FormData();
          qrCodeFormData.append(
            "file",
            new File([qrCodeBlob], "variant-qr.png", { type: "image/png" })
          );
          const res = await fetch("/api/upload", {
            method: "POST",
            body: qrCodeFormData,
          });
          const data = await res.json();
          if (data.success) {
            qrCodePath = data.data.url;
          } else {
            toast.error("QR Code upload failed.");
            return;
          }
        } catch (error) {
          toast.error("QR Code upload error.");
          return;
        }
      }

      const variantData: VariantData = {
        product: values.product,
        variantVolume: Number(values.variantVolume),
        unit: values.unit,
        purchasePrice: Number(values.purchasePrice),
        sellingPrice: Number(values.sellingPrice),
        mrp: Number(values.mrp),
        discount: Number(values.discount),
        stockQuantity: Number(values.stockQuantity),
        stockAlertQuantity: Number(values.stockAlertQuantity),
        variantColor: values.variantColor,
        packingCharges: Number(values.packingCharges),
        laborCharges: Number(values.laborCharges),
        electricityCharges: Number(values.electricityCharges),
        others1: Number(values.others1),
        others2: Number(values.others2),
        image: imagePath,
        qrCode: qrCodePath,
      };

      let result;
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

  return {
    // Form
    form,
    onSubmit: form.handleSubmit(onSubmit),
    
    // State
    isPending,
    isEditing,
    isLoading: productStore.isLoading,
    
    // Data
    categories,
    selectedCategoryId,
    handleCategoryChange,
    productsByCategory,
    filteredProducts,
    units: productStore.units,
    selectedProduct,
    
    // Image
    imagePreview,
    handleImageChange,
    removeImage,
    
    // QR Code
    qrCodePreview,
    generateQRCode,
    removeQRCode,
  };
}