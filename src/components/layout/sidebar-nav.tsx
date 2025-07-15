
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
  Briefcase,
  Users2,
  Percent,
  FileText
} from "lucide-react";
import type { UserRole } from "@/app/page";

type Page = 'dashboard' | 'sales' | 'expenses' | 'inventory' | 'reports' | 'employees' | 'bank' | 'branches' | 'users' | 'capital' | 'partners' | 'taxes' | 'project_cost';

export interface NavItem {
    id: Page;
    label: string;
    icon: React.ElementType;
    roles: UserRole[];
    isSection?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard, roles: ['owner', 'accountant', 'manager', 'operational_manager'] },
  { isSection: true, label: 'التأسيس', roles: ['owner'], id: 'capital', icon: Users }, // Placeholder
  { id: 'capital', label: 'رأس المال', icon: Briefcase, roles: ['owner'] },
  { id: 'partners', label: 'الشركاء', icon: Users2, roles: ['owner'] },
  { id: 'project_cost', label: 'تكاليف المشروع', icon: FileText, roles: ['owner'] },
  { isSection: true, label: 'التشغيل اليومي', roles: ['owner', 'accountant', 'manager', 'operational_manager'], id: 'sales', icon: Users }, // Placeholder
  { id: 'sales', label: 'المبيعات', icon: TrendingUp, roles: ['owner', 'accountant', 'manager', 'operational_manager'] },
  { id: 'expenses', label: 'المصروفات', icon: TrendingDown, roles: ['owner', 'accountant', 'manager', 'operational_manager'] },
  { id: 'inventory', label: 'المخزون', icon: Warehouse, roles: ['owner', 'accountant', 'manager', 'operational_manager'] },
  { id: 'employees', label: 'الموظفين', icon: Users, roles: ['owner', 'accountant', 'manager', 'operational_manager'] },
  { id: 'bank', label: 'البنك', icon: Landmark, roles: ['owner', 'accountant', 'manager', 'operational_manager'] },
  { isSection: true, label: 'التقارير والإدارة', roles: ['owner', 'accountant', 'operational_manager'], id: 'reports', icon: Users }, // Placeholder
  { id: 'reports', label: 'التقارير', icon: BarChart, roles: ['owner', 'accountant', 'operational_manager'] },
  { id: 'taxes', label: 'الضرائب والزكاة', icon: Percent, roles: ['owner', 'accountant'] },
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
    <nav className="flex-1 px-2 py-4 space-y-1">
      {filteredNavItems.map((item, index) => {
        if (item.isSection) {
            // Do not render section header if it's the first item or if the previous item was also a section
            if (index === 0 || filteredNavItems[index-1].isSection) return null;
            return <p key={`section-${item.id}`} className="px-4 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
        }
        return (
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
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Button>
        )
      })}
    </nav>
  );
}
