"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, deleteDoc, doc, setDoc } from "firebase/firestore";

export interface Branch {
  id: string;
  name: string;
  createdAt: any;
}

export function Branches() {
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!db) return;

    const branchesCollectionRef = collection(db, 'branches');
    const q = query(branchesCollectionRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const branchesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Branch[];
      setBranches(branchesData);
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

  const handleAddBranch = async () => {
    if (!name.trim()) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال اسم فرع صالح.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (!db) throw new Error("Firebase not initialized");
      const branchId = name.trim().toLowerCase().replace(/\s+/g, '_') + `_${Date.now()}`;
      const branchRef = doc(db, "branches", branchId);
      await setDoc(branchRef, {
        id: branchId,
        name: name.trim(),
        createdAt: serverTimestamp(),
      });

      toast({
        title: "نجاح",
        description: "تمت إضافة الفرع بنجاح!",
      });

      setName("");

    } catch (error) {
      console.error("Error adding branch: ", error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف.";
      toast({
        title: "خطأ",
        description: `فشل في إضافة الفرع: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteBranch = async (branchId: string) => {
    // Basic check to prevent deleting the last branch, more complex logic might be needed
    if (branches.length <= 1) {
        toast({
            title: "لا يمكن الحذف",
            description: "يجب أن يكون هناك فرع واحد على الأقل.",
            variant: "destructive",
        });
        return;
    }
    
    if (confirm(`هل أنت متأكد من حذف هذا الفرع؟ سيتم حذف جميع البيانات المرتبطة به بشكل دائم (هذه الميزة غير مكتملة بعد).`)) {
      if (!db) return;
      try {
        await deleteDoc(doc(db, "branches", branchId));
         toast({
          title: "نجاح",
          description: "تم حذف الفرع بنجاح.",
        });
      } catch (error) {
         console.error("Error deleting branch: ", error);
        toast({
          title: "خطأ",
          description: "فشل في حذف الفرع.",
          variant: "destructive",
        });
      }
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>إضافة فرع جديد</CardTitle>
          <CardDescription>أضف فرعًا جديدًا لإدارة حساباته بشكل مستقل.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الفرع</label>
            <Input
              id="branchName"
              type="text"
              placeholder="مثال: فرع العليا"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button onClick={handleAddBranch} disabled={isLoading} className="w-full">
            {isLoading ? "جاري الإضافة..." : "إضافة فرع"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الفروع</CardTitle>
          <CardDescription>جميع الفروع المسجلة في النظام.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 h-96 overflow-y-auto pr-2">
            {branches.length === 0 ? (
              <p className="text-center text-muted-foreground pt-10">لا يوجد فروع مسجلة بعد.</p>
            ) : (
              branches.map((branch) => (
                <div key={branch.id} className="p-3 rounded-lg flex justify-between items-center bg-muted">
                  <div>
                    <p className="font-semibold text-primary">{branch.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {branch.id}</p>
                  </div>
                   <Button variant="destructive" size="sm" onClick={() => handleDeleteBranch(branch.id)}>حذف</Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
