// src/store/product.store.ts

import { create } from "zustand";
import { IPopulatedProduct } from "@/lib/models/product";
import { ICategory } from "@/lib/models/category";
import { IBrand } from "@/lib/models/brand";
import { ITax } from "@/lib/models/tax";
import { IUnit } from "@/lib/models/unit";

import {
  getProducts,
  getCategories,
  getBrands,
  getTaxes,
  getUnits,
  getUnitsForSellingType,
} from "@/actions/product.actions";
import { getCurrencySymbol } from "@/actions/currency.actions";
import { toast } from "sonner";

interface ProductStoreState {
  products: IPopulatedProduct[];
  categories: ICategory[];
  brands: IBrand[];
  taxes: ITax[];
  units: IUnit[];
  filteredUnits: IUnit[];
  isLoading: boolean;
  currencySymbol: string;

  fetchProducts: () => Promise<void>;
  fetchFormData: () => Promise<void>;
  fetchUnitsForSellingType: (sellingType: "FIXED" | "WEIGHT" | "VOLUME" | "VALUE") => Promise<void>;

  addProduct: (product: IPopulatedProduct) => void;
  updateProduct: (product: IPopulatedProduct) => void;
  removeProduct: (productId: string) => void;
}

// ✅ Helper to convert MongoDB objects to plain JSON
function toPlainObject<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export const useProductStore = create<ProductStoreState>((set, get) => ({
  products: [],
  categories: [],
  brands: [],
  taxes: [],
  units: [],
  filteredUnits: [],
  isLoading: false,
  currencySymbol: "₹",

  fetchProducts: async () => {
    set({ isLoading: true });
    try {
      const result = await getProducts();
      if (result.success && result.data) {
        // ✅ Convert to plain objects
        set({ products: toPlainObject(result.data) });
      } else {
        toast.error(result.message || "Failed to fetch products");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching products");
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFormData: async () => {
    set({ isLoading: true });
    try {
      const [cat, brand, tax, unit, currency] = await Promise.all([
        getCategories(),
        getBrands(),
        getTaxes(),
        getUnits(),
        getCurrencySymbol(),
      ]);

      // ✅ Convert all to plain objects
      set({
        categories: cat.success ? toPlainObject(cat.data || []) : [],
        brands: brand.success ? toPlainObject(brand.data || []) : [],
        taxes: tax.success ? toPlainObject(tax.data || []) : [],
        units: unit.success ? toPlainObject(unit.data || []) : [],
        currencySymbol: currency.success ? currency.data || "₹" : "₹",
      });
    } catch (err) {
      console.error(err);
      toast.error("Error fetching form data");
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnitsForSellingType: async (sellingType) => {
    try {
      const result = await getUnitsForSellingType(sellingType);
      if (result.success && result.data) {
        // ✅ Convert to plain objects
        set({ filteredUnits: toPlainObject(result.data) });
      } else {
        const allUnits = get().units;
        set({ filteredUnits: allUnits });
      }
    } catch (err) {
      console.error(err);
      const allUnits = get().units;
      set({ filteredUnits: allUnits });
    }
  },

  addProduct: (product) =>
    set((state) => ({ products: [...state.products, toPlainObject(product)] })),
    
  updateProduct: (product) =>
    set((state) => ({
      products: state.products.map((p) =>
        p._id === product._id ? toPlainObject(product) : p
      ),
    })),
    
  removeProduct: (productId) =>
    set((state) => ({
      products: state.products.filter((p) => p._id !== productId),
    })),
}));