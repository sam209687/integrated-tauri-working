import { getStores } from "@/actions/store.actions";
import { columns } from "@/app/(admin)/admin/store-settings/columns";
import { StoreTable } from "@/components/tables/storeTable"; 
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// ✅ Force dynamic rendering to avoid static serialization errors
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const StoreSettingsPage = async () => {
  const result = await getStores();

  if (!result.success) {
    return <div>Failed to load store settings.</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading
          title="Store Settings"
          description="Manage your store details and settings."
        />
        <Button asChild>
          <Link href="/admin/store-settings/add-store">
            <Plus className="mr-2 h-4 w-4" /> Add Store
          </Link>
        </Button>
      </div>
      <Separator />
      <StoreTable
        columns={columns}
        data={result.data || []}
        searchKey="storeName"
      />
    </div>
  );
};

export default StoreSettingsPage;
