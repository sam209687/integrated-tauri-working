"use client";

import React, { useState, useEffect } from "react";
import { AdminSidebarWrapper } from "@/components/admin/AdminSidebarWrapper";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { PrintPreview } from "@/components/pos/PrintPreview";
import { useStoreDetailsStore } from "@/store/storeDetails.store";
import { useLoadingStore } from "@/store/loading.store";
import { Loader2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sidebar state for desktop collapse
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Mobile overlay open state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { fetchActiveStore } = useStoreDetailsStore();
  const { isLoading: isGlobalLoading } = useLoadingStore();

  useEffect(() => {
    fetchActiveStore();
  }, [fetchActiveStore]);

  const toggleDesktopSidebar = () => setIsSidebarCollapsed((s) => !s);
  const toggleMobileSidebar = () => setIsMobileSidebarOpen((s) => !s);

  // Controlled widths (fixed sidebar)
  // These classes are applied to the fixed sidebar element
  const desktopSidebarWidthClass = isSidebarCollapsed ? "lg:w-20" : "lg:w-64";
  // Main content left margin must exactly match sidebar width on lg+
  const mainContentMarginClass = isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile hamburger button (top-left) */}
      <div className="fixed top-3 left-3 z-50 lg:hidden">
        <Button
          size="icon"
          variant="outline"
          className="bg-white dark:bg-gray-900 shadow-md"
          onClick={toggleMobileSidebar}
        >
          {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Desktop fixed sidebar: fixed so it does not take space in the flow */}
      <aside
        aria-label="Admin sidebar"
        className={cn(
          "hidden lg:fixed lg:top-0 lg:left-0 lg:h-full lg:flex lg:flex-col lg:overflow-hidden transition-all duration-300 ease-in-out z-40",
          desktopSidebarWidthClass
        )}
      >
        {/* Pass the desktop toggle handler. AdminSidebarWrapper should render collapsed vs expanded UI */}
        <AdminSidebarWrapper isCollapsed={isSidebarCollapsed} onToggle={toggleDesktopSidebar} />
      </aside>

      {/* Mobile sidebar overlay (fixed and covers viewport when open) */}
      {isMobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={toggleMobileSidebar}
            role="button"
            aria-hidden
          />
          <aside
            className={cn(
              "fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out",
              isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <AdminSidebarWrapper isCollapsed={false} onToggle={toggleMobileSidebar} />
          </aside>
        </>
      )}

      {/* Main content — full width but offset on lg using margin-left that matches the fixed sidebar width */}
      <div
        className={cn(
          "min-h-screen transition-all duration-300 ease-in-out",
          // mobile: no margin; desktop: margin to leave space for fixed sidebar
          mainContentMarginClass
        )}
      >
        {/* Page container with vertical scroll if needed */}
        <main className="min-h-screen flex flex-col overflow-y-auto overflow-x-hidden">
          <QueryProvider>{children}</QueryProvider>

          {/* Global loading overlay */}
          {isGlobalLoading && (
            <div className="fixed inset-0 bg-black/10 dark:bg-black/30 z-60 flex items-center justify-center pointer-events-none">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
          )}
        </main>
      </div>

      {/* Print preview (floating) */}
      <PrintPreview />
    </div>
  );
}
