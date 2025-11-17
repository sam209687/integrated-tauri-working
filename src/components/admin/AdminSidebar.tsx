"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminSidebarContent } from "./AdminSidebarContent";

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

/**
 * 🪄 Enhanced Admin Sidebar with Gradient & Glass Effect
 * - Adds dark gradient background
 * - Subtle shadows and glow for premium feel
 */
export function AdminSidebar({ isCollapsed, onToggle }: AdminSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleCollapseToggle = onToggle;
  const handleMobileToggle = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* ===== Mobile Hamburger Button ===== */}
      <div className="fixed top-0 left-0 p-3 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={handleMobileToggle}
          className="h-10 w-10 bg-white dark:bg-gray-900 shadow-lg hover:scale-105 transition-transform"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* ===== Desktop Sidebar ===== */}
      <aside
        className={cn(
          "h-screen hidden lg:block transition-all duration-500 ease-in-out shrink-0 relative overflow-hidden",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* ✨ Gradient Glass Effect Background */}
        <div
          className={cn(
            "absolute inset-0 z-0",
            "bg-linear-to-b from-gray-950 via-gray-900 to-gray-800",
            "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_60%)]",
            "before:opacity-70"
          )}
        />

        {/* 💎 Decorative overlay for subtle shine */}
        <div
          className={cn(
            "absolute inset-0 z-0 pointer-events-none backdrop-blur-[6px] border-r border-gray-800/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
          )}
        />

        {/* === Sidebar Content === */}
        <div className="relative z-10">
          <AdminSidebarContent
            isCollapsed={isCollapsed}
            onCollapseToggle={handleCollapseToggle}
          />
        </div>
      </aside>

      {/* ===== Mobile Sidebar Overlay ===== */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={handleMobileToggle}
          />
          <aside
            className={cn(
              "fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out w-64 overflow-hidden"
            )}
          >
            {/* ✨ Mobile uses same gradient background */}
            <div className="absolute inset-0 bg-linear-to-b from-gray-950 via-gray-900 to-gray-800 backdrop-blur-[6px] border-r border-gray-800/60" />
            <div className="relative z-10">
              <AdminSidebarContent
                isCollapsed={false}
                onCollapseToggle={handleMobileToggle}
              />
            </div>
          </aside>
        </>
      )}
    </>
  );
}
