// src/actions/customer.actions.ts
'use server';

import { connectToDatabase } from '@/lib/db';
import Customer, { ICustomer } from '@/lib/models/customer';
import { customerSchema } from "@/lib/schemas"; 
import { z } from "zod";
import { revalidatePath } from "next/cache"; 
import { format } from 'date-fns';

// ----------------------------------------------------------------------
// Types and Interfaces
// ----------------------------------------------------------------------

interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface CustomerPayload {
  phone: string;
  name: string;
  address: string;
}

export interface DashboardCustomer {
  _id: string;
  phone: string;
  name: string;
  address: string;
  date: string;
}

interface CustomerLean {
  _id: object;
  phone: string;
  name: string;
  address: string;
  createdAt: Date;
}

// ----------------------------------------------------------------------
// Core Actions
// ----------------------------------------------------------------------

/**
 * @title Create Customer Action
 */
export const createCustomer = async (
  data: CustomerPayload
): Promise<ActionResponse<ICustomer>> => {
  try {
    const validatedData = customerSchema.parse(data);

    await connectToDatabase();

    const existingCustomer = await Customer.findOne({ phone: validatedData.phone });

    if (existingCustomer) {
      return {
        success: true,
        data: JSON.parse(JSON.stringify(existingCustomer)),
        message: "Customer already exists and was selected.",
      };
    }

    const newCustomer = await Customer.create(validatedData);

    revalidatePath("/admin/customers");
    revalidatePath("/pos");

    return {
      success: true,
      data: JSON.parse(JSON.stringify(newCustomer)),
      message: "Customer created successfully!",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message, error: "Validation failed." };
    }
    console.error("CREATE CUSTOMER SERVER ERROR:", error);
    return { success: false, message: "Failed to create customer.", error: "Server error." };
  }
};

/**
 * @title Search Customers By Phone Prefix
 */
export const searchCustomersByPhonePrefix = async (
  prefix: string
): Promise<ActionResponse<ICustomer[]>> => {
  try {
    await connectToDatabase();

    const customers = await Customer.find({
      phone: { $regex: `^${prefix}` },
    })
      .select("phone name address")
      .limit(5)
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(customers)) };
  } catch (error) {
    console.error("SEARCH CUSTOMERS SERVER ERROR:", error);
    return { success: false, message: "Failed to search customers.", error: "Server error." };
  }
};

/**
 * @title Get Latest Customers and Count (for dashboard)
 */
export async function getLatestCustomersAndCount(): Promise<{
  success: boolean;
  data: {
    newCustomers: DashboardCustomer[];
    totalCount: number;
  } | null;
  message?: string;
}> {
  try {
    await connectToDatabase();

    const totalCount = await Customer.countDocuments({});
    const rawCustomers = await Customer.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<CustomerLean[]>();

    const formattedCustomers: DashboardCustomer[] = rawCustomers.map((c: CustomerLean) => ({
      _id: c._id.toString(),
      name: c.name,
      phone: c.phone,
      address: c.address || "N/A",
      date: format(c.createdAt, "MMM d, yyyy"),
    }));

    return {
      success: true,
      data: {
        newCustomers: formattedCustomers,
        totalCount,
      },
    };
  } catch (error) {
    console.error("Database Error: Failed to fetch customer data:", error);
    return { success: false, data: null, message: "Failed to fetch customer data." };
  }
}

/**
 * ✅ NEW: Get Customer Details (for adminRefresh.ts)
 * Mirrors your dashboard data structure
 */
export async function getCustomerDetails(): Promise<{
  success: boolean;
  data?: {
    totalCustomers: number;
    recentCustomers: DashboardCustomer[];
  };
  message?: string;
}> {
  try {
    await connectToDatabase();

    const totalCustomers = await Customer.countDocuments({});
    const rawCustomers = await Customer.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<CustomerLean[]>();

    const recentCustomers: DashboardCustomer[] = rawCustomers.map((c: CustomerLean) => ({
      _id: c._id.toString(),
      name: c.name,
      phone: c.phone,
      address: c.address || "N/A",
      date: format(c.createdAt, "MMM d, yyyy"),
    }));

    return {
      success: true,
      data: {
        totalCustomers,
        recentCustomers,
      },
    };
  } catch (error) {
    console.error("❌ getCustomerDetails Error:", error);
    return {
      success: false,
      message: "Failed to retrieve customer details.",
      data: { totalCustomers: 0, recentCustomers: [] },
    };
  }
}
