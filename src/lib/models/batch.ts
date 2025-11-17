import { Schema, model, models, Document, Types } from "mongoose";

// ✅ 1. Interface defining the document type
export interface IBatch extends Document {
  product: Types.ObjectId;
  batchNumber: string;
  vendorName: string;
  qty: number;
  price: number;
  perUnitPrice?: number;
  oilCakeProduced?: number;
  oilExpelled?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ 2. Schema definition
const BatchSchema = new Schema<IBatch>(
  {
    product: {
      type: Schema.Types.ObjectId, // ✅ FIX: Use Schema.Types.ObjectId
      ref: "Product",
      required: [true, "Product is required."],
    },
    batchNumber: {
      type: String,
      required: [true, "Batch number is required."],
      unique: true,
      trim: true,
    },
    vendorName: {
      type: String,
      required: [true, "Vendor name is required."],
      trim: true,
    },
    qty: {
      type: Number,
      required: [true, "Quantity is required."],
      min: [0, "Quantity cannot be negative."],
    },
    price: {
      type: Number,
      required: [true, "Price is required."],
      min: [0, "Price cannot be negative."],
    },
    perUnitPrice: { type: Number },
    oilCakeProduced: {
      type: Number,
      min: [0, "Oil cake produced cannot be negative."],
    },
    oilExpelled: {
      type: Number,
      min: [0, "Oil expelled cannot be negative."],
    },
  },
  { timestamps: true }
);

// ✅ 3. Export model properly
export const Batch = models.Batch || model<IBatch>("Batch", BatchSchema);
