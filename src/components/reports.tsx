"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, where, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { BarChart, LineChart, PieChart } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, Cell, ResponsiveContainer, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, Bar } from 'recharts';


interface Transaction {
  id: string;
  amount: number;
  date: string;
  description?: string;
  category?: string;
  type: 'sale' | 'expense';
  timestamp: any;
}

interface BankBalance {
    amount: number;
}

interface ReportsProps {
  branchId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7300', '#413ea0'];

export function Reports({ branchId }: ReportsProps) {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankBalance, setBankBalance] = useState(0);

  useEffect(() => {
    if (!db || !branchId) {
      setTransactions([]);
      setBankBalance(0);
      return;
    };

    const salesCollectionRef = collection(db, 'sales');
    const qSales = query(salesCollectionRef, where("branchId", "==", branchId), orderBy("timestamp", "desc"));
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ type: 'sale', id: doc.id, ...doc.data() } as Transaction));
      setTransactions(prev => [...salesData, ...prev.filter(t => t.type !== 'sale')].sort((a, b) => b.timestamp - a.timestamp));
    }, (error) => {
      toast({ title: "خطأ", description: "فشل تحميل المبيعات للتقارير.", variant: "destructive" });
    });

    const expensesCollectionRef = collection(db, 'expenses');
    const qExpenses = query(expensesCollectionRef, where("branchId", "==", branchId), orderBy("timestamp", "desc"));
    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ type: 'expense', id: doc.id, ...doc.data() } as Transaction));
       setTransactions(prev => [...expensesData, ...prev.filter(t => t.type !== 'expense')].sort((a, b) => b.timestamp - a.timestamp));
    }, (error) => {
      toast({ title: "خطأ", description: "فشل تحميل المصروفات للتقارير.", variant: "destructive" });
    });
    
    const balanceDocRef = doc(db, 'bank_balance', branchId);
    const unsubscribeBalance = onSnapshot(balanceDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setBankBalance((docSnap.data() as BankBalance).amount);
      } else {
        setBankBalance(0);
      }
    });

    return () => {
      unsubscribeSales();
      unsubscribeExpenses();
      unsubscribeBalance();
    };
  }, [toast, branchId]);
  
  const { totalSales, totalExpenses, netProfit, monthlyData, expenseCategoryData } = useMemo(() => {
    const sales = transactions.filter(t => t.type === 'sale');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const totalSales = sales.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalSales - totalExpenses;

    const monthlyDataMap = new Map<string, { sales: number; expenses: number }>();
    transactions.forEach(tx => {
        const month = tx.date.substring(0, 7); // "YYYY-MM"
        const current = monthlyDataMap.get(month) || { sales: 0, expenses: 0 };
        if (tx.type === 'sale') {
            current.sales += tx.amount;
        } else {
            current.expenses += tx.amount;
        }
        monthlyDataMap.set(month, current);
    });

    const monthlyData = Array.from(monthlyDataMap.entries())
      .map(([month, data]) => ({ name: month, المبيعات: data.sales, المصروفات: data.expenses }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const expenseCategoryMap = new Map<string, number>();
    expenses.forEach(ex => {
        const category = ex.category || 'غير محدد';
        const currentAmount = expenseCategoryMap.get(category) || 0;
        expenseCategoryMap.set(category, currentAmount + ex.amount);
    });
    
    const expenseCategoryData = Array.from(expenseCategoryMap.entries()).map(([name, value]) => ({ name, value }));
    
    return { totalSales, totalExpenses, netProfit, monthlyData, expenseCategoryData };
  }, [transactions]);
  
  const sortedTransactions = transactions.slice(0, 10); // Display only last 10 transactions

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                <span className="text-green-500">▲</span>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalSales.toFixed(2)} ريال</div>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
                <span className="text-red-500">▼</span>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalExpenses.toFixed(2)} ريال</div>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
                <span className={netProfit >= 0 ? "text-green-500" : "text-red-500"}>=</span>
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{netProfit.toFixed(2)} ريال</div>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">رصيد البنك</CardTitle>
                <span className="text-blue-500">$</span>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{bankBalance.toFixed(2)} ريال</div>
            </CardContent>
         </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>الأداء الشهري</CardTitle>
                <CardDescription>مقارنة بين المبيعات والمصروفات على مدار الأشهر.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[250px] w-full">
                    <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line type="monotone" dataKey="المبيعات" stroke="#22c55e" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="المصروفات" stroke="#ef4444" />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>تحليل المصروفات</CardTitle>
                <CardDescription>توزيع المصروفات حسب الفئة.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                 <ChartContainer config={{}} className="h-[250px] w-full">
                     <PieChart>
                        <RechartsTooltip content={<ChartTooltipContent nameKey="name" />} />
                        <Legend />
                        <Pie data={expenseCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                            {expenseCategoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                 </ChartContainer>
            </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>أحدث المعاملات</CardTitle>
            <CardDescription>قائمة بآخر 10 معاملات مالية مسجلة للفرع المحدد.</CardDescription>
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
                  <TableCell colSpan={4} className="text-center h-24">لا توجد معاملات مسجلة بعد لهذا الفرع.</TableCell>
                </TableRow>
              ) : (
                sortedTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${tx.type === 'sale' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'}`}>
                        {tx.type === 'sale' ? 'مبيعات' : 'مصروفات'}
                      </span>
                    </TableCell>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{tx.type === 'expense' ? tx.category : tx.description || '-'}</TableCell>
                    <TableCell className={`text-left font-mono ${tx.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'sale' ? '+' : '-'} {tx.amount.toFixed(2)} ريال
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

    