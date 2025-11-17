"use client";

import React, { useState, useEffect } from "react";
import { CashierSidebarContent } from "./_components/CashierSidebarContent";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { PrintPreview } from "@/components/pos/PrintPreview";
import { useStoreDetailsStore } from "@/store/storeDetails.store";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { fetchActiveStore } = useStoreDetailsStore();

  // ✅ Load active store info (for logo display, etc.)
  useEffect(() => {
    fetchActiveStore();
  }, [fetchActiveStore]);

  // Toggle handlers
  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);
  const toggleMobileSidebar = () => setIsMobileSidebarOpen((prev) => !prev);

  // Widths and offsets
  const sidebarWidth = isSidebarCollapsed ? "lg:w-20" : "lg:w-64";
  const mainMargin = isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64";

  return (
    <AuthGuard role="cashier">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative">
        {/* ===== Mobile Toggle Button ===== */}
        <div className="fixed top-3 left-3 z-50 lg:hidden">
          <Button
            size="icon"
            variant="outline"
            className="bg-white dark:bg-gray-900 shadow-md"
            onClick={toggleMobileSidebar}
          >
            {isMobileSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* ===== Desktop Sidebar (Fixed) ===== */}
        <aside
          className={cn(
            "hidden lg:fixed lg:top-0 lg:left-0 lg:h-full lg:flex lg:flex-col transition-all duration-300 ease-in-out z-40",
            sidebarWidth
          )}
        >
          <CashierSidebarContent
            isCollapsed={isSidebarCollapsed}
            onToggle={toggleSidebar}
          />
        </aside>

        {/* ===== Mobile Sidebar Overlay ===== */}
        {isMobileSidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
              onClick={toggleMobileSidebar}
            />
            <aside
              className={cn(
                "fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out",
                isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
              )}
            >
              <CashierSidebarContent
                isCollapsed={false}
                onToggle={toggleMobileSidebar}
              />
            </aside>
          </>
        )}

        {/* ===== Main Content ===== */}
        <main
          className={cn(
            "min-h-screen transition-all duration-300 ease-in-out flex flex-col p-4",
            mainMargin
          )}
        >
          <QueryProvider>{children}</QueryProvider>
        </main>

        {/* ===== Print Preview (Always on top) ===== */}
        <PrintPreview />
      </div>
    </AuthGuard>
  );
}
