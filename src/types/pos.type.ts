// src/types/pos.types.ts
// Unified type system for all POS components

export interface IPosProduct {
  _id: string;
  productName: string;
  productCode: string;
  brand?: {
    _id: string;
    name: string;
  };
  category?: {
    _id: string;
    name: string;
  };
  tax?: {
    _id: string;
    gst: number;
    hsn?: string;
  };
}

export interface IPosUnit {
  _id: string;
  name: string;
}

// Main POS variant type - Extended from existing structure
export interface IPosVariant {
  _id: string;
  product: IPosProduct;
  variantVolume: number;
  unit: IPosUnit;
  unitConsumed?: number;
  unitConsumedUnit?: string;
  variantColor?: string;
  
  // Price fields
  price: number;              // Main selling price
  sellingPrice?: number;      // Alias/backup
  perUnitPrice: number;       // Calculated: price / variantVolume
  mrp?: number;
  discount?: number;
  
  // Stock
  stockQuantity: number;
  stockAlertQuantity: number;
  
  // Media
  image?: string;
  qrCode?: string;
  
  // Charges
  packingCharges?: number;
  laborCharges?: number;
  electricityCharges?: number;
  others1?: number;
  others2?: number;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  
  // Optional runtime fields for cart operations
  quantity?: number;
  type?: "variant" | "oec";
  
  // Retail billing metadata (runtime only)
  retailBillingData?: {
    originalQuantity: number;
    displayQuantity: string;
    perUnitPrice: number;
  };
}

// Cart item type
export interface IPosCartItem {
  _id: string;
  quantity: number;
  price: number;
  product: {
    productName: string;
    productCode?: string;
    tax?: {
      _id?: string;
      gst: number;
      hsn?: string;  // Made optional to match IPosProduct
    };
  };
  mrp?: number;
  discountPercentage?: number;
  variantVolume?: number;
  unit?: IPosUnit;
  variantColor?: string;
  type: "variant" | "oec";
  
  // Retail billing metadata
  retailBillingData?: {
    originalQuantity: number;
    displayQuantity: string;
    perUnitPrice: number;
  };
}

// OEC item type
export interface IOecCartItem {
  productName: string;
  quantity: number;
  price: number;
}