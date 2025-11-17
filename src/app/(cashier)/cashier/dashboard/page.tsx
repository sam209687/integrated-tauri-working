import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// ✅ Force dynamic rendering so auth runs properly on the server
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function CashierDashboardPage() {
  // ✅ Check session
  const session = await auth();

  // 🚫 Redirect to login if not authenticated or not a cashier
  if (!session || session.user.role !== "cashier") {
    redirect("/auth");
  }

  // ✅ Automatically redirect logged-in cashier directly to POS
  redirect("/cashier/pos");
}
