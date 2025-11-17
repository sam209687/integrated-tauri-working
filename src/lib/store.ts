// src/lib/store.ts
import { create } from "zustand";
import { IBrand } from "./models/brand";

interface BrandState {
  brands: IBrand[];
  setBrands: (newBrands: IBrand[]) => void;
  addBrand: (brand: IBrand) => void;
  deleteBrand: (_id: string) => void;
  updateBrand: (brand: IBrand) => void;
}

export const useBrandStore = create<BrandState>((set) => ({
  brands: [],
  setBrands: (newBrands) => set({ brands: newBrands }),
  addBrand: (brand) => set((state) => ({ brands: [...state.brands, brand] })),
  deleteBrand: (_id) =>
    set((state) => ({
      brands: state.brands.filter((b) => b._id !== _id),
    })),
  updateBrand: (updatedBrand) =>
    set((state) => ({
      brands: state.brands.map((brand) =>
        brand._id === updatedBrand._id ? updatedBrand : brand
      ),
    })),
}));
