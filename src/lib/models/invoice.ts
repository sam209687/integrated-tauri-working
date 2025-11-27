// ============================================================================
// FILE 1: src/lib/models/invoice.ts (UPDATED)
// ============================================================================
import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUser } from './user'; 
import { ICustomer } from './customer'; 

export interface IInvoiceItem {
  name: string;
  price: number;
  quantity: number;
  variantId: Types.ObjectId | string;
  mrp?: number;
  gstRate?: number;
  hsn?: string;
}

// ✅ NEW: Offer qualification details
export interface IInvoiceOfferQualification {
  offerId: Types.ObjectId | string;
  offerName: string;
  offerType: 'festival' | 'regular';
  festivalSubType?: 'hitCounter' | 'amountBased';
  regularSubType?: 'visitCount' | 'purchaseAmount';
  qualified: boolean;
  prizeName?: string;
  prizeRank?: 'first' | 'second' | 'third';
  position?: number; // For hit counter: position in queue (e.g., 5th customer)
  progressToQualify?: string; // e.g., "Need 3 more visits"
}

export interface IInvoice {
  _id: string;
  invoiceNumber: string;
  customer: ICustomer | Types.ObjectId | string;
  items: IInvoiceItem[];
  subtotal: number;
  discount: number;
  packingChargeDiscount: number;
  gstAmount: number;
  totalPayable: number;
  paymentMethod: 'cash' | 'upi' | 'card';
  createdAt: Date;
  updatedAt: Date;
  billedBy: Partial<IUser> | Types.ObjectId | string;
  status: 'active' | 'cancelled';
  offerQualifications?: IInvoiceOfferQualification[]; // ✅ NEW
}

const InvoiceItemSchema: Schema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  variantId: { type: Types.ObjectId, ref: 'Variant', required: true },
  mrp: { type: Number },
  gstRate: { type: Number },
  hsn: { type: String },
}, { _id: false });

// ✅ NEW: Offer qualification schema
const OfferQualificationSchema: Schema = new Schema({
  offerId: { type: Types.ObjectId, ref: 'Offer', required: true },
  offerName: { type: String, required: true },
  offerType: { type: String, enum: ['festival', 'regular'], required: true },
  festivalSubType: { type: String, enum: ['hitCounter', 'amountBased'] },
  regularSubType: { type: String, enum: ['visitCount', 'purchaseAmount'] },
  qualified: { type: Boolean, required: true },
  prizeName: { type: String },
  prizeRank: { type: String, enum: ['first', 'second', 'third'] },
  position: { type: Number },
  progressToQualify: { type: String },
}, { _id: false });

const InvoiceSchema: Schema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: Types.ObjectId, ref: 'Customer', required: true },
  items: [InvoiceItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  packingChargeDiscount: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  totalPayable: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'card'], required: true },
  billedBy: { type: Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
  offerQualifications: [OfferQualificationSchema], // ✅ NEW
}, { timestamps: true });

const Invoice = mongoose.models.Invoice || mongoose.model<IInvoice & Document>('Invoice', InvoiceSchema);

export default Invoice;

