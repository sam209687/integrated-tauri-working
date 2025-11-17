// src/lib/models/variant.ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { IPopulatedProduct } from './product'; // 💡 FIX: Removed unused 'IProduct'
import { IUnit } from './unit';
import './product';
import './unit';

export interface IVariant extends Document {
  _id: string;
  product: Types.ObjectId;
  variantVolume: number;
  unit: Types.ObjectId;
  unitConsumed: number; // ✅ NEW: Added to interface
  unitConsumedUnit: Types.ObjectId; // ✅ NEW: Added to interface
  variantColor?: string;
  price: number;
  mrp: number;
  discount?: number;
  stockQuantity: number;
  stockAlertQuantity: number;
  image?: string;
  qrCode?: string;
  packingCharges: number;
  laborCharges: number;
  electricityCharges: number;
  others1: number;
  others2: number;
  createdAt: Date;
}

export interface IPopulatedVariant extends Omit<IVariant, 'product' | 'unit' | 'unitConsumedUnit'> {
  product: IPopulatedProduct;
  unit: IUnit;
  unitConsumedUnit: IUnit;
}

const VariantSchema: Schema = new Schema(
  {
    product: {
      type: Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantVolume: {
      type: Number,
      required: true,
    },
    unit: {
      type: Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    // ✅ FIX: Added the missing schema field definition
    unitConsumed: {
      type: Number,
      required: true,
    },
    unitConsumedUnit: {
      type: Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    // End of FIX
    variantColor: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    mrp: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
    },
    stockQuantity: {
      type: Number,
      required: true,
    },
    stockAlertQuantity: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
    },
    qrCode: {
      type: String,
    },
    packingCharges: { type: Number, default: 0 },
    laborCharges: { type: Number, default: 0 },
    electricityCharges: { type: Number, default: 0 },
    others1: { type: Number, default: 0 },
    others2: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Variant = mongoose.models.Variant || mongoose.model<IVariant>('Variant', VariantSchema);

export default Variant;