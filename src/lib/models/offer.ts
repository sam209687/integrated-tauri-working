// src/lib/models/offer.ts

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPrize {
  rank: 'first' | 'second' | 'third';
  prizeName: string;
  imageUrl: string;
}

export interface IOfferBase {
  _id: string;
  product: Types.ObjectId;
  offerType: 'festival' | 'regular';
  startDate: Date;
  endDate: Date;
  status: 'active' | 'inactive' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// Festival Offer Types
export interface IFestivalHitCounterOffer extends IOfferBase {
  offerType: 'festival';
  festivalSubType: 'hitCounter';
  festivalName: string;
  customerLimit: number; // e.g., 50 customers
  prizes: IPrize[];
  winners?: {
    rank: 'first' | 'second' | 'third';
    invoiceId: Types.ObjectId;
    customerName: string;
    mobileNumber: string;
    announcedAt?: Date;
  }[];
}

export interface IFestivalAmountOffer extends IOfferBase {
  offerType: 'festival';
  festivalSubType: 'amountBased';
  festivalName: string;
  minimumAmount: number; // e.g., 1000
  prizeName: string;
  prizeImageUrl: string;
  eligibleInvoices?: Types.ObjectId[];
}

// Regular Offer Types
export interface IRegularVisitCountOffer extends IOfferBase {
  offerType: 'regular';
  regularSubType: 'visitCount';
  visitCount: number; // e.g., 10 visits
  prizeName: string;
  prizeImageUrl: string;
  eligibleCustomers?: {
    mobileNumber: string;
    customerName: string;
    visitCount: number;
  }[];
}

export interface IRegularPurchaseAmountOffer extends IOfferBase {
  offerType: 'regular';
  regularSubType: 'purchaseAmount';
  targetAmount: number; // e.g., 5000
  prizeName: string;
  prizeImageUrl: string;
  eligibleCustomers?: {
    mobileNumber: string;
    customerName: string;
    totalAmount: number;
  }[];
}

export type IOffer =
  | IFestivalHitCounterOffer
  | IFestivalAmountOffer
  | IRegularVisitCountOffer
  | IRegularPurchaseAmountOffer;

const PrizeSchema = new Schema({
  rank: { 
    type: String, 
    enum: ['first', 'second', 'third'], 
    required: true 
  },
  prizeName: { type: String, required: true },
  imageUrl: { type: String, required: true },
}, { _id: false });

const WinnerSchema = new Schema({
  rank: { 
    type: String, 
    enum: ['first', 'second', 'third'], 
    required: true 
  },
  invoiceId: { type: Types.ObjectId, ref: 'Invoice', required: true },
  customerName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  announcedAt: { type: Date },
}, { _id: false });

const EligibleCustomerSchema = new Schema({
  mobileNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  visitCount: { type: Number },
  totalAmount: { type: Number },
}, { _id: false });

const OfferSchema: Schema = new Schema({
  product: { 
    type: Types.ObjectId, 
    ref: 'Variant', 
    required: true 
  },
  offerType: { 
    type: String, 
    enum: ['festival', 'regular'], 
    required: true 
  },
  
  // Festival fields
  festivalSubType: { 
    type: String, 
    enum: ['hitCounter', 'amountBased'],
  },
  festivalName: { type: String },
  customerLimit: { type: Number },
  minimumAmount: { type: Number },
  prizes: [PrizeSchema],
  winners: [WinnerSchema],
  
  // Regular fields
  regularSubType: { 
    type: String, 
    enum: ['visitCount', 'purchaseAmount'],
  },
  visitCount: { type: Number },
  targetAmount: { type: Number },
  prizeName: { type: String },
  prizeImageUrl: { type: String },
  eligibleCustomers: [EligibleCustomerSchema],
  eligibleInvoices: [{ type: Types.ObjectId, ref: 'Invoice' }],
  
  // Common fields
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'completed'], 
    default: 'active' 
  },
}, { timestamps: true });

// Index for better query performance
OfferSchema.index({ product: 1, offerType: 1, status: 1 });
OfferSchema.index({ startDate: 1, endDate: 1 });

const Offer = mongoose.models.Offer || mongoose.model<IOffer & Document>('Offer', OfferSchema);

export default Offer;