// src/lib/schemas.ts
import { z } from "zod";
import { 
    packingMaterialSchema as packingMaterialSchema_internal, 
    PackingMaterialFormValues as PackingMaterialFormValues_internal 
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
  storeName: z.string().min(1, "Store name is required."),
  address: z.string().min(1, "Address is required."),
  city: z.string().min(1, "City is required."),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits."),
  state: z.string().min(1, "State is required."),
  contactNumber: z.string().regex(/^\d{10}$/, "Contact number must be 10 digits."),
  email: z.string().email("Invalid email address."),
  fssai: z.string().optional(),
  pan: z.string().optional(),
  gst: z.string().optional(),
  mediaUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
  logo: z
    .any()
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  qrCode: z.string().optional(),
  mediaQRCode: z.string().optional(),
});

// currency schema
export const currencySchema = z.object({
  sNo: z.string().min(1, "Serial number is required."),
  currencySymbol: z.string().min(1, "Currency symbol is required."),
});

// Product Schema
export const productSchema = z.object({
  category: z.string().min(1, "Category is required."),
  brand: z.string().min(1, "Brand is required."),
  productCode: z.string().optional(),
  productName: z.string().min(2, "Product name is required."),
  description: z.string().optional(),
  tax: z.string().optional(),
  purchasePrice: z.coerce.number().min(0, "Purchase price must be a non-negative number."),
  sellingPrice: z.coerce.number().min(0, "Selling price must be a non-negative number."),
  totalPrice: z.coerce.number().optional(),
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

// ✅ CORRECTED: Variants Schema
export const variantSchema = z.object({
  product: z.string().min(1, "Product is required."),
  variantVolume: z.coerce.number().min(0, "Variant volume must be a non-negative number."),
  unit: z.string().min(1, "Unit is required."),
  unitConsumed: z.coerce.number().min(0, "Unit Consumed must be a non-negative number."),
  unitConsumedUnit: z.string().min(1, "Unit Consumed Unit is required."),
  variantColor: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a non-negative number."),
  mrp: z.coerce.number().min(0, "MRP must be a non-negative number."),
  discount: z.coerce.number().min(0).max(100).optional(),
  stockQuantity: z.coerce.number().min(0, "Stock quantity must be a non-negative number."),
  stockAlertQuantity: z.coerce.number().min(0, "Stock alert quantity must be a non-negative number."),
  image: z.any().optional(),
  qrCode: z.any().optional(),
  packingCharges: z.coerce.number().optional(),
  laborCharges: z.coerce.number().optional(),
  electricityCharges: z.coerce.number().optional(),
  others1: z.coerce.number().optional(),
  others2: z.coerce.number().optional(),
});

// oec.schema.ts
export const oecSchema = z.object({
  product: z.string().min(1, { message: "Product is required." }),
  oilExpellingCharges: z.coerce.number().min(0, { message: "Oil Expelling Charges must be a positive number." }),
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
  rank: z.enum(['first', 'second', 'third']),
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
  offerType: z.literal('festival_hit_counter'),
  festivalName: z.string().min(1, "Festival name is required."),
  customerLimit: z.coerce.number().min(1, "Customer limit must be at least 1."),
  prizes: z.array(prizeSchema).length(3, "All three prizes are required."),
});

// Festival Amount-Based Offer Schema
export const festivalAmountOfferSchema = z.object({
  ...baseOfferFields,
  offerType: z.literal('festival_amount'),
  festivalName: z.string().min(1, "Festival name is required."),
  minimumAmount: z.coerce.number().min(1, "Minimum amount must be greater than 0."),
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
  offerType: z.literal('regular_visit'),
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
  offerType: z.literal('regular_amount'),
  targetAmount: z.coerce.number().min(1, "Target amount must be greater than 0."),
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
export const offerSchema = z.discriminatedUnion('offerType', [
  festivalHitCounterOfferSchema,
  festivalAmountOfferSchema,
  regularVisitCountOfferSchema,
  regularPurchaseAmountOfferSchema,
]);