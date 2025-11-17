// src/lib/models/user.ts

import mongoose, { Schema, Model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

// ✅ Interface
export interface IUser extends Document {
  _id: Types.ObjectId;
  personalEmail?: string;
  email: string;
  password?: string;
  role: "admin" | "cashier";
  isAdminInitialSetupComplete?: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  isPasswordResetRequested?: boolean;
  // Cashier fields
  name?: string;
  aadhaar?: string;
  phone?: string;
  storeLocation?: string;
  status?: "active" | "inactive";
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ✅ Schema definition
const userSchema: Schema<IUser> = new Schema(
  {
    personalEmail: {
      type: String,
      required: function (this: IUser) {
        return this.role === "cashier";
      },
      unique: false,
      lowercase: true,
      trim: true,
      sparse: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function (this: IUser) {
        // Admins require password after initial setup
        return (
          (this.role === "admin" && this.isAdminInitialSetupComplete === true) ||
          this.role === "cashier"
        );
      },
      minlength: [6, "Password must be at least 6 characters long"],
    },

    role: {
      type: String,
      enum: ["admin", "cashier"],
      required: true,
    },

    isAdminInitialSetupComplete: {
      type: Boolean,
      default: false,
    },

    passwordResetToken: String,
    passwordResetExpires: Date,
    isPasswordResetRequested: {
      type: Boolean,
      default: false,
    },

    name: {
      type: String,
      required: function (this: IUser) {
        return this.role === "cashier";
      },
    },

    aadhaar: {
      type: String,
      required: function (this: IUser) {
        return this.role === "cashier";
      },
      unique: true,
      length: 12,
      sparse: true,
    },

    phone: {
      type: String,
      required: function (this: IUser) {
        return this.role === "cashier";
      },
      minlength: 10,
    },

    storeLocation: {
      type: String,
      required: function (this: IUser) {
        return this.role === "cashier";
      },
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// ✅ Password Hashing Hook
userSchema.pre("save", async function (next) {
  const user = this as IUser;

  // Only hash if password field changed and it's a valid string
  if (user.isModified("password") && typeof user.password === "string") {
    try {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      return next();
    } catch (error: unknown) {
      if (error instanceof Error) {
        return next(error);
      }
      return next(
        new Error(`Unknown error in user pre-save hook: ${String(error)}`)
      );
    }
  }

  next();
});

// ✅ Password Comparison Method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// ✅ Model Export Helper
export function getUserModel(): Model<IUser> {
  return (
    (mongoose.models.User as Model<IUser>) ||
    mongoose.model<IUser>("User", userSchema)
  );
}
