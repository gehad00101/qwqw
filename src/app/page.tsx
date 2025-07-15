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
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, query, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Login } from "@/components/login";

type Page = 'dashboard' | 'sales' | 'expenses' | 'inventory' | 'reports' | 'employees' | 'bank' | 'branches';

export type UserRole = 'owner' | 'accountant' | 'manager';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  branchId?: string; // For manager role
}

export default function CafeAccountingSystem() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        } else {
          // Handle case where user exists in Auth but not in Firestore
          setUserProfile(null); 
          toast({ title: "خطأ في الحساب", description: "لم يتم العثور على ملف تعريف المستخدم.", variant: "destructive"});
        }
      } else {
        setUserProfile(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    if (!db || !userProfile) return;

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
        } catch (error) {
           console.error("Error creating default branch: ", error);
        }
      } else {
        const branchesData = snapshot.docs.map(doc => doc.data() as Branch);
        setBranches(branchesData);
        
        if (userProfile.role === 'manager' && userProfile.branchId) {
          setSelectedBranchId(userProfile.branchId);
        } else {
            const storedBranchId = localStorage.getItem('selectedBranchId');
            if (storedBranchId && branchesData.some(b => b.id === storedBranchId)) {
              setSelectedBranchId(storedBranchId);
            } else if (branchesData.length > 0) {
              setSelectedBranchId(branchesData[0].id);
            }
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
  }, [toast, userProfile]);

  useEffect(() => {
    if (selectedBranchId && userProfile?.role !== 'manager') {
      localStorage.setItem('selectedBranchId', selectedBranchId);
    }
  }, [selectedBranchId, userProfile]);

  const renderPage = () => {
    if (!selectedBranchId && activePage !== 'branches') {
       return (
        <div className="text-center p-10">
          <h2 className="text-2xl font-bold">الرجاء تحديد فرع</h2>
          <p className="text-muted-foreground">يجب تحديد فرع لعرض بياناته. يمكنك إدارة الفروع من صفحة الفروع.</p>
        </div>
      );
    }
    
    const readOnly = userProfile?.role === 'accountant';

    switch (activePage) {
      case 'dashboard':
        return <Dashboard branchId={selectedBranchId!} />;
      case 'sales':
        return <Sales branchId={selectedBranchId!} readOnly={readOnly} />;
      case 'expenses':
        return <Expenses branchId={selectedBranchId!} readOnly={readOnly} />;
      case 'inventory':
        return <Inventory branchId={selectedBranchId!} readOnly={readOnly} />;
      case 'reports':
        return <Reports branchId={selectedBranchId!} />;
      case 'employees':
        return <Employees branchId={selectedBranchId!} readOnly={readOnly} />;
      case 'bank':
        return <Bank branchId={selectedBranchId!} readOnly={readOnly} />;
      case 'branches':
        return <Branches readOnly={readOnly}/>;
      default:
        return <Dashboard branchId={selectedBranchId!} />;
    }
  };
  
  if (loadingAuth) {
      return <div className="flex h-screen w-full items-center justify-center">جاري تحميل نظام المحاسبة...</div>
  }

  if (!user || !userProfile) {
      return <Login />;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar activePage={activePage} setActivePage={setActivePage} userRole={userProfile.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          branches={branches} 
          selectedBranchId={selectedBranchId} 
          onBranchChange={setSelectedBranchId}
          userProfile={userProfile}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
