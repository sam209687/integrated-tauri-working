// src/components/shared/BaseSidebarUI.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/themes/ThemeToggle";
import { signOut } from "next-auth/react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface BaseSidebarUIProps {
  isCollapsed: boolean;
  onToggle: () => void;
  navItems: NavItem[];
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  logoIcon?: React.ElementType;
}

export function BaseSidebarUI({
  isCollapsed,
  onToggle,
  navItems,
  user,
  logoIcon: LogoIcon = Settings,
}: BaseSidebarUIProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth" });
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-gray-100 dark:bg-gray-900 border-r dark:border-gray-800 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo & Toggle Icon */}
      <div
        className={cn(
          "flex items-center h-16 border-b dark:border-gray-800",
          isCollapsed ? "px-2 justify-center" : "px-4 justify-between" // Adjusted justify-content
        )}
      >
        {/* Toggle Button - Moved inside the header */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="transition-transform duration-200 hover:scale-125" // Hover enlarge animation
        >
          {isCollapsed ? (
            <ChevronRight className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          ) : (
            <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          )}
        </Button>

        {/* Logo/Title */}
        <h1
          className={cn(
            "text-2xl font-bold transition-all duration-300 ease-in-out",
            isCollapsed ? "opacity-0 scale-0 w-0" : "opacity-100 scale-100 w-auto ml-2" // Added ml-2 for spacing
          )}
        >
          <span className="text-blue-600">POS</span>
          <span className="text-green-600">Pro</span>
        </h1>
        {/* Icon (only visible when collapsed) */}
        <LogoIcon
          className={cn(
            "h-8 w-8 text-primary transition-all duration-300 ease-in-out",
            isCollapsed ? "opacity-100 scale-100" : "opacity-0 scale-0"
          )}
        />
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out group",
              pathname === item.href
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 transition-transform duration-200 ease-in-out group-hover:rotate-6",
                isCollapsed ? "mr-0" : "mr-3"
              )}
            />
            <span
              className={cn(
                "transition-all duration-200 ease-in-out origin-left group-hover:scale-105",
                isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
              )}
            >
              {item.name}
            </span>
          </Link>
        ))}
      </nav>

      {/* Bottom Section: Theme Toggle & Logout */}
      <div
        className={cn(
          "px-2 py-4 border-t dark:border-gray-800",
          isCollapsed ? "flex flex-col items-center" : ""
        )}
      >
        {/* Theme Toggle */}
        <div
          className={cn(
            "mb-4 w-full flex items-center",
            isCollapsed ? "justify-center" : "px-3 py-2"
          )}
        >
          <ThemeToggle />
        </div>

        {/* Logout Button with Avatar */}
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center justify-start rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out group",
            isCollapsed ? "justify-center" : ""
          )}
          onClick={handleLogout}
        >
          <Avatar
            className={cn(
              "h-8 w-8 transition-transform duration-200 ease-in-out group-hover:rotate-6",
              isCollapsed ? "mr-0" : "mr-3"
            )}
          >
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "transition-all duration-200 ease-in-out origin-left group-hover:scale-105",
              isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
            )}
          >
            Logout
          </span>
        </Button>
      </div>
    </div>
  );
}