// src/lib/models/product.ts
import mongoose, { Schema, model, models, Types, Document } from "mongoose";
import { IBrand } from "./brand";
import { ICategory } from "./category";
import { ITax } from "./tax";

import "./brand";
import "./category";
import "./tax";
import "./unit";

export interface IProduct extends Document {
  _id: string;
  category: Types.ObjectId;
  brand: Types.ObjectId;
  productCode?: string;
  productName: string;
  description?: string;
  tax?: Types.ObjectId;

  // ✅ FIXED: Array of selling types
  sellingTypes: ("FIXED" | "WEIGHT" | "VOLUME" | "VALUE")[];
  baseUnit: Types.ObjectId;
  allowLooseSale: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface IPopulatedProduct
  extends Omit<IProduct, "brand" | "category" | "tax" | "baseUnit"> {
  brand: IBrand;
  category: ICategory;
  tax?: ITax;
  baseUnit: {
    _id: string;
    name: string;
  };
}

const ProductSchema = new Schema<IProduct>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    productCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    productName: {
      type: String,
      required: true,
    },
    description: String,
    tax: {
      type: Schema.Types.ObjectId,
      ref: "Tax",
    },

    // ✅ FIXED: Array of selling types
    sellingTypes: {
      type: [String],
      enum: ["FIXED", "WEIGHT", "VOLUME", "VALUE"],
      required: true,
      validate: {
        validator: function(v: string[]) {
          return v && v.length > 0;
        },
        message: "At least one selling type is required"
      }
    },
    baseUnit: {
      type: Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    allowLooseSale: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Cascade delete variants
ProductSchema.pre("findOneAndDelete", async function (next) {
  try {
    const product = await this.model.findOne(this.getQuery());
    if (product) {
      const Variant = mongoose.model("Variant");
      await Variant.deleteMany({ product: product._id });
    }
    next();
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
});

const Product = models.Product || model<IProduct>("Product", ProductSchema);

export default Product;