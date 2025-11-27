// src/lib/models/customer.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  _id: string;
  phone: string;
  name: string;
  telegramChatId?: string;
  address?: string;
}

const CustomerSchema: Schema = new Schema({
  phone: {
    type: String,
    required: [true, 'Phone number is required.'],
    unique: true,
    trim: true,
    match: [/^\d{10}$/, 'Phone number must be 10 digits.'],
  },
  name: {
    type: String,
    required: [true, 'Customer name is required.'],
    trim: true,
  },
  telegramChatId: { type: String },
  address: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

const Customer = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export default Customer;