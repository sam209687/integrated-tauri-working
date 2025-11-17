// src/store/customerDetails.store.ts
import { create } from 'zustand';
// 💡 Import the fixed interface from the action file
import { getLatestCustomersAndCount, DashboardCustomer } from '@/actions/customer.actions'; 

// 💡 FIX: Changed interface to type alias to resolve the empty-object-type error.
export type CustomerTableData = DashboardCustomer;

interface CustomerDetailsState {
    newCustomers: CustomerTableData[];
    totalCustomerCount: number;
    isLoading: boolean;
    error: string | null;
    fetchCustomerDetails: () => Promise<void>;
}

export const useCustomerDetailsStore = create<CustomerDetailsState>((set) => ({
    newCustomers: [],
    totalCustomerCount: 0,
    isLoading: false,
    error: null,

    fetchCustomerDetails: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await getLatestCustomersAndCount();

            if (result.success && result.data) {
                set({
                    newCustomers: result.data.newCustomers,
                    totalCustomerCount: result.data.totalCount,
                    isLoading: false,
                });
            } else {
                 set({ 
                    isLoading: false, 
                    error: result.message || 'Failed to fetch customer data.',
                    newCustomers: [],
                    totalCustomerCount: 0
                });
            }
        } catch (err) {
            console.error("Error fetching customer details:", err);
            set({ isLoading: false, error: 'An unexpected error occurred.' });
        }
    },
}));