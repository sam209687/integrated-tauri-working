import { NextResponse } from "next/server";
// 💡 FIX: Removed unused import 'mongoose'
import Invoice from "@/lib/models/invoice"; // Adjust the path to your Invoice model
import { connectToDatabase } from "@/lib/db";

// Define the handler for GET requests
export async function GET() {
  try {
    // 1. Connect to the database
    await connectToDatabase();

    const currentYear = new Date().getFullYear();

    // 2. Mongoose Aggregation Pipeline
    const monthlySales = await Invoice.aggregate([
      {
        $match: {
          // Filter invoices only for the current year
          createdAt: {
            $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
            $lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" }, // Group by month number
          totalInvoice: { $sum: 1 }, // Count
          salesAmount: { $sum: "$subtotal" }, // Sum the total sales
        },
      },
      {
        $sort: { _id: 1 }, // Sort by month number
      },
      {
        $project: {
          _id: 0,
          // Convert month number to a readable abbreviation
          month: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 1] }, then: "Jan" },
                { case: { $eq: ["$_id", 2] }, then: "Feb" },
                // Add all 12 months for completeness
                { case: { $eq: ["$_id", 3] }, then: "Mar" },
                { case: { $eq: ["$_id", 4] }, then: "Apr" },
                { case: { $eq: ["$_id", 5] }, then: "May" },
                { case: { $eq: ["$_id", 6] }, then: "Jun" },
                { case: { $eq: ["$_id", 7] }, then: "Jul" },
                { case: { $eq: ["$_id", 8] }, then: "Aug" },
                { case: { $eq: ["$_id", 9] }, then: "Sep" },
                { case: { $eq: ["$_id", 10] }, then: "Oct" },
                { case: { $eq: ["$_id", 11] }, then: "Nov" },
                { case: { $eq: ["$_id", 12] }, then: "Dec" },
              ],
              default: "Unknown",
            },
          },
          totalInvoice: 1,
          salesAmount: 1,
        },
      },
    ]);

    // 3. Return a successful response with the data
    return NextResponse.json(
      { success: true, data: monthlySales },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error: Monthly Sales Aggregation failed:", error);
    // 4. Return an error response
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch monthly sales data due to a server error.",
      },
      { status: 500 }
    );
  }
}