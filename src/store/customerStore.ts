// src/store/customerStore.ts

import { create } from 'zustand';
import { toast } from 'sonner';

// ⚠️ ASSUMPTION: You need to import ICustomer from your models
import { ICustomer } from '@/lib/models/customer'; 

// ⚠️ ASSUMPTION: You need to import your customer actions
import { 
    createCustomer as createCustomerAction, 
    searchCustomersByPhonePrefix as searchCustomersAction 
} from '@/actions/customer.actions'; 

// ⚠️ ASSUMPTION: You need to import your invoice action for visit count
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
  selectCustomer: (selectedCustomer: ICustomer) => Promise<void>; 
  createCustomer: () => Promise<void>; // ✅ MODIFIED: Implemented below
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
      // ✅ MODIFIED: Use the imported server action instead of a direct API route call
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

  selectCustomer: async (selectedCustomer) => {
    // This is run when the user clicks a suggestion
    const countResult = await getInvoiceCountByCustomer(selectedCustomer._id);

    set({
      phone: selectedCustomer.phone,
      name: selectedCustomer.name,
      address: selectedCustomer.address || '',
      customer: selectedCustomer,
      isCustomerFound: true,
      suggestions: [], // Clear suggestions after selection
      visitCount: countResult.success ? countResult.data : 0,
    });
    toast.success(`Customer selected: ${selectedCustomer.name}`);
  },

  // ✅ FIX: Implementation for creating or confirming a customer
  createCustomer: async () => {
    const { phone, name, address, selectCustomer } = get(); 
    
    if (phone.length !== 10 || name.trim().length < 2) {
        toast.error("Please enter a valid 10-digit phone number and name.");
        return;
    }
    
    set({ isLoading: true });
    
    const dataToSend = { phone, name, address };
    
    try {
        // Calls the server action to CREATE the customer (or return existing one if found)
        const result = await createCustomerAction(dataToSend);
        
        if (result.success && result.data) {
            // Use the selectCustomer action to update all related state fields
            await selectCustomer(result.data as ICustomer);
            toast.success(result.message || "Customer added/selected successfully!");
        } else {
            toast.error(result.message || "Failed to add customer.");
        }
    } catch (error) {
        toast.error("An unexpected error occurred while adding the customer.");
        console.error("CREATE CUSTOMer CLIENT ERROR:", error);
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