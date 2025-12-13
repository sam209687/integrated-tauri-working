// src/components/forms/StoreForm.tsx
"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { createStore, updateStore } from "@/actions/store.actions";
import { IStore } from "@/lib/models/store";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, QrCode, Download, Globe } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import QRCode from 'qrcode';
import { StoreSchema } from "@/lib/schemas";

interface StoreFormProps {
  initialData?: IStore | null;
}

type StoreFormValues = z.infer<typeof StoreSchema>;

// Social media configuration
const socialMediaConfig = [
  { 
    name: 'facebookUrl', 
    label: 'Facebook Page', 
    placeholder: 'https://facebook.com/your-page',
    qrField: 'facebookQRCode',
    folder: 'facebook'
  },
  { 
    name: 'instagramUrl', 
    label: 'Instagram Profile', 
    placeholder: 'https://instagram.com/your-profile',
    qrField: 'instagramQRCode',
    folder: 'instagram'
  },
  { 
    name: 'youtubeUrl', 
    label: 'YouTube Channel', 
    placeholder: 'https://youtube.com/@your-channel',
    qrField: 'youtubeQRCode',
    folder: 'youtube'
  },
  { 
    name: 'twitterUrl', 
    label: 'Twitter/X Profile', 
    placeholder: 'https://twitter.com/your-profile',
    qrField: 'twitterQRCode',
    folder: 'twitter'
  },
  { 
    name: 'googleMapsUrl', 
    label: 'Google Maps Location', 
    placeholder: 'https://maps.google.com/...',
    qrField: 'googleMapsQRCode',
    folder: 'googlemaps'
  },
  { 
    name: 'websiteUrl', 
    label: 'Store Website', 
    placeholder: 'https://your-store-website.com',
    qrField: 'websiteQRCode',
    folder: 'website'
  },
] as const;

export function StoreForm({ initialData }: StoreFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null);

  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(initialData?.qrCode || null);
  
  // State for each social media QR code
  const [socialQRCodes, setSocialQRCodes] = useState<Record<string, { file: File | null, preview: string | null }>>({
    facebookQRCode: { file: null, preview: initialData?.facebookQRCode || null },
    instagramQRCode: { file: null, preview: initialData?.instagramQRCode || null },
    youtubeQRCode: { file: null, preview: initialData?.youtubeQRCode || null },
    twitterQRCode: { file: null, preview: initialData?.twitterQRCode || null },
    googleMapsQRCode: { file: null, preview: initialData?.googleMapsQRCode || null },
    websiteQRCode: { file: null, preview: initialData?.websiteQRCode || null },
  });
  
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
      facebookUrl: initialData?.facebookUrl || "",
      instagramUrl: initialData?.instagramUrl || "",
      youtubeUrl: initialData?.youtubeUrl || "",
      twitterUrl: initialData?.twitterUrl || "",
      googleMapsUrl: initialData?.googleMapsUrl || "",
      websiteUrl: initialData?.websiteUrl || "",
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (_) { 
      toast.error("Failed to generate QR Code.");
    }
  };
  
  const handleGenerateSocialQr = async (urlField: string, qrField: string, label: string, folder: string) => {
    const url = form.getValues(urlField as keyof StoreFormValues) as string;
    if (!url || !/^(https?:\/\/)/.test(url)) {
      toast.error(`Please enter a valid ${label} URL to generate a QR code.`);
      return;
    }
    
    try {
      const qrCodeUrl = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      const blob = await fetch(qrCodeUrl).then(res => res.blob());
      
      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const fileName = `${folder}-qr-${timestamp}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      const preview = URL.createObjectURL(file);
      
      setSocialQRCodes(prev => ({
        ...prev,
        [qrField]: { file, preview }
      }));
      
      toast.success(`${label} QR Code generated successfully!`);
    } 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (_) { 
      toast.error(`Failed to generate ${label} QR Code.`);
    }
  };

  const onSubmit = (values: StoreFormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            formData.append(key, String(value));
          }
      });
      
      if (logoFile) formData.append("logo", logoFile);
      formData.append("oldLogoPath", initialData?.logo || "");

      if (qrCodeFile) formData.append("qrCode", qrCodeFile);
      formData.append("oldQrCodePath", initialData?.qrCode || "");
      
      // Add all social media QR codes with their folder information
      Object.entries(socialQRCodes).forEach(([key, { file }]) => {
        if (file) {
          formData.append(key, file);
          
          // Add folder information for the server
          const socialConfig = socialMediaConfig.find(s => s.qrField === key);
          if (socialConfig) {
            formData.append(`${key}Folder`, socialConfig.folder);
          }
        }
        // @ts-expect-error - Dynamic key access
        formData.append(`old${key.charAt(0).toUpperCase() + key.slice(1)}Path`, initialData?.[key] || "");
      });

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Store Information */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Basic Information</h3>
            <p className="text-sm text-muted-foreground">Enter your store&apos;s basic details</p>
          </div>
          
          <FormField control={form.control} name="storeName" render={({ field }) => ( 
            <FormItem>
              <FormLabel>Store Name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem> 
          )} />
          
          <FormField control={form.control} name="address" render={({ field }) => ( 
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem> 
          )} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="city" render={({ field }) => ( 
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem> 
            )} />
            <FormField control={form.control} name="pincode" render={({ field }) => ( 
              <FormItem>
                <FormLabel>Pincode</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem> 
            )} />
            <FormField control={form.control} name="state" render={({ field }) => ( 
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem> 
            )} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="contactNumber" render={({ field }) => ( 
              <FormItem>
                <FormLabel>Contact Number</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem> 
            )} />
            <FormField control={form.control} name="email" render={({ field }) => ( 
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem> 
            )} />
          </div>
        </div>

        {/* Business Registration Details */}
        <div className="space-y-4 pt-6 border-t">
          <div>
            <h3 className="text-lg font-medium">Business Registration</h3>
            <p className="text-sm text-muted-foreground">Optional business registration details</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="fssai" render={({ field }) => ( 
              <FormItem>
                <FormLabel>FSSAI (Optional)</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem> 
            )} />
            <FormField control={form.control} name="pan" render={({ field }) => ( 
              <FormItem>
                <FormLabel>PAN (Optional)</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem> 
            )} />
            <FormField control={form.control} name="gst" render={({ field }) => ( 
              <FormItem>
                <FormLabel>GST (Optional)</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem> 
            )} />
          </div>
        </div>

        {/* Logo & Store Details QR */}
        <div className="space-y-4 pt-6 border-t">
          <div>
            <h3 className="text-lg font-medium">Branding & QR Code</h3>
            <p className="text-sm text-muted-foreground">Upload your logo and generate store details QR code</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Store Logo</label>
            <Input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, setLogoFile, setLogoPreview)} 
              disabled={isPending} 
            />
            {logoPreview && (
              <div className="relative w-32 h-32 mt-2">
                <Image src={logoPreview} alt="Logo Preview" fill style={{objectFit: 'contain'}} />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <FormLabel>Store Details QR Code</FormLabel>
            <FormDescription>
              Generate a QR code from the store details entered above. This will be saved to public/media/QR/store/
            </FormDescription>
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
        </div>

        {/* Social Media & Web Links */}
        <div className="space-y-4 pt-6 border-t">
          <div>
            <h3 className="text-lg font-medium">Social Media & Web Presence</h3>
            <p className="text-sm text-muted-foreground">Add your social media profiles and website. QR codes will be saved to public/media/QR/[platform]/</p>
          </div>
          
          {socialMediaConfig.map((social) => (
            <div key={social.name} className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <h4 className="font-medium">{social.label}</h4>
                <span className="text-xs text-muted-foreground ml-auto">
                  QR saved to: /media/QR/{social.folder}/
                </span>
              </div>
              
              <FormField
                control={form.control}
                name={social.name as keyof StoreFormValues}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="url" 
                        placeholder={social.placeholder}
                        {...field} 
                        value={field.value as string ?? ""} 
                        disabled={isPending} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-center gap-2 flex-wrap">
                <Button 
                  type="button" 
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateSocialQr(social.name, social.qrField, social.label, social.folder)} 
                  disabled={isPending || !form.watch(social.name as keyof StoreFormValues)}
                >
                  <QrCode className="mr-2 h-4 w-4" /> Generate QR
                </Button>
                
                {socialQRCodes[social.qrField]?.preview && (
                  <a href={socialQRCodes[social.qrField].preview!} download={`${social.folder}-qr.png`}>
                    <Button type="button" size="sm" variant="outline">
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  </a>
                )}
              </div>
              
              {socialQRCodes[social.qrField]?.preview && (
                <div className="relative w-24 h-24 mt-2">
                  <Image 
                    src={socialQRCodes[social.qrField].preview!} 
                    alt={`${social.label} QR Code`} 
                    fill 
                    style={{objectFit: 'contain'}} 
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Status Toggle */}
        {isEditing && (
          <div className="pt-6 border-t">
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
                    <FormDescription>Only one store can be active at a time</FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-full" size="lg">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Please wait..." : isEditing ? "Update Store" : "Add Store"}
        </Button>
      </form>
    </Form>
  );
}