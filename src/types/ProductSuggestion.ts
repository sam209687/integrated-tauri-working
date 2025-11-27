// src/types/ProductSuggestion.ts

export interface ProductSuggestion {
  _id: string;
  // Made optional to satisfy the store's output (which is missing 'name')
  name?: string; 
  variantVolume: string;
  price: number;

  // New flattened fields
  productName: string;
  unitName: string;

  // Nested 'product' and 'unit' fields are removed.
}