// src/lib/models/store.ts
import mongoose, { Schema, Document, model, models } from "mongoose";

/**
 * IStore - exported interface (use `import type { IStore } from "@/lib/models/store"`)
 */
export interface IStore extends Document {
  storeName: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  contactNumber: string;
  email: string;
  fssai?: string;
  pan?: string;
  gst?: string;
  logo?: string;
  qrCode?: string;
  mediaUrl?: string;
  mediaQRCode?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema & model
 */
const StoreSchema = new Schema<IStore>(
  {
    storeName: { type: String, required: [true, "Store name is required"], trim: true },
    address: { type: String, required: [true, "Address is required"], trim: true },
    city: { type: String, required: [true, "City is required"], trim: true },
    pincode: { type: String, required: [true, "Pincode is required"] },
    state: { type: String, required: [true, "State is required"], trim: true },
    contactNumber: { type: String, required: [true, "Contact number is required"] },
    email: { type: String, required: [true, "Email is required"] },

    // optional metadata
    fssai: { type: String, trim: true },
    pan: { type: String, trim: true },
    gst: { type: String, trim: true },

    // media & codes
    logo: { type: String },
    qrCode: { type: String },
    mediaUrl: { type: String, trim: true },
    mediaQRCode: { type: String },

    // status
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "INACTIVE",
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * Pre-save hook: ensure only one store can be ACTIVE
 */
StoreSchema.pre("save", async function (next) {
  // `this` is the document being saved
  if (this.isModified("status") && this.status === "ACTIVE") {
    // mark other stores as INACTIVE
    await (this.constructor as mongoose.Model<IStore>).updateMany(
      { _id: { $ne: this._id } },
      { $set: { status: "INACTIVE" } }
    );
  }
  next();
});

/**
 * Export the model as the default export.
 * Use mongoose.models caching to avoid OverwriteModelError in dev/hot-reload.
 */
const Store = (models.Store as mongoose.Model<IStore>) || model<IStore>("Store", StoreSchema);
export default Store;
