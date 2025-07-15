"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu, GitBranch, LogOut } from "lucide-react";
import type { Branch } from '@/components/branches';
import type { UserProfile } from "@/app/page";
import { auth } from "@/lib/firebase";

interface HeaderProps {
  branches: Branch[];
  selectedBranchId: string | null;
  onBranchChange: (branchId: string) => void;
  userProfile: UserProfile;
}

export function Header({ branches, selectedBranchId, onBranchChange, userProfile }: HeaderProps) {
  
  const handleSignOut = async () => {
      await auth.signOut();
  }

  const roleLabels: Record<string, string> = {
      owner: 'المالك',
      accountant: 'محاسب',
      manager: 'مدير فرع'
  }

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white ml-4">
          نظام محاسبي للمقهى
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
            <Select onValueChange={onBranchChange} value={selectedBranchId || ''} disabled={userProfile.role === 'manager'}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="اختر فرعًا..." />
                </SelectTrigger>
                <SelectContent>
                    {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="text-sm">
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
