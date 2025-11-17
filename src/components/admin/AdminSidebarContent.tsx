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
  TrendingUpDown,
  Amphora,
  ReceiptIndianRupee,
  UserCircle,
  ReceiptText,
  Loader2,
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
          "relative flex flex-col justify-between min-h-screen border-r border-gray-800/60 bg-linear-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200 transition-all duration-500 ease-in-out shadow-xl",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* === Top Section === */}
        <div className="flex flex-col items-center relative">
          {/* Toggle Button - Always top-right */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapseToggle}
            className={cn(
              "absolute top-4 right-2 h-8 w-8 rounded-full bg-gray-800 hover:bg-primary text-white shadow-md z-10 transition-all duration-300",
              isCollapsed ? "rotate-180" : ""
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
            </svg>
          </Button>

          {/* Logo */}
          <div
            className={cn(
              "flex items-center justify-center w-full border-b border-gray-800/60 pb-4 pt-14 transition-all duration-300",
              isCollapsed ? "px-2" : "px-4"
            )}
          >
            {activeStore?.logo ? (
              <Image
                src={activeStore.logo}
                alt="Store Logo"
                width={isCollapsed ? 48 : 120}
                height={48}
                className="object-contain brightness-125 transition-all duration-500 hover:scale-105"
              />
            ) : (
              <Settings className="h-8 w-8 text-primary" />
            )}
          </div>
        </div>

        {/* === Navigation Section === */}
        <nav className="flex-1 w-full overflow-y-auto mt-4 space-y-1 px-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const link = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "hover:bg-gray-800/70 hover:text-white text-gray-400",
                  isCollapsed ? "justify-center" : ""
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && (
                  <span className="flex-1 flex justify-between items-center">
                    {item.name}
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            );

            return isCollapsed ? (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.name}</TooltipContent>
              </Tooltip>
            ) : (
              link
            );
          })}

          {/* === Dropdowns === */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                  "text-gray-400 hover:bg-gray-800/70 hover:text-white",
                  isCollapsed ? "justify-center" : ""
                )}
              >
                <Box className="h-5 w-5" />
                {!isCollapsed && <span className="ml-3">Products</span>}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 bg-gray-900 text-gray-200 border-gray-700 shadow-lg"
              side="right"
            >
              <DropdownMenuItem asChild>
                <Link href="/admin/products">
                  <Store className="mr-2 h-4 w-4" /> Products
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/variants">
                  <TrendingUpDown className="mr-2 h-4 w-4" /> Create Variant
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/batch">
                  <Box className="mr-2 h-4 w-4" /> Generate Batch
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                  "text-gray-400 hover:bg-gray-800/70 hover:text-white",
                  isCollapsed ? "justify-center" : ""
                )}
              >
                <Settings className="h-5 w-5" />
                {!isCollapsed && <span className="ml-3">Settings</span>}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 bg-gray-900 text-gray-200 border-gray-700 shadow-lg"
              side="right"
            >
              <DropdownMenuItem asChild>
                <Link href="/admin/tax">
                  <ReceiptIndianRupee className="mr-2 h-4 w-4" /> Tax
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/store-settings">
                  <Store className="mr-2 h-4 w-4" /> Store Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/currency">
                  <UserCircle className="mr-2 h-4 w-4" /> Currency
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* === Footer === */}
        <div
          className={cn(
            "border-t border-gray-800/60 px-3 py-4 flex flex-col gap-3 bg-gray-950/80 backdrop-blur-sm",
            isCollapsed ? "items-center" : ""
          )}
        >
          <ThemeToggle />
          <Button
            variant="ghost"
            className={cn(
              "w-full flex items-center justify-start rounded-md px-3 py-2 hover:bg-gray-800/80 transition",
              isCollapsed ? "justify-center" : ""
            )}
            onClick={handleLogout}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2
                className={cn("h-4 w-4 animate-spin", isCollapsed ? "" : "mr-3")}
              />
            ) : (
              <Avatar
                className={cn("h-8 w-8", isCollapsed ? "mr-0" : "mr-3")}
              >
                <AvatarImage src={user.avatar} alt={user.name || ""} />
                <AvatarFallback>
                  {user.name ? user.name.charAt(0) : "A"}
                </AvatarFallback>
              </Avatar>
            )}
            {!isCollapsed && (
              <span>{isPending ? "Signing Out..." : "Logout"}</span>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
