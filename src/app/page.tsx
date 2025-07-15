"use client";

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Dashboard } from '@/components/dashboard';
import { Sales } from '@/components/sales';
import { Expenses } from '@/components/expenses';
import { Inventory } from '@/components/inventory';
import { Reports } from '@/components/reports';
import { Employees } from '@/components/employees';
import { Bank } from '@/components/bank';

type Page = 'dashboard' | 'sales' | 'expenses' | 'inventory' | 'reports' | 'employees' | 'bank';

export default function CafeAccountingSystem() {
  const [activePage, setActivePage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'sales':
        return <Sales />;
      case 'expenses':
        return <Expenses />;
      case 'inventory':
        return <Inventory />;
      case 'reports':
        return <Reports />;
      case 'employees':
        return <Employees />;
      case 'bank':
        return <Bank />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
