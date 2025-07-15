
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, GitBranch, LogOut, Coffee } from "lucide-react";
import type { Branch } from '@/components/branches';
import type { UserProfile, UserRole } from "@/app/page";
import { auth } from "@/lib/firebase";
import { SidebarNav } from "./sidebar-nav";

type Page = 'dashboard' | 'sales' | 'expenses' | 'inventory' | 'reports' | 'employees' | 'bank' | 'branches' | 'users' | 'capital' | 'partners' | 'taxes' | 'project_cost';

interface HeaderProps {
  branches: Branch[];
  selectedBranchId: string | null;
  onBranchChange: (branchId: string) => void;
  userProfile: UserProfile;
  activePage: Page;
  setActivePage: (page: Page) => void;
}

export function Header({ branches, selectedBranchId, onBranchChange, userProfile, activePage, setActivePage }: HeaderProps) {
  const [isSheetOpen, setSheetOpen] = useState(false);

  const handleSignOut = async () => {
      await auth.signOut();
  }

  const roleLabels: Record<UserRole, string> = {
      owner: 'المالك',
      accountant: 'محاسب',
      manager: 'مدير فرع',
      operational_manager: 'مدير تشغيلي'
  }

  const handlePageChange = (page: Page) => {
    setActivePage(page);
    setSheetOpen(false); // Close sheet on navigation
  }

  const showBranchSelector = !['capital', 'partners', 'taxes', 'project_cost'].includes(activePage);


  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        {/* Hamburger Menu for Mobile */}
        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] p-0 bg-gray-800 text-white">
                 <div className="flex items-center justify-center h-20 border-b border-gray-700">
                    <Coffee className="h-8 w-8 text-indigo-400" />
                    <h1 className="text-2xl font-bold ml-2">مقهى</h1>
                 </div>
                 <SidebarNav
                    activePage={activePage}
                    setActivePage={handlePageChange}
                    userRole={userProfile.role}
                 />
            </SheetContent>
          </Sheet>
        </div>
        <h1 className="hidden md:block text-xl font-semibold text-gray-800 dark:text-white ml-4">
          نظام محاسبي للمقهى
        </h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {showBranchSelector && (
          <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-muted-foreground" />
              <Select onValueChange={onBranchChange} value={selectedBranchId || ''} disabled={userProfile.role === 'manager'}>
                  <SelectTrigger className="w-[150px] md:w-[180px]">
                      <SelectValue placeholder="اختر فرعًا..." />
                  </SelectTrigger>
                  <SelectContent>
                      {branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>
        )}
        <div className="hidden md:block text-sm text-right">
            <div className="font-bold">{userProfile.email}</div>
            <div className="text-muted-foreground">{roleLabels[userProfile.role]}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
