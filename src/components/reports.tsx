"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  amount: number;
  date: string;
  description?: string;
  category?: string;
  type: 'sale' | 'expense';
  timestamp: any;
}

export function Reports() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  useEffect(() => {
    if (!db) return;

    const salesCollectionRef = collection(db, 'sales');
    const qSales = query(salesCollectionRef, orderBy("timestamp", "desc"));
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ type: 'sale', id: doc.id, ...doc.data() } as Transaction));
      setTransactions(prev => [...salesData, ...prev.filter(t => t.type !== 'sale')]);
    }, (error) => {
      console.error("Error fetching sales for reports: ", error);
      toast({ title: "خطأ", description: "فشل في تحميل المبيعات للتقارير.", variant: "destructive" });
    });

    const expensesCollectionRef = collection(db, 'expenses');
    const qExpenses = query(expensesCollectionRef, orderBy("timestamp", "desc"));
    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ type: 'expense', id: doc.id, ...doc.data() } as Transaction));
       setTransactions(prev => [...expensesData, ...prev.filter(t => t.type !== 'expense')]);
    }, (error) => {
      console.error("Error fetching expenses for reports: ", error);
      toast({ title: "خطأ", description: "فشل في تحميل المصروفات للتقارير.", variant: "destructive" });
    });

    return () => {
      unsubscribeSales();
      unsubscribeExpenses();
    };
  }, [toast]);
  
  useEffect(() => {
    const sales = transactions.filter(t => t.type === 'sale');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const currentTotalSales = sales.reduce((sum, item) => sum + item.amount, 0);
    const currentTotalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    setTotalSales(currentTotalSales);
    setTotalExpenses(currentTotalExpenses);
    setNetProfit(currentTotalSales - currentTotalExpenses);
  }, [transactions]);
  
  const sortedTransactions = [...transactions].sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));

  return (
    <div className="space-y-6">
      <Card>
          <CardHeader>
              <CardTitle>الملخص المالي</CardTitle>
              <CardDescription>نظرة عامة على الوضع المالي للمقهى.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
             <div className="p-4 bg-muted rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">إجمالي المبيعات</h3>
                <p className="text-2xl font-bold text-green-500">{totalSales.toFixed(2)} ريال</p>
            </div>
             <div className="p-4 bg-muted rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">إجمالي المصروفات</h3>
                <p className="text-2xl font-bold text-red-500">{totalExpenses.toFixed(2)} ريال</p>
            </div>
             <div className="p-4 bg-muted rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">صافي الربح</h3>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{netProfit.toFixed(2)} ريال</p>
            </div>
          </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>سجل المعاملات</CardTitle>
            <CardDescription>قائمة بكل المعاملات المالية المسجلة.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>النوع</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الفئة/الوصف</TableHead>
                <TableHead className="text-left">المبلغ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">لا توجد معاملات مسجلة بعد.</TableCell>
                </TableRow>
              ) : (
                sortedTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${tx.type === 'sale' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {tx.type === 'sale' ? 'مبيعات' : 'مصروفات'}
                      </span>
                    </TableCell>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell>{tx.type === 'expense' ? tx.category : tx.description || '-'}</TableCell>
                    <TableCell className={`text-left font-mono ${tx.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount.toFixed(2)} ريال
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
    </Card>
    </div>
  );
}
