// src/lib/models/variant.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { IPopulatedProduct } from "./product";
import { IUnit } from "./unit";

import "./product";
import "./unit";

export interface IVariant extends Document {
  _id: string;
  product: Types.ObjectId;

  variantVolume: number;
  unit: Types.ObjectId;

  purchasePrice: number;
  sellingPrice: number;
  mrp?: number;
  discount?: number;

  // ✅ NEW: Purchase tracking fields
  lastPurchaseDate?: Date;
  nextPurchaseDate?: Date;
  purchaseFrequency?: 'daily' | 'weekly' | 'monthly'; // Helper field for UI

  stockQuantity: number;
  stockAlertQuantity: number;

  variantColor?: string;
  image?: string;
  qrCode?: string;

  packingCharges: number;
  laborCharges: number;
  electricityCharges: number;
  others1: number;
  others2: number;

  createdAt: Date;
  updatedAt: Date;
}

// Extended interface for POS operations
export interface IPopulatedVariant
  extends Omit<IVariant, "product" | "unit"> {
  product: IPopulatedProduct;
  unit: IUnit;
  
  // POS-specific computed properties
  price: number;          // Alias for sellingPrice (used in POS)
  perUnitPrice?: number;  // Price per base unit (for retail billing)
  quantity?: number;      // Quantity in cart (runtime only)
  type?: string;          // Item type: "variant" | "oec" (runtime only)
  
  // Retail billing metadata (runtime only)
  retailBillingData?: {
    originalQuantity: number;
    displayQuantity: string;
    perUnitPrice: number;
  };
}

const VariantSchema = new Schema<IVariant>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    variantVolume: {
      type: Number,
      required: true,
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },

    purchasePrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    mrp: Number,
    discount: Number,

    // ✅ NEW: Purchase tracking fields
    lastPurchaseDate: {
      type: Date,
      default: null,
    },
    nextPurchaseDate: {
      type: Date,
      default: null,
    },
    purchaseFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: null,
    },

    stockQuantity: {
      type: Number,
      required: true,
    },
    stockAlertQuantity: {
      type: Number,
      required: true,
    },

    variantColor: String,
    image: String,
    qrCode: String,

    packingCharges: { type: Number, default: 0 },
    laborCharges: { type: Number, default: 0 },
    electricityCharges: { type: Number, default: 0 },
    others1: { type: Number, default: 0 },
    others2: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field: price (alias for sellingPrice)
VariantSchema.virtual('price').get(function() {
  return this.sellingPrice;
});

// Virtual field: perUnitPrice (calculated based on variant volume)
VariantSchema.virtual('perUnitPrice').get(function() {
  if (this.variantVolume && this.variantVolume > 0) {
    return this.sellingPrice / this.variantVolume;
  }
  return undefined;
});

// ✅ NEW: Virtual field to check if purchase is overdue
VariantSchema.virtual('isPurchaseOverdue').get(function() {
  if (!this.nextPurchaseDate) return false;
  return new Date() > this.nextPurchaseDate;
});

// ✅ NEW: Virtual field to get days until next purchase
VariantSchema.virtual('daysUntilPurchase').get(function() {
  if (!this.nextPurchaseDate) return null;
  const diff = this.nextPurchaseDate.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

const Variant =
  mongoose.models.Variant ||
  mongoose.model<IVariant>("Variant", VariantSchema);

export default Variant;