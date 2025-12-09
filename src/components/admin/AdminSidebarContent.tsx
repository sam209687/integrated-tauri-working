"use client";

import React, { useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shirt,
  Settings,
  Mail,
  ChartColumnStacked,
  Ruler,
  BadgeIndianRupee,
  Store,
  Box,
  PackageCheckIcon,
  TrendingUpDown,
  Amphora,
  ReceiptIndianRupee,
  UserCircle,
  QrCodeIcon,
  ReceiptText,
  Loader2,
  GiftIcon,
  PrinterCheckIcon,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/themes/ThemeToggle";
import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useNotificationStore } from "@/store/notification.store";
import { useStoreDetailsStore } from "@/store/storeDetails.store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLoadingStore } from "@/store/loading.store";
import { motion, AnimatePresence } from "framer-motion";

interface AdminSidebarContentProps {
  isCollapsed: boolean;
  onCollapseToggle: () => void;
}

export function AdminSidebarContent({
  isCollapsed,
  onCollapseToggle,
}: AdminSidebarContentProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [isPending, startTransition] = useTransition();
  const { setLoading } = useLoadingStore();

  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const { activeStore } = useStoreDetailsStore();

  useEffect(() => {
    setLoading(isPending);
  }, [isPending, setLoading]);

  useEffect(() => {
    if (userId) {
      fetchUnreadCount(userId);
    }
  }, [userId, fetchUnreadCount]);

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Manage Cashiers", href: "/admin/manage-cashiers", icon: Users },
    { name: "Add Brand", href: "/admin/brand", icon: Shirt },
    { name: "Category", href: "/admin/category", icon: ChartColumnStacked },
    { name: "Unit", href: "/admin/unit", icon: Ruler },
    { name: "Oil Expeller Charges", href: "/admin/oec", icon: Amphora },
    { name: "POS", href: "/admin/pos", icon: BadgeIndianRupee },
    { name: "Invoice", href: "/admin/invoice", icon: ReceiptText },
    { name: "Offers", href: "/admin/offers", icon: GiftIcon },
    {
      name: "Messages",
      href: "/admin/messages",
      icon: Mail,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  const user = {
    name: session?.user?.name || "Admin",
    email: session?.user?.email || "admin@pos.com",
    avatar: session?.user?.image || "/admin.png",
  };

  const handleLogout = async () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/auth" });
    });
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col justify-between min-h-screen transition-all duration-500 ease-in-out",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Animated Gradient Background */}
        <motion.div
          className="absolute inset-0 bg-linear-to-b dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950 from-gray-50 via-purple-50/30 to-gray-50"
          animate={{
            background: [
              "linear-gradient(to bottom, rgb(3, 7, 18), rgb(88, 28, 135, 0.2), rgb(3, 7, 18))",
              "linear-gradient(to bottom, rgb(3, 7, 18), rgb(59, 130, 246, 0.2), rgb(3, 7, 18))",
              "linear-gradient(to bottom, rgb(3, 7, 18), rgb(88, 28, 135, 0.2), rgb(3, 7, 18))",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />

        {/* Glass Effect Overlay */}
        <div className="absolute inset-0 backdrop-blur-xl dark:bg-white/5 bg-white/50 border-r dark:border-white/10 border-gray-200" />

        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 bg-linear-to-b from-transparent via-white/10 to-transparent"
          animate={{ y: ["-100%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* === Top Section === */}
          <div className="flex flex-col items-center relative">
            {/* Toggle Button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "absolute top-4 right-2 z-20",
                isCollapsed ? "" : ""
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onCollapseToggle}
                className="h-8 w-8 rounded-xl dark:bg-white/10 bg-gray-200 dark:hover:bg-white/20 hover:bg-gray-300 dark:text-white text-gray-900 shadow-lg backdrop-blur-sm transition-all duration-300"
              >
                <motion.div
                  animate={{ rotate: isCollapsed ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.div>
              </Button>
            </motion.div>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "flex items-center justify-center w-full border-b dark:border-white/10 border-gray-200 pb-4 pt-14 transition-all duration-300",
                isCollapsed ? "px-2" : "px-4"
              )}
            >
              {activeStore?.logo ? (
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Image
                    src={activeStore.logo}
                    alt="Store Logo"
                    width={isCollapsed ? 48 : 120}
                    height={48}
                    className="object-contain transition-all duration-500"
                  />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="p-3 rounded-2xl bg-linear-to-br from-purple-500 to-blue-500"
                >
                  <Settings className="h-8 w-8 text-white" />
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* === Navigation Section === */}
          <nav className="flex-1 w-full overflow-y-auto mt-4 space-y-1 px-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent">
            <AnimatePresence>
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                const link = (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                        isActive
                          ? "bg-linear-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50"
                          : "dark:text-gray-300 text-gray-700 dark:hover:bg-white/10 hover:bg-gray-200",
                        isCollapsed ? "justify-center" : ""
                      )}
                    >
                      {/* Hover effect */}
                      {!isActive && (
                        <motion.div
                          className="absolute inset-0 bg-linear-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          initial={false}
                        />
                      )}
                      
                      <motion.div
                        animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <item.icon className="h-5 w-5 shrink-0 relative z-10" />
                      </motion.div>
                      
                      {!isCollapsed && (
                        <span className="flex-1 flex justify-between items-center relative z-10">
                          {item.name}
                          {item.badge && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-linear-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center shadow-lg"
                            >
                              <motion.span
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                {item.badge}
                              </motion.span>
                            </motion.span>
                          )}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                );

                return isCollapsed ? (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="dark:bg-gray-900 bg-white dark:border-white/20 border-gray-200 backdrop-blur-xl">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  link
                );
              })}
            </AnimatePresence>

            {/* === Dropdowns === */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "w-full flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 group",
                      "dark:text-gray-300 text-gray-700 dark:hover:bg-white/10 hover:bg-gray-200",
                      isCollapsed ? "justify-center" : ""
                    )}
                  >
                    <Box className="h-5 w-5" />
                    {!isCollapsed && <span className="ml-3">Products</span>}
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 dark:bg-gray-900/95 bg-white/95 backdrop-blur-xl dark:text-gray-200 text-gray-900 dark:border-white/20 border-gray-200 shadow-2xl rounded-2xl"
                  side="right"
                >
                  <DropdownMenuItem asChild>
                    <Link href="/admin/products" className="flex items-center cursor-pointer">
                      <Store className="mr-2 h-4 w-4" /> Products
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/variants" className="flex items-center cursor-pointer">
                      <TrendingUpDown className="mr-2 h-4 w-4" /> Create Variant
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/batch" className="flex items-center cursor-pointer">
                      <Box className="mr-2 h-4 w-4" /> Generate Batch
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/packingProds" className="flex items-center cursor-pointer">
                      <PackageCheckIcon className="mr-2 h-4 w-4" /> Packing Materials
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "w-full flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 group",
                      "dark:text-gray-300 text-gray-700 dark:hover:bg-white/10 hover:bg-gray-200",
                      isCollapsed ? "justify-center" : ""
                    )}
                  >
                    <Settings className="h-5 w-5" />
                    {!isCollapsed && <span className="ml-3">Settings</span>}
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 dark:bg-gray-900/95 bg-white/95 backdrop-blur-xl dark:text-gray-200 text-gray-900 dark:border-white/20 border-gray-200 shadow-2xl rounded-2xl"
                  side="right"
                >
                  <DropdownMenuItem asChild>
                    <Link href="/admin/tax" className="flex items-center cursor-pointer">
                      <ReceiptIndianRupee className="mr-2 h-4 w-4" /> Tax
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/store-settings" className="flex items-center cursor-pointer">
                      <Store className="mr-2 h-4 w-4" /> Store Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/currency" className="flex items-center cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" /> Currency
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/telegram" className="flex items-center cursor-pointer">
                      <QrCodeIcon className="mr-2 h-4 w-4" /> Telegram QR Code
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/printer-settings" className="flex items-center cursor-pointer">
                      <PrinterCheckIcon className="mr-2 h-4 w-4" /> Printer Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </nav>

          {/* === Footer === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={cn(
              "border-t dark:border-white/10 border-gray-200 px-3 py-4 flex flex-col gap-3 dark:bg-black/20 bg-white/30 backdrop-blur-sm",
              isCollapsed ? "items-center" : ""
            )}
          >
            <ThemeToggle />
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full flex items-center justify-start rounded-xl px-3 py-2 dark:hover:bg-white/10 hover:bg-gray-200 transition-all duration-300 group",
                  isCollapsed ? "justify-center" : ""
                )}
                onClick={handleLogout}
                disabled={isPending}
              >
                {isPending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className={cn("", isCollapsed ? "" : "mr-3")}
                  >
                    <Loader2 className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <>
                    <Avatar className={cn("h-8 w-8 ring-2 dark:ring-white/20 ring-gray-300", isCollapsed ? "mr-0" : "mr-3")}>
                      <AvatarImage src={user.avatar} alt={user.name || ""} />
                      <AvatarFallback className="bg-linear-to-br from-purple-500 to-blue-500 text-white">
                        {user.name ? user.name.charAt(0) : "A"}
                      </AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium dark:text-white text-gray-900">{user.name}</p>
                        <p className="text-xs dark:text-gray-400 text-gray-500 truncate">{user.email}</p>
                      </div>
                    )}
                    <LogOut className={cn("h-4 w-4 dark:text-gray-400 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity", isCollapsed ? "hidden" : "")} />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-linear-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-8 -left-8 w-32 h-32 bg-linear-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      </aside>
    </TooltipProvider>
  );
}