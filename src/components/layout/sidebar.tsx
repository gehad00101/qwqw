
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Warehouse,
  BarChart,
  Coffee,
  Users,
  Landmark,
  GitBranch,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import type { UserRole } from "@/app/page";
import { SidebarNav, type NavItem } from "./sidebar-nav";

type Page = 'dashboard' | 'sales' | 'expenses' | 'inventory' | 'reports' | 'employees' | 'bank' | 'branches' | 'users';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  userRole: UserRole;
}



export function Sidebar({ activePage, setActivePage, userRole }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-800 text-white">
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <Coffee className="h-8 w-8 text-indigo-400" />
        <h1 className="text-2xl font-bold ml-2">مقهى</h1>
      </div>
      <SidebarNav 
        activePage={activePage} 
        setActivePage={setActivePage} 
        userRole={userRole} 
      />
    </aside>
  );
}
