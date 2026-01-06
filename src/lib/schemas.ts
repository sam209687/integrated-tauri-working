// src/lib/schemas.ts
import { z } from "zod";
import {
  packingMaterialSchema as packingMaterialSchema_internal,
  PackingMaterialFormValues as PackingMaterialFormValues_internal,
} from "./schemas/packingMaterialSchema";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const brandSchema = z.object({
  name: z.string().min(2, {
    message: "Brand name must be at least 2 characters long.",
  }),
  image: z
    .instanceof(File, { message: "Image is required." })
    .refine((file) => file.size > 0, "Image is required.")
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

// Category Schema
export const categorySchema = z.object({
  name: z.string().min(2, {
    message: "Category name must be at least 2 characters long.",
  }),
  codePrefix: z.string().min(2, {
    message: "Code prefix must be at least 2 characters long.",
  }),
});

// Unit Schema
export const unitSchema = z.object({
  name: z.string().min(1, {
    message: "Unit name cannot be empty.",
  }),
});

// Tax Schema
export const taxSchema = z.object({
  name: z.string().min(1, {
    message: "Tax name cannot be empty.",
  }),
  hsn: z.string().min(1, {
    message: "HSN cannot be empty.",
  }),
  gst: z.coerce.number().min(0, {
    message: "GST must be a positive number.",
  }),
});

// Store-Settings
export const StoreSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  pincode: z.string().min(1, "Pincode is required"),
  state: z.string().min(1, "State is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  email: z.string().email("Invalid email address"),

  // Optional fields
  fssai: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
  gst: z.string().optional().nullable(),

  // Social Media & Web URLs (all optional)
  facebookUrl: z
    .union([z.string().url("Invalid Facebook URL"), z.literal("")])
    .optional()
    .nullable(),
  instagramUrl: z
    .union([z.string().url("Invalid Instagram URL"), z.literal("")])
    .optional()
    .nullable(),
  youtubeUrl: z
    .union([z.string().url("Invalid YouTube URL"), z.literal("")])
    .optional()
    .nullable(),
  twitterUrl: z
    .union([z.string().url("Invalid Twitter URL"), z.literal("")])
    .optional()
    .nullable(),
  googleMapsUrl: z
    .union([z.string().url("Invalid Google Maps URL"), z.literal("")])
    .optional()
    .nullable(),
  websiteUrl: z
    .union([z.string().url("Invalid Website URL"), z.literal("")])
    .optional()
    .nullable(),

  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

// currency schema
export const currencySchema = z.object({
  sNo: z.string().min(1, "Serial number is required."),
  currencySymbol: z.string().min(1, "Currency symbol is required."),
});

// Product Schema (RETAIL READY)
export const productSchema = z.object({
  category: z.string().min(1, "Category is required."),
  brand: z.string().min(1, "Brand is required."),
  productCode: z.string().optional(),
  productName: z.string().min(2, "Product name is required."),
  description: z.string().optional(),
  tax: z.string().optional(),

  // ✅ MULTIPLE SELLING TYPES (array instead of single value)
  sellingTypes: z.array(z.enum(["FIXED", "WEIGHT", "VOLUME", "VALUE"])).min(1, "Select at least one selling type"),
  
  // Base unit for loose sales (weight/volume)
  baseUnit: z.string().min(1, "Base unit is required"),
  
  // Allow loose sale for WEIGHT/VOLUME types
  allowLooseSale: z.boolean(),
});

// ✅ FIX: Remove the 'variant' field from the schema
export const batchSchema = z.object({
  product: z.string().min(1, "Product is required."),
  batchNumber: z.string().min(1, "Batch number is required."),
  vendorName: z.string().min(2, "Vendor name is required."),
  qty: z.coerce.number().min(1, "Quantity must be at least 1."),
  price: z.coerce.number().min(0.01, "Price must be a positive number."),
  perUnitPrice: z.coerce.number().optional(),
  oilCakeProduced: z.coerce.number().optional(),
  oilExpelled: z.coerce.number().optional(),
});

// ✅ FINAL Variant Schema (Retail + Wholesale)
export const variantSchema = z.object({
  product: z.string().min(1, "Product is required."),

  // Quantity definition
  variantVolume: z.coerce.number().min(0, "Variant volume must be non-negative."),
  unit: z.string().min(1, "Unit is required."),

  // ✅ PRICING - All required fields
  purchasePrice: z.coerce.number().min(0, "Purchase price must be non-negative."),
  sellingPrice: z.coerce.number().min(0, "Selling price must be non-negative."),
  mrp: z.coerce.number().min(0, "MRP must be non-negative."),
  discount: z.coerce.number().min(0).max(100),

  // Inventory
  stockQuantity: z.coerce.number().min(0),
  stockAlertQuantity: z.coerce.number().min(0),

  // Optional attributes
  variantColor: z.string().optional(),
  image: z.any().optional(),
  qrCode: z.any().optional(),

  // ✅ Cost breakup - ALL REQUIRED (not optional)
  packingCharges: z.coerce.number().min(0),
  laborCharges: z.coerce.number().min(0),
  electricityCharges: z.coerce.number().min(0),
  others1: z.coerce.number().min(0),
  others2: z.coerce.number().min(0),
});

// oec.schema.ts
export const oecSchema = z.object({
  product: z.string().min(1, { message: "Product is required." }),
  oilExpellingCharges: z.coerce
    .number()
    .min(0, { message: "Oil Expelling Charges must be a positive number." }),
});

// customer details schema
export const customerSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, {
    message: "Phone number must be exactly 10 digits.",
  }),
  name: z.string().min(2, {
    message: "Customer name must be at least 2 characters.",
  }),
  address: z.string().optional(),
});

// Messsage Shema

export const messageSchema = z.object({
  sender: z.string().min(1, "Sender ID is required."),
  recipient: z.string().min(1, "Recipient ID is required."),
  content: z.string().min(1, "Message content cannot be empty."),
});

export const PackingMaterialSchema = packingMaterialSchema_internal;
export type PackingMaterialFormValues = PackingMaterialFormValues_internal;

// Offers Schemas

// Prize Schema (used in festival hit counter)
export const prizeSchema = z.object({
  rank: z.enum(["first", "second", "third"]),
  prizeName: z.string().min(1, "Prize name is required."),
  image: z
    .instanceof(File)
    .refine((file) => file.size > 0, "Prize image is required.")
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

// Base fields common to all offers
const baseOfferFields = {
  product: z.string().min(1, "Product is required."),
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string().min(1, "End date is required."),
};

// Festival Hit Counter Offer Schema
export const festivalHitCounterOfferSchema = z.object({
  ...baseOfferFields,
  offerType: z.literal("festival_hit_counter"),
  festivalName: z.string().min(1, "Festival name is required."),
  customerLimit: z.coerce.number().min(1, "Customer limit must be at least 1."),
  prizes: z.array(prizeSchema).length(3, "All three prizes are required."),
});

// Festival Amount-Based Offer Schema
export const festivalAmountOfferSchema = z.object({
  ...baseOfferFields,
  offerType: z.literal("festival_amount"),
  festivalName: z.string().min(1, "Festival name is required."),
  minimumAmount: z.coerce
    .number()
    .min(1, "Minimum amount must be greater than 0."),
  prizeName: z.string().min(1, "Prize name is required."),
  prizeImage: z
    .instanceof(File)
    .refine((file) => file.size > 0, "Prize image is required.")
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

// Regular Visit Count Offer Schema
export const regularVisitCountOfferSchema = z.object({
  ...baseOfferFields,
  offerType: z.literal("regular_visit"),
  visitCount: z.coerce.number().min(1, "Visit count must be at least 1."),
  prizeName: z.string().min(1, "Prize name is required."),
  prizeImage: z
    .instanceof(File)
    .refine((file) => file.size > 0, "Prize image is required.")
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

// Regular Purchase Amount Offer Schema
export const regularPurchaseAmountOfferSchema = z.object({
  ...baseOfferFields,
  offerType: z.literal("regular_amount"),
  targetAmount: z.coerce
    .number()
    .min(1, "Target amount must be greater than 0."),
  prizeName: z.string().min(1, "Prize name is required."),
  prizeImage: z
    .instanceof(File)
    .refine((file) => file.size > 0, "Prize image is required.")
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

// Union type for all offer schemas - NOW WITH UNIQUE DISCRIMINATOR VALUES
export const offerSchema = z.discriminatedUnion("offerType", [
  festivalHitCounterOfferSchema,
  festivalAmountOfferSchema,
  regularVisitCountOfferSchema,
  regularPurchaseAmountOfferSchema,
]);

// Terms and Conditions Schema
export const termsSchema = z.object({
  terms: z
    .string()
    .min(10, "Terms and conditions must be at least 10 characters long.")
    .max(5000, "Terms and conditions cannot exceed 5000 characters."),
  isActive: z.boolean().default(true),
});

export type TermsFormData = z.infer<typeof termsSchema>;
