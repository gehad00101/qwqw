"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  amount: number;
}

interface DashboardProps {
  branchId: string;
}

export function Dashboard({ branchId }: DashboardProps) {
  const { toast } = useToast();
  const [totalSales, setTotalSales] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  useEffect(() => {
    if (!db || !branchId) return;

    const salesCollectionRef = collection(db, 'sales');
    const qSales = query(salesCollectionRef, where("branchId", "==", branchId));
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      let currentTotalSales = 0;
      snapshot.forEach(doc => {
        currentTotalSales += (doc.data() as Transaction).amount;
      });
      setTotalSales(currentTotalSales);
    }, (error) => {
      console.error("Error fetching sales for dashboard: ", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات المبيعات.",
        variant: "destructive",
      });
    });

    const expensesCollectionRef = collection(db, 'expenses');
    const qExpenses = query(expensesCollectionRef, where("branchId", "==", branchId));
    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      let currentTotalExpenses = 0;
      snapshot.forEach(doc => {
        currentTotalExpenses += (doc.data() as Transaction).amount;
      });
      setTotalExpenses(currentTotalExpenses);
    }, (error) => {
      console.error("Error fetching expenses for dashboard: ", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات المصروفات.",
        variant: "destructive",
      });
    });

    return () => {
      unsubscribeSales();
      unsubscribeExpenses();
    };
  }, [toast, branchId]);

  useEffect(() => {
    setNetProfit(totalSales - totalExpenses);
  }, [totalSales, totalExpenses]);


  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">لوحة التحكم</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales.toFixed(2)} ريال</div>
            <p className="text-xs text-muted-foreground">مجموع كل المبيعات المسجلة للفرع المحدد</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExpenses.toFixed(2)} ريال</div>
            <p className="text-xs text-muted-foreground">مجموع كل المصروفات المسجلة للفرع المحدد</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {netProfit.toFixed(2)} ريال
            </div>
            <p className="text-xs text-muted-foreground">الفرق بين المبيعات والمصروفات للفرع المحدد</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
