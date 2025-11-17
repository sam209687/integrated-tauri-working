// src/components/forms/StoreForm.tsx
"use client";

import React, { useState, useTransition } from "react"; // 💡 FIX 1: Removed unused 'useEffect'
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { createStore, updateStore } from "@/actions/store.actions";
import { IStore } from "@/lib/models/store";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, QrCode, Download } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import QRCode from 'qrcode';
import { StoreSchema } from "@/lib/schemas";

interface StoreFormProps {
  initialData?: IStore | null;
}

type StoreFormValues = z.infer<typeof StoreSchema>;

export function StoreForm({ initialData }: StoreFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null);

  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(initialData?.qrCode || null);
  
  const [mediaQRCodeFile, setMediaQRCodeFile] = useState<File | null>(null);
  const [mediaQRCodePreview, setMediaQRCodePreview] = useState<string | null>(initialData?.mediaQRCode || null);
  
  const isEditing = !!initialData;

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(StoreSchema),
    defaultValues: {
      storeName: initialData?.storeName || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      pincode: initialData?.pincode || "",
      state: initialData?.state || "",
      contactNumber: initialData?.contactNumber || "",
      email: initialData?.email || "",
      fssai: initialData?.fssai || "",
      pan: initialData?.pan || "",
      gst: initialData?.gst || "",
      mediaUrl: initialData?.mediaUrl || "",
      status: initialData?.status || 'INACTIVE',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void, setPreview: (url: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setFile(null);
      setPreview(null);
    }
  };
  
  const handleGenerateQr = async () => {
    const values = form.getValues();
    const qrData = JSON.stringify({
      storeName: values.storeName,
      address: values.address,
      city: values.city,
      pincode: values.pincode,
      state: values.state,
      contactNumber: values.contactNumber,
      email: values.email,
      fssai: values.fssai,
      pan: values.pan,
      gst: values.gst,
    });
  
    try {
      const qrCodeUrl = await QRCode.toDataURL(qrData);
      const blob = await fetch(qrCodeUrl).then(res => res.blob());
      const file = new File([blob], 'store-details-qr.png', { type: 'image/png' });
      setQrCodeFile(file);
      setQrCodePreview(URL.createObjectURL(file));
      toast.success("Store Details QR Code generated!");
    } 
    // 💡 FIX 2: Add eslint-disable-next-line
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (_) { 
      toast.error("Failed to generate QR Code.");
    }
  };
  
  const handleGenerateMediaQr = async () => {
    const mediaUrl = form.getValues("mediaUrl");
    if (!mediaUrl || !/^(https?:\/\/)/.test(mediaUrl)) {
      toast.error("Please enter a valid URL to generate a QR code.");
      return;
    }
    
    try {
      const qrCodeUrl = await QRCode.toDataURL(mediaUrl);
      const blob = await fetch(qrCodeUrl).then(res => res.blob());
      const file = new File([blob], 'media-qr.png', { type: 'image/png' });
      setMediaQRCodeFile(file);
      setMediaQRCodePreview(URL.createObjectURL(file));
      toast.success("Media QR Code generated successfully!");
    } 
    // 💡 FIX 3: Add eslint-disable-next-line
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (_) { 
      toast.error("Failed to generate Media QR Code.");
    }
  };

  const onSubmit = (values: StoreFormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
          if (value !== null && value !== undefined) formData.append(key, String(value));
      });
      
      if (logoFile) formData.append("logo", logoFile);
      formData.append("oldLogoPath", initialData?.logo || "");

      if (qrCodeFile) formData.append("qrCode", qrCodeFile);
      formData.append("oldQrCodePath", initialData?.qrCode || "");
      
      if (mediaQRCodeFile) formData.append("mediaQRCode", mediaQRCodeFile);
      formData.append("oldMediaQRCodePath", initialData?.mediaQRCode || "");

      const result = isEditing && initialData
        ? await updateStore(initialData._id as string, formData)
        : await createStore(formData);

      if (result.success) {
        toast.success(result.message);
        router.push("/admin/store-settings");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="storeName" render={({ field }) => ( <FormItem><FormLabel>Store Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
        <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="pincode" render={({ field }) => ( <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="state" render={({ field }) => ( <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="contactNumber" render={({ field }) => ( <FormItem><FormLabel>Contact</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="fssai" render={({ field }) => ( <FormItem><FormLabel>FSSAI (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="pan" render={({ field }) => ( <FormItem><FormLabel>PAN (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="gst" render={({ field }) => ( <FormItem><FormLabel>GST (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
        </div>
        <FormField
          control={form.control}
          name="logo"
          render={() => (
            <FormItem>
              <FormLabel>Store Logo</FormLabel>
              <FormControl>
                <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setLogoFile, setLogoPreview)} disabled={isPending} />
              </FormControl>
              {logoPreview && (
                <div className="relative w-32 h-32 mt-2">
                  <Image src={logoPreview} alt="Logo Preview" fill style={{objectFit: 'contain'}} />
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
            <FormLabel>Store Details QR Code</FormLabel>
            <p className="text-sm text-muted-foreground">
              Generate a QR code from the store details entered above.
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={handleGenerateQr} disabled={isPending}>
                <QrCode className="mr-2 h-4 w-4" /> Generate
              </Button>
              {qrCodePreview && (
                <a href={qrCodePreview} download="store-details-qr.png">
                  <Button type="button" variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                </a>
              )}
            </div>
            {qrCodePreview && (
                <div className="relative w-32 h-32 mt-2">
                  <Image src={qrCodePreview} alt="QR Code Preview" fill style={{objectFit: 'contain'}} />
                </div>
              )}
        </div>
        <FormField
          control={form.control}
          name="mediaUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Media Url (Optional)</FormLabel>
               <p className="text-sm text-muted-foreground">
                This Url will generate a QR code which redirects users to social media pages like Facebook, Instagram, etc.
              </p>
              <FormControl>
                <Input 
                  type="url" 
                  placeholder="https://instagram.com/your-page" 
                  {...field} 
                  value={field.value ?? ""} 
                  disabled={isPending} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <div className="space-y-2">
            <Button type="button" onClick={handleGenerateMediaQr} disabled={isPending || !form.watch("mediaUrl")}>
                <QrCode className="mr-2 h-4 w-4" /> Generate QR Code for Media
            </Button>
            {mediaQRCodePreview && (
                <div className="flex items-center gap-4 mt-2">
                    <div className="relative w-32 h-32">
                        <Image src={mediaQRCodePreview} alt="Media QR Preview" fill style={{objectFit: 'contain'}} />
                    </div>
                    <a href={mediaQRCodePreview} download="media-payment-qr.png">
                        <Button type="button" variant="outline">
                            <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                    </a>
                </div>
            )}
        </div>
        {isEditing && (
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                    <Checkbox
                        checked={field.value === "ACTIVE"}
                        onCheckedChange={(checked) => field.onChange(checked ? "ACTIVE" : "INACTIVE")}
                        disabled={isPending}
                    />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>Set as Active Store</FormLabel>
                    </div>
                </FormItem>
                )}
            />
        )}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Please wait..." : isEditing ? "Update Store" : "Add Store"}
        </Button>
      </form>
    </Form>
  );
}