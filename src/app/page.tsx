"use client";

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Dashboard } from '@/components/dashboard';
import { Sales } from '@/components/sales';
import { Expenses } from '@/components/expenses';
import { Inventory } from '@/components/inventory';
import { Reports } from '@/components/reports';
import { Employees } from '@/components/employees';
import { Bank } from '@/components/bank';
import { Branches, type Branch } from '@/components/branches';
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";

type Page = 'dashboard' | 'sales' | 'expenses' | 'inventory' | 'reports' | 'employees' | 'bank' | 'branches';

export default function CafeAccountingSystem() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;

    const branchesCollectionRef = collection(db, 'branches');
    const q = query(branchesCollectionRef);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // If no branches exist, create a default one.
        try {
          const defaultBranchRef = doc(db, 'branches', 'main_branch');
          await setDoc(defaultBranchRef, {
            id: 'main_branch',
            name: 'الفرع الرئيسي',
            createdAt: serverTimestamp()
          });
          // The listener will pick up the new branch.
        } catch (error) {
           console.error("Error creating default branch: ", error);
        }
      } else {
        const branchesData = snapshot.docs.map(doc => doc.data() as Branch);
        setBranches(branchesData);
        
        const storedBranchId = localStorage.getItem('selectedBranchId');
        if (storedBranchId && branchesData.some(b => b.id === storedBranchId)) {
          setSelectedBranchId(storedBranchId);
        } else if (branchesData.length > 0) {
          setSelectedBranchId(branchesData[0].id);
        }
      }
    }, (error) => {
      console.error("Error fetching branches: ", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل قائمة الفروع.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    if (selectedBranchId) {
      localStorage.setItem('selectedBranchId', selectedBranchId);
    }
  }, [selectedBranchId]);

  const renderPage = () => {
    if (!selectedBranchId && activePage !== 'branches') {
       return (
        <div className="text-center p-10">
          <h2 className="text-2xl font-bold">الرجاء تحديد فرع</h2>
          <p className="text-muted-foreground">يجب تحديد فرع لعرض بياناته. يمكنك إدارة الفروع من صفحة الفروع.</p>
        </div>
      );
    }
    
    switch (activePage) {
      case 'dashboard':
        return <Dashboard branchId={selectedBranchId!} />;
      case 'sales':
        return <Sales branchId={selectedBranchId!} />;
      case 'expenses':
        return <Expenses branchId={selectedBranchId!} />;
      case 'inventory':
        return <Inventory branchId={selectedBranchId!} />;
      case 'reports':
        return <Reports branchId={selectedBranchId!} />;
      case 'employees':
        return <Employees branchId={selectedBranchId!} />;
      case 'bank':
        return <Bank branchId={selectedBranchId!} />;
      case 'branches':
        return <Branches />;
      default:
        return <Dashboard branchId={selectedBranchId!} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          branches={branches} 
          selectedBranchId={selectedBranchId} 
          onBranchChange={setSelectedBranchId}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
