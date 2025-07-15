
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
import { UsersManagement } from '@/components/users-management';
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, query, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Login } from "@/components/login";

type Page = 'dashboard' | 'sales' | 'expenses' | 'inventory' | 'reports' | 'employees' | 'bank' | 'branches' | 'users';

export type UserRole = 'owner' | 'accountant' | 'manager' | 'operational_manager';

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
  // We will now use a default owner profile to bypass login
  const [userProfile, setUserProfile] = useState<UserProfile>({
    uid: 'default-owner-id',
    email: 'n9212993@gmail.com',
    role: 'owner',
  });

  useEffect(() => {
    // We can remove the auth listener for now, as we are bypassing login.
    // If you want to re-enable login, you can uncomment this section.
    /*
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const profile = userDocSnap.data() as UserProfile;
          setUserProfile(profile);
          if(profile.role === 'manager' && (activePage === 'reports' || activePage === 'branches' || activePage === 'users')){
              setActivePage('dashboard');
          }
        } else {
          if (currentUser.email === 'n9212993@gmail.com' && !userDocSnap.exists()) {
              const ownerProfile: UserProfile = {
                uid: currentUser.uid,
                email: currentUser.email!,
                role: 'owner'
              };
              await setDoc(userDocRef, ownerProfile);
              setUserProfile(ownerProfile);
          } else {
              console.warn(`Unauthorized login attempt by: ${currentUser.email}`);
              setUserProfile(null);
          }
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
    */
  }, [toast, activePage]);

  useEffect(() => {
    if (!db || !userProfile) return;

    const branchesCollectionRef = collection(db, 'branches');
    const q = query(branchesCollectionRef);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        if (userProfile.role === 'owner') {
          try {
            const defaultBranchRef = doc(db, 'branches', 'main_branch');
            const defaultBranchSnap = await getDoc(defaultBranchRef);
            if (!defaultBranchSnap.exists()) {
              await setDoc(defaultBranchRef, {
                id: 'main_branch',
                name: 'الفرع الرئيسي',
                createdAt: serverTimestamp()
              });
            }
          } catch (error) {
             console.error("Error creating default branch: ", error);
          }
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
    if (!selectedBranchId && userProfile?.role !== 'owner' && !['branches', 'users'].includes(activePage)) {
       return (
        <div className="text-center p-10">
          <h2 className="text-2xl font-bold">لم يتم تعيين فرع</h2>
          <p className="text-muted-foreground">الرجاء التواصل مع مالك النظام لتعيينك إلى فرع.</p>
        </div>
      );
    }

    if (!selectedBranchId && userProfile?.role === 'owner' && !['branches', 'users'].includes(activePage)) {
       return (
        <div className="text-center p-10">
          <h2 className="text-2xl font-bold">مرحباً بك!</h2>
          <p className="text-muted-foreground">يبدو أنه لا يوجد فروع بعد. اذهب إلى صفحة 'الفروع' لإنشاء فرعك الأول.</p>
        </div>
      );
    }
    
    const readOnly = userProfile?.role === 'accountant';
    const isManager = userProfile?.role === 'manager';
    const isOperationalManager = userProfile?.role === 'operational_manager';

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
        return isManager ? null : <Reports branchId={selectedBranchId!} />;
      case 'employees':
        return <Employees branchId={selectedBranchId!} readOnly={readOnly} />;
      case 'bank':
        return <Bank branchId={selectedBranchId!} readOnly={readOnly} />;
      case 'branches':
        return isManager || isOperationalManager ? null : <Branches readOnly={readOnly || isManager} />;
      case 'users':
        return isManager || readOnly || isOperationalManager ? null : <UsersManagement branches={branches} />;
      default:
        return <Dashboard branchId={selectedBranchId!} />;
    }
  };
  
  // Since we are bypassing login, we no longer need the loading or login screens.
  // if (loadingAuth) {
  //     return <div className="flex h-screen w-full items-center justify-center">جاري تحميل نظام المحاسبة...</div>
  // }
  // if (!userProfile) {
  //     return <Login />;
  // }


  return (
    <div className="flex h-screen bg-background">
      <Sidebar activePage={activePage} setActivePage={setActivePage} userRole={userProfile.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          branches={branches} 
          selectedBranchId={selectedBranchId} 
          onBranchChange={setSelectedBranchId}
          userProfile={userProfile}
          activePage={activePage}
          setActivePage={setActivePage}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
