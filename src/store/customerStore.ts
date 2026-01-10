// src/store/customerStore.ts

import { create } from 'zustand';
import { toast } from 'sonner';

import { ICustomer } from '@/lib/models/customer'; 

import { 
    createCustomer as createCustomerAction, 
    searchCustomersByPhonePrefix as searchCustomersAction,
    searchCustomersByName as searchCustomersByNameAction
} from '@/actions/customer.actions'; 

import { getInvoiceCountByCustomer } from '@/actions/invoice.actions'; 


interface CustomerState {
  phone: string;
  name: string;
  address: string;
  customer: ICustomer | null; 
  suggestions: ICustomer[];
  isCustomerFound: boolean;
  isLoading: boolean;
  visitCount: number;
  
  setPhone: (phone: string) => void;
  setName: (name: string) => void;
  setAddress: (address: string) => void;
  searchCustomersByPhonePrefix: (prefix: string) => Promise<void>; 
  searchCustomersByName: (searchTerm: string) => Promise<void>; // ✅ NEW
  selectCustomer: (selectedCustomer: ICustomer) => Promise<void>; 
  createCustomer: () => Promise<void>;
  resetCustomer: () => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  phone: '',
  name: '',
  address: '',
  customer: null,
  suggestions: [],
  isCustomerFound: false,
  isLoading: false,
  visitCount: 0,

  setPhone: (phone) => set({ phone }),
  setName: (name) => set({ name }),
  setAddress: (address) => set({ address }),

  searchCustomersByPhonePrefix: async (prefix) => {
    if (prefix.length < 3) {
        set({ suggestions: [] });
        return;
    }

    set({ isLoading: true });
    try {
      const result = await searchCustomersAction(prefix);

      if (result.success && result.data) {
        set({
          suggestions: result.data as ICustomer[],
          isLoading: false,
        });
      } else {
        set({ suggestions: [], isLoading: false });
      }
    } catch (error) {
      console.error("Error searching customers:", error);
      set({ isLoading: false });
      toast.error("Error searching for customer suggestions.");
    }
  },

  // ✅ NEW: Search customers by name
  searchCustomersByName: async (searchTerm) => {
    if (searchTerm.trim().length < 2) {
        set({ suggestions: [] });
        return;
    }

    set({ isLoading: true });
    try {
      const result = await searchCustomersByNameAction(searchTerm);

      if (result.success && result.data) {
        set({
          suggestions: result.data as ICustomer[],
          isLoading: false,
        });
      } else {
        set({ suggestions: [], isLoading: false });
      }
    } catch (error) {
      console.error("Error searching customers by name:", error);
      set({ isLoading: false });
      toast.error("Error searching for customer by name.");
    }
  },

  selectCustomer: async (selectedCustomer) => {
    const countResult = await getInvoiceCountByCustomer(selectedCustomer._id);

    set({
      phone: selectedCustomer.phone,
      name: selectedCustomer.name,
      address: selectedCustomer.address || '',
      customer: selectedCustomer,
      isCustomerFound: true,
      suggestions: [],
      visitCount: countResult.success ? countResult.data : 0,
    });
    toast.success(`Customer selected: ${selectedCustomer.name}`);
  },

  createCustomer: async () => {
    const { phone, name, address, selectCustomer } = get(); 
    
    if (phone.length !== 10 || name.trim().length < 2) {
        toast.error("Please enter a valid 10-digit phone number and name.");
        return;
    }
    
    set({ isLoading: true });
    
    const dataToSend = { phone, name, address };
    
    try {
        const result = await createCustomerAction(dataToSend);
        
        if (result.success && result.data) {
            await selectCustomer(result.data as ICustomer);
            toast.success(result.message || "Customer added/selected successfully!");
        } else {
            toast.error(result.message || "Failed to add customer.");
        }
    } catch (error) {
        toast.error("An unexpected error occurred while adding the customer.");
        console.error("CREATE CUSTOMER CLIENT ERROR:", error);
    } finally {
        set({ isLoading: false });
    }
  },

  resetCustomer: () => set({ 
    phone: '', 
    name: '', 
    address: '', 
    customer: null, 
    isCustomerFound: false, 
    suggestions: [], 
    visitCount:0 
  }),
}));