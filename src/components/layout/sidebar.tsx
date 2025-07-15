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

type Page = 'dashboard' | 'sales' | 'expenses' | 'inventory' | 'reports' | 'employees' | 'bank' | 'branches' | 'users';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  userRole: UserRole;
}

const navItems = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard, roles: ['owner', 'accountant', 'manager', 'operational_manager'] },
  { id: 'sales', label: 'المبيعات', icon: TrendingUp, roles: ['owner', 'accountant', 'manager', 'operational_manager'] },
  { id: 'expenses', label: 'المصروفات', icon: TrendingDown, roles: ['owner', 'accountant', 'manager', 'operational_manager'] },
  { id: 'inventory', label: 'المخزون', icon: Warehouse, roles: ['owner', 'accountant', 'manager', 'operational_manager'] },
  { id: 'employees', label: 'الموظفين', icon: Users, roles: ['owner', 'accountant', 'manager', 'operational_manager'] },
  { id: 'bank', label: 'البنك', icon: Landmark, roles: ['owner', 'accountant', 'manager', 'operational_manager'] },
  { id: 'reports', label: 'التقارير', icon: BarChart, roles: ['owner', 'accountant', 'operational_manager'] },
  { id: 'branches', label: 'الفروع', icon: GitBranch, roles: ['owner'] },
  { id: 'users', label: 'إدارة المستخدمين', icon: ShieldCheck, roles: ['owner'] },
];

export function Sidebar({ activePage, setActivePage, userRole }: SidebarProps) {
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-800 text-white">
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <Coffee className="h-8 w-8 text-indigo-400" />
        <h1 className="text-2xl font-bold ml-2">مقهى</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {filteredNavItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => setActivePage(item.id as Page)}
            className={cn(
              "w-full justify-start text-base py-6",
              activePage === item.id
                ? "bg-indigo-500 text-white"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            )}
          >
            <item.icon className="mr-3 h-6 w-6" />
            {item.label}
          </Button>
        ))}
      </nav>
    </aside>
  );
}
