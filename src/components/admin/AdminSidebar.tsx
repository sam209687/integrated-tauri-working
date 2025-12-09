"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminSidebarContent } from "./AdminSidebarContent";
import { motion, AnimatePresence } from "framer-motion";

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ isCollapsed, onToggle }: AdminSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleCollapseToggle = onToggle;
  const handleMobileToggle = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* ===== Mobile Hamburger Button ===== */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-4 left-4 z-50 lg:hidden"
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={handleMobileToggle}
            className="h-12 w-12 rounded-2xl backdrop-blur-xl dark:bg-white/10 bg-white/90 dark:border-white/20 border-gray-200 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
          >
            <AnimatePresence mode="wait">
              {isMobileOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-6 w-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-6 w-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </motion.div>

      {/* ===== Desktop Sidebar ===== */}
      <aside
        className={cn(
          "h-screen hidden lg:block transition-all duration-500 ease-in-out shrink-0 relative overflow-hidden",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <AdminSidebarContent
          isCollapsed={isCollapsed}
          onCollapseToggle={handleCollapseToggle}
        />
      </aside>

      {/* ===== Mobile Sidebar Overlay ===== */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={handleMobileToggle}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full z-50 w-64 overflow-hidden shadow-2xl"
            >
              <AdminSidebarContent
                isCollapsed={false}
                onCollapseToggle={handleMobileToggle}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}