// src/app/(admin)/admin/dashboard/page.tsx

import { DashboardPage } from "@/components/adminPanel/DashboardPage";
import { getDashboardData } from "@/actions/adminPanel.Actions";
import { DashboardData } from "@/store/adminPanelStore";

// ✅ Prevent Next.js from trying to statically render this page (fixes “Unexpected token '|'”)
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Dashboard() {
  const dashboardData = await getDashboardData();

  if (!dashboardData.success) {
    return <div>Error: {dashboardData.message}</div>;
  }

  // ✅ Ensure the data type is consistent and serializable
  const initialDataForProps: DashboardData | null = dashboardData.data
    ? JSON.parse(JSON.stringify(dashboardData.data))
    : null;

  return (
    <div className="flex flex-col space-y-4">
      <DashboardPage initialData={initialDataForProps} />
    </div>
  );
}
