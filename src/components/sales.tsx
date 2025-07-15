"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, where } from "firebase/firestore";

interface Sale {
  id: string;
  amount: number;
  date: string;
  description: string;
  timestamp: any;
}

interface SalesProps {
  branchId: string;
  readOnly: boolean;
}

export function Sales({ branchId, readOnly }: SalesProps) {
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!db || !branchId) {
      setSales([]);
      return;
    };

    const salesCollectionRef = collection(db, 'sales');
    const q = query(salesCollectionRef, where("branchId", "==", branchId), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Sale[];
      setSales(salesData);
    }, (error) => {
      console.error("Error fetching sales: ", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل سجل المبيعات.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast, branchId]);

  const handleAddSale = async () => {
    const saleAmount = parseFloat(amount);
    if (isNaN(saleAmount) || saleAmount <= 0 || !date) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال مبلغ وتاريخ صالحين.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (!db) throw new Error("Firebase not initialized");
      const salesCollectionRef = collection(db, "sales");
      await addDoc(salesCollectionRef, {
        amount: saleAmount,
        date: date,
        description: description,
        branchId: branchId,
        timestamp: serverTimestamp(),
      });

      toast({
        title: "نجاح",
        description: "تمت إضافة المبيعة بنجاح!",
      });

      // Reset form
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);

    } catch (error) {
      console.error("Error adding sale: ", error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف.";
      toast({
        title: "خطأ",
        description: `فشل في إضافة المبيعة: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>إدخال مبيعة جديدة</CardTitle>
          <CardDescription>أضف معاملة مبيعات جديدة إلى سجلك للفرع المحدد.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="saleAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ</label>
            <Input
              id="saleAmount"
              type="number"
              placeholder="150.75"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading || readOnly}
            />
          </div>
          <div>
            <label htmlFor="saleDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ</label>
            <Input
              id="saleDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isLoading || readOnly}
            />
          </div>
          <div>
            <label htmlFor="saleDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (اختياري)</label>
            <Textarea
              id="saleDescription"
              placeholder="وصف مختصر للمبيعة"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading || readOnly}
            />
          </div>
          <Button onClick={handleAddSale} disabled={isLoading || !branchId || readOnly} className="w-full">
            {isLoading ? "جاري الإضافة..." : "إضافة مبيعة"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل المبيعات</CardTitle>
          <CardDescription>قائمة بآخر المبيعات المسجلة للفرع المحدد.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 h-96 overflow-y-auto pr-2">
            {sales.length === 0 ? (
              <p className="text-center text-muted-foreground pt-10">لا توجد مبيعات مسجلة بعد لهذا الفرع.</p>
            ) : (
              sales.map((sale) => (
                <div key={sale.id} className="p-3 rounded-lg flex justify-between items-center bg-muted">
                  <div>
                    <p className="font-semibold text-primary">{sale.amount.toFixed(2)} ريال</p>
                    <p className="text-sm text-muted-foreground">{sale.date}</p>
                    {sale.description && <p className="text-xs text-muted-foreground italic">"{sale.description}"</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
