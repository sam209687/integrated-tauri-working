// src/lib/models/product.ts
import mongoose, { Schema, model, models, Types, Document } from 'mongoose';
import { IBrand } from './brand';
import { ICategory } from './category';
import { ITax } from './tax';
import './brand';
import './category';
import './unit';
import './tax';
import './variant';

// ... (IProduct and IPopulatedProduct interfaces remain the same)

export interface IProduct extends Document {
  _id : string;
  category: Types.ObjectId;
  brand: Types.ObjectId;
  productCode: string;
  productName: string;
  description?: string;
  tax: Types.ObjectId;
  purchasePrice: number;
  sellingPrice: number;
  totalPrice: number;
  createdAt: Date;
}

export interface IPopulatedProduct extends Omit<IProduct, 'brand' | 'category' | 'tax'> {
  brand: IBrand;
  category: ICategory;
  tax : ITax
}

const ProductSchema = new Schema({
  category: { type: Types.ObjectId, ref: 'Category', required: true },
  brand: { type: Types.ObjectId, ref: 'Brand', required: true },
  productCode: { type: String, required: true, unique: true },
  productName: { type: String, required: true },
  description: { type: String },
  tax: { type: Types.ObjectId, ref: 'Tax', required: true },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

ProductSchema.pre('findOneAndDelete', async function (next) {
  try {
    const product = await this.model.findOne(this.getQuery());
    if (product) {
      const Variant = mongoose.model('Variant');
      await Variant.deleteMany({ product: product._id });
    }
    next();
  } catch (error: unknown) {
    // 💡 FIX: Use a type guard to ensure the object passed to next() is an Error.
    if (error instanceof Error) {
      next(error);
    } else {
      // If it's not a standard Error object (e.g., a string or plain object), wrap it.
      next(new Error(`An unknown error occurred during product deletion hook: ${error}`));
    }
  }
});

const Product = models.Product || model<IProduct>('Product', ProductSchema);

export default Product;