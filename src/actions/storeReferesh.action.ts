"use server";

import { getSalesDataByVariant } from "@/actions/sales.actions";
import { getSalesMetrics } from "@/actions/salesTracking.actions";
import { getFinancialMetrics } from "@/actions/invoice.actions";

import { subDays, startOfDay, endOfDay } from "date-fns";

export async function getAllStoreDashboardData(
  fromDate?: Date,
  toDate?: Date
) {
  try {
    const start = fromDate || startOfDay(subDays(new Date(), 7));
    const end = toDate || endOfDay(new Date());

    const [salesResult, metricsResult, financeResult] = await Promise.all([
      getSalesDataByVariant(start, end),
      getSalesMetrics(start, end),
      getFinancialMetrics(start, end),
    ]);

    return {
      success: true,
      data: {
        salesResult,
        metricsResult,
        financeResult,
      },
    };
  } catch (err) {
    console.error("❌ getAllStoreDashboardData error:", err);
    return { success: false, error: "Failed to fetch store dashboard data" };
  }
}
