"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Mail,
  ReceiptText,
  Settings,
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/themes/ThemeToggle";
import { signOut, useSession } from "next-auth/react";
import { useNotificationStore } from "@/store/notification.store";
import { useStoreDetailsStore } from "@/store/storeDetails.store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  badge?: number;
};

export interface CashierSidebarContentProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function CashierSidebarContent({
  isCollapsed,
  onToggle,
}: CashierSidebarContentProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const { activeStore } = useStoreDetailsStore();

  useEffect(() => {
    if (userId) fetchUnreadCount(userId);
  }, [userId, fetchUnreadCount]);

  const navItems: NavItem[] = [
    { name: "POS", href: "/cashier/pos", icon: ShoppingCart },
    { name: "Invoice", href: "/cashier/invoice", icon: ReceiptText },
    // { name: "Transactions", href: "/cashier/transactions", icon: ClipboardList },
    {
      name: "Messages",
      href: "/cashier/message",
      icon: Mail,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  const user = {
    name: session?.user?.name || "Cashier",
    email: session?.user?.email || "cashier@pos.com",
    avatar: session?.user?.image || "/cashier.png",
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth" });
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col justify-between min-h-screen border-r border-gray-800/60 bg-linear-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200 transition-all duration-500 ease-in-out shadow-xl",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* === Logo + Toggle Button Section === */}
        <div className="relative flex flex-col items-center border-b border-gray-800/60 pb-4 pt-6">
          {/* Floating Toggle Button (single one) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              "absolute -right-4 top-6 z-10 h-8 w-8 rounded-full bg-gray-700 text-white shadow-md hover:bg-primary transition-all duration-300",
              isCollapsed ? "rotate-180" : ""
            )}
          >
            <svg
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m15 18-6-6 6-6"
              />
            </svg>
          </Button>

          {/* Store Logo */}
          {activeStore?.logo ? (
            <Image
              src={activeStore.logo}
              alt="Store Logo"
              width={isCollapsed ? 48 : 120}
              height={48}
              className="object-contain brightness-125 transition-all duration-500 hover:scale-105 mt-2"
            />
          ) : (
            <Settings className="h-8 w-8 text-primary mt-2" />
          )}
        </div>

        {/* === Navigation === */}
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
          >
            <Avatar className={cn("h-8 w-8", isCollapsed ? "mr-0" : "mr-3")}>
              <AvatarImage src={user.avatar} alt={user.name || ""} />
              <AvatarFallback>
                {user.name ? user.name.charAt(0) : "C"}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
