// src/actions/adminPanel.Actions.ts
"use server";


export interface ITransaction {
  name: string;
  date: string;
  type: "Withdrawal" | "Deposit";
  amount: number;
  status: "Complete" | "Pending";
}

interface DashboardData {
  totalBalance: number;
  totalSales: number;
  analyticsPerformance: { year: string; sales: number; }[];
  saleOverview: { month: string; sales: number; }[];
  income: number;
  expense: number;
  transactionHistory: ITransaction[];
}

const mockDashboardData: DashboardData = {
  totalBalance: 50000,
  totalSales: 1534,
  analyticsPerformance: [
    { year: "2022", sales: 18000 },
    { year: "2023", sales: 25000 },
    { year: "2024", sales: 30000 },
    { year: "2025", sales: 50000 },
  ],
  saleOverview: [
    { month: "Jan", sales: 20 },
    { month: "Feb", sales: 30 },
    { month: "Mar", sales: 15 },
    { month: "Apr", sales: 40 },
    { month: "May", sales: 25 },
    { month: "Jun", sales: 35 },
    { month: "Jul", sales: 45 },
    { month: "Aug", sales: 50 },
    { month: "Sep", sales: 40 },
    { month: "Oct", sales: 30 },
    { month: "Nov", sales: 20 },
    { month: "Dec", sales: 10 },
  ],
  income: 50000,
  expense: 50000,
  transactionHistory: [
    { name: "John Smith", date: "20 May, 20XX", type: "Withdrawal", amount: 6000, status: "Complete" },
    { name: "John Smith", date: "20 May, 20XX", type: "Withdrawal", amount: 6000, status: "Pending" },
  ],
};

export async function getDashboardData() {
  try {
    // In a real application, you would fetch data from your database here.
    return { success: true, data: mockDashboardData };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return { success: false, message: "Failed to fetch dashboard data." };
  }
}