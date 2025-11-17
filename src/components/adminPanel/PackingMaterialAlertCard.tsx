// src/components/adminPanel/dashboard/PackingMaterialAlertCard.tsx
"use client";

import { useEffect } from "react";
import { usePackingAlertStore } from "@/store/packingAlert.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Package, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// 💡 FIX: Set a shorter interval for better visibility, but keep it outside the render loop
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function PackingMaterialAlertCard() {
  const { 
    lowStockMaterials, 
    isLoading, 
    fetchLowStockMaterials,
    lastFetched // 💡 Use lastFetched to control initial fetch
  } = usePackingAlertStore();

  // --- Initial Fetch on Mount ---
  // This runs only once when the component mounts.
  useEffect(() => {
    // If the data has never been fetched (lastFetched is null), fetch it now.
    // This provides a fallback if the parent component forgets to call it.
    if (lastFetched === null) {
        fetchLowStockMaterials();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // --- Periodic Refresh Interval ---
  useEffect(() => {
    // Start the interval for periodic refresh
    const interval = setInterval(() => {
        // Fetch data periodically
        fetchLowStockMaterials();
    }, REFRESH_INTERVAL_MS); 
    
    // Cleanup the interval when the component unmounts
    return () => clearInterval(interval);
  }, [fetchLowStockMaterials]); // fetchLowStockMaterials is stable from Zustand

  const alertCount = lowStockMaterials.length;

  return (
    <Card className={alertCount > 0 ? "border-red-500 shadow-lg shadow-red-500/20" : "border-green-500"}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Packing Material Alerts
        </CardTitle>
        <Package className="h-5 w-5 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          ) : (
            <>
              {alertCount} 
              {alertCount > 0 && <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse" />}
            </>
          )}
        </div>
        
        {alertCount > 0 ? (
          <p className="text-xs text-red-500 mt-1">
            {alertCount} items are running low or out of stock.
          </p>
        ) : (
          <p className="text-xs text-green-500 mt-1">
            All packing materials are currently well-stocked.
          </p>
        )}
        
        <ul className="mt-3 space-y-1 text-sm text-gray-400 max-h-40 overflow-y-auto">
            {lowStockMaterials.slice(0, 5).map(material => (
                <li key={material._id.toString()} className="flex justify-between items-center text-red-300">
                    <span className="truncate">{material.name}</span>
                    <span className="font-semibold text-right shrink-0">
                        Stock: {material.balance}
                    </span>
                </li>
            ))}
            {alertCount > 5 && (
                <li className="text-xs text-center pt-1 text-yellow-300">
                    +{alertCount - 5} more items...
                </li>
            )}
        </ul>

        <div className="mt-4">
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/admin/packingProds">
                    Manage Materials
                </Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}