
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Warehouse,
  BarChart,
  Users,
  Landmark,
  GitBranch,
  ShieldCheck,
} from "lucide-react";
import type { UserRole } from "@/app/page";

type Page = 'dashboard' | 'sales' | 'expenses' | 'inventory' | 'reports' | 'employees' | 'bank' | 'branches' | 'users';

export interface NavItem {
    id: Page;
    label: string;
    icon: React.ElementType;
    roles: UserRole[];
}

const navItems: NavItem[] = [
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


interface SidebarNavProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  userRole: UserRole;
}

export function SidebarNav({ activePage, setActivePage, userRole }: SidebarNavProps) {
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <nav className="flex-1 px-2 py-4 space-y-2">
      {filteredNavItems.map((item) => (
        <Button
          key={item.id}
          variant="ghost"
          onClick={() => setActivePage(item.id)}
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
  );
}
