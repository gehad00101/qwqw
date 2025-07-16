
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, where, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, FileDown, FileType } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, Cell, ResponsiveContainer, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart as RechartsLineChart, PieChart as RechartsPieChart } from 'recharts';
import { format, subDays } from "date-fns";
import { ar } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { FinancialAssistant } from "./financial-assistant";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [bankBalance, setBankBalance] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  useEffect(() => {
    if (!db || !branchId) {
      setAllTransactions([]);
      setBankBalance(0);
      return;
    };

    const salesCollectionRef = collection(db, 'sales');
    const qSales = query(salesCollectionRef, where("branchId", "==", branchId));
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ type: 'sale', id: doc.id, ...doc.data() } as Transaction));
      setAllTransactions(prev => [...salesData, ...prev.filter(t => t.type !== 'sale')].sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    }, (error) => {
      toast({ title: "خطأ", description: "فشل تحميل المبيعات للتقارير.", variant: "destructive" });
    });

    const expensesCollectionRef = collection(db, 'expenses');
    const qExpenses = query(expensesCollectionRef, where("branchId", "==", branchId));
    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ type: 'expense', id: doc.id, ...doc.data() } as Transaction));
       setAllTransactions(prev => [...expensesData, ...prev.filter(t => t.type !== 'expense')].sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
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
  
  const filteredTransactions = useMemo(() => {
    if (!dateRange?.from) {
        return allTransactions;
    }
    const fromDate = dateRange.from;
    const toDate = dateRange.to || fromDate; // Use fromDate if to is not selected
    
    return allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= fromDate && txDate <= toDate;
    });
  }, [allTransactions, dateRange]);
  
  const { totalSales, totalExpenses, netProfit, monthlyData, expenseCategoryData } = useMemo(() => {
    const sales = filteredTransactions.filter(t => t.type === 'sale');
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    
    const totalSales = sales.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalSales - totalExpenses;

    const monthlyDataMap = new Map<string, { sales: number; expenses: number }>();
    filteredTransactions.forEach(tx => {
        const month = format(new Date(tx.date), "yyyy-MM");
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
  }, [filteredTransactions]);
  
  const sortedTransactions = filteredTransactions.slice(0, 10);

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ["تقرير ملخص", ""],
      ["الفترة من", dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : 'N/A'],
      ["الفترة إلى", dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : 'N/A'],
      ["", ""],
      ["إجمالي الإيرادات", totalSales],
      ["إجمالي المصروفات", totalExpenses],
      ["صافي الربح", netProfit],
      ["رصيد البنك (الحالي)", bankBalance]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "ملخص التقرير");

    // Transactions Sheet
    const transactionsData = filteredTransactions.map(tx => ({
      "النوع": tx.type === 'sale' ? 'مبيعات' : 'مصروفات',
      "التاريخ": tx.date,
      "الوصف/الفئة": tx.type === 'expense' ? tx.category : tx.description || '-',
      "المبلغ": tx.amount
    }));
    const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(wb, wsTransactions, "جميع المعاملات");

    XLSX.writeFile(wb, `financial_report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  }

  const handleExportPdf = () => {
    const doc = new jsPDF();

    // Add Right-to-Left font support
    doc.addFont('/Cairo-Regular.ttf', 'Cairo', 'normal');
    doc.setFont('Cairo');

    doc.setRTL(true);
    doc.text("تقرير مالي", 105, 10, {align: 'center'});

    const fromDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : 'N/A';
    const toDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : 'N/A';
    doc.setFontSize(12);
    doc.text(`الفترة: من ${fromDate} إلى ${toDate}`, 200, 20, { align: 'right' });

    autoTable(doc, {
      startY: 30,
      head: [['', 'المبلغ']],
      body: [
          [{content: totalSales.toFixed(2)}, {content: 'إجمالي الإيرادات'}],
          [{content: totalExpenses.toFixed(2)}, {content: 'إجمالي المصروفات'}],
          [{content: netProfit.toFixed(2)}, {content: 'صافي الربح'}],
          [{content: bankBalance.toFixed(2)}, {content: 'رصيد البنك الحالي'}],
      ],
      styles: { font: 'Cairo', halign: 'right' },
      headStyles: { halign: 'right' },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['المبلغ', 'الوصف/الفئة', 'التاريخ', 'النوع']],
      body: filteredTransactions.map(tx => [
        tx.amount.toFixed(2),
        tx.type === 'expense' ? tx.category || '-' : tx.description || '-',
        tx.date,
        tx.type === 'sale' ? 'مبيعات' : 'مصروفات',
      ]),
      styles: { font: 'Cairo', halign: 'right' },
      headStyles: { halign: 'right' },
    });

    doc.save(`financial_report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
            <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle>لوحة التقارير</CardTitle>
                    <CardDescription>نظرة شاملة على أداء المقهى المالي للفرع المحدد.</CardDescription>
                </div>
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className="w-full sm:w-[300px] justify-start text-left font-normal"
                            >
                                <CalendarIcon className="ml-2 h-4 w-4" />
                                {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                    {format(dateRange.from, "PPP", {locale: ar})} -{" "}
                                    {format(dateRange.to, "PPP", {locale: ar})}
                                    </>
                                ) : (
                                    format(dateRange.from, "PPP", {locale: ar})
                                )
                                ) : (
                                <span>اختر تاريخًا</span>
                                )}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                                locale={ar}
                            />
                            </PopoverContent>
                        </Popover>
                         <div className="flex gap-2">
                             <Button onClick={handleExportExcel} variant="outline" className="flex-1">
                                <FileType className="h-4 w-4 ml-2" />
                                Excel
                            </Button>
                             <Button onClick={handleExportPdf} variant="outline" className="flex-1">
                                <FileDown className="h-4 w-4 ml-2" />
                                PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
        </Card>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                    <span className="text-green-500">▲</span>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalSales.toFixed(2)} ريال</div>
                    <p className="text-xs text-muted-foreground">خلال الفترة المحددة</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
                    <span className="text-red-500">▼</span>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalExpenses.toFixed(2)} ريال</div>
                    <p className="text-xs text-muted-foreground">خلال الفترة المحددة</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
                    <span className={netProfit >= 0 ? "text-green-500" : "text-red-500"}>=</span>
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{netProfit.toFixed(2)} ريال</div>
                    <p className="text-xs text-muted-foreground">خلال الفترة المحددة</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">رصيد البنك (الحالي)</CardTitle>
                    <span className="text-blue-500">$</span>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{bankBalance.toFixed(2)} ريال</div>
                    <p className="text-xs text-muted-foreground">الرصيد الكلي بغض النظر عن التاريخ</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>الأداء الشهري</CardTitle>
                    <CardDescription>مقارنة بين المبيعات والمصروفات على مدار الأشهر في الفترة المحددة.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[250px] w-full">
                        <ResponsiveContainer>
                            <RechartsLineChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Line type="monotone" dataKey="المبيعات" stroke="#22c55e" activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="المصروفات" stroke="#ef4444" />
                            </RechartsLineChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>تحليل المصروفات</CardTitle>
                    <CardDescription>توزيع المصروفات حسب الفئة في الفترة المحددة.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <ChartContainer config={{}} className="h-[250px] w-full">
                        <ResponsiveContainer>
                            <RechartsPieChart>
                                <RechartsTooltip content={<ChartTooltipContent nameKey="name" />} />
                                <Legend />
                                <Pie data={expenseCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                    {expenseCategoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>أحدث المعاملات</CardTitle>
                <CardDescription>قائمة بآخر 10 معاملات مالية مسجلة ضمن الفترة المحددة.</CardDescription>
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
                    <TableCell colSpan={4} className="text-center h-24">لا توجد معاملات مسجلة في هذه الفترة.</TableCell>
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
      <div className="lg:col-span-1">
        <FinancialAssistant branchId={branchId} />
      </div>
    </div>
  );
}
