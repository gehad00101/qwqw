"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        {/* Mobile Menu Button - Functionality can be added later */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white ml-4">
          نظام محاسبي للمقهى
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        {/* User Info can go here */}
      </div>
    </header>
  );
}
