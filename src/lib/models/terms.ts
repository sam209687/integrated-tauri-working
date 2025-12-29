// src/lib/models/terms.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITerms extends Document {
  _id: string;
  terms: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TermsSchema: Schema = new Schema(
  {
    terms: {
      type: String,
      required: [true, 'Terms and conditions text is required.'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Ensure only one active terms document exists
TermsSchema.pre('save', async function (next) {
  if (this.isActive) {
    // Deactivate all other terms
    await mongoose.model('Terms').updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

const Terms = mongoose.models.Terms || mongoose.model<ITerms>('Terms', TermsSchema);

export default Terms;