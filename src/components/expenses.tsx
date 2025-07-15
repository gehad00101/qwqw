"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, where } from "firebase/firestore";

interface Expense {
  id: string;
  amount: number;
  date: string;
  category: string;
  description: string;
  timestamp: any;
}

interface ExpensesProps {
  branchId: string;
  readOnly: boolean;
}

export function Expenses({ branchId, readOnly }: ExpensesProps) {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!db || !branchId) {
      setExpenses([]);
      return;
    }

    const expensesCollectionRef = collection(db, 'expenses');
    const q = query(expensesCollectionRef, where("branchId", "==", branchId), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Expense[];
      setExpenses(expensesData);
    }, (error) => {
      console.error("Error fetching expenses: ", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل سجل المصروفات.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast, branchId]);

  const handleAddExpense = async () => {
    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0 || !date || !category) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال مبلغ وتاريخ وفئة صالحين.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (!db) throw new Error("Firebase not initialized");
      const expensesCollectionRef = collection(db, "expenses");
      await addDoc(expensesCollectionRef, {
        amount: expenseAmount,
        date: date,
        category: category,
        description: description,
        branchId: branchId,
        timestamp: serverTimestamp(),
      });

      toast({
        title: "نجاح",
        description: "تمت إضافة المصروف بنجاح!",
      });

      // Reset form
      setAmount("");
      setDescription("");
      setCategory("");
      setDate(new Date().toISOString().split("T")[0]);

    } catch (error) {
      console.error("Error adding expense: ", error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف.";
      toast({
        title: "خطأ",
        description: `فشل في إضافة المصروف: ${errorMessage}`,
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
          <CardTitle>إدخال مصروف جديد</CardTitle>
          <CardDescription>أضف معاملة مصروفات جديدة إلى سجلك للفرع المحدد.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="expenseAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ</label>
            <Input
              id="expenseAmount"
              type="number"
              placeholder="50.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading || readOnly}
            />
          </div>
          <div>
            <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ</label>
            <Input
              id="expenseDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isLoading || readOnly}
            />
          </div>
           <div>
            <label htmlFor="expenseCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الفئة</label>
            <Select onValueChange={setCategory} value={category} disabled={isLoading || readOnly}>
                <SelectTrigger id="expenseCategory">
                    <SelectValue placeholder="اختر فئة للمصروف" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="إيجار">إيجار</SelectItem>
                    <SelectItem value="رواتب">رواتب</SelectItem>
                    <SelectItem value="مشتريات">مشتريات (مواد خام)</SelectItem>
                    <SelectItem value="فواتير">فواتير (كهرباء، ماء، إنترنت)</SelectItem>
                    <SelectItem value="صيانة">صيانة</SelectItem>
                    <SelectItem value="تسويق">تسويق</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="expenseDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (اختياري)</label>
            <Textarea
              id="expenseDescription"
              placeholder="وصف مختصر للمصروف"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading || readOnly}
            />
          </div>
          <Button onClick={handleAddExpense} disabled={isLoading || !branchId || readOnly} className="w-full">
            {isLoading ? "جاري الإضافة..." : "إضافة مصروف"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل المصروفات</CardTitle>
          <CardDescription>قائمة بآخر المصروفات المسجلة للفرع المحدد.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 h-96 overflow-y-auto pr-2">
            {expenses.length === 0 ? (
              <p className="text-center text-muted-foreground pt-10">لا توجد مصروفات مسجلة بعد لهذا الفرع.</p>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} className="p-3 rounded-lg flex justify-between items-center bg-muted">
                  <div>
                    <p className="font-semibold text-destructive">{expense.amount.toFixed(2)} ريال</p>
                    <p className="text-sm text-muted-foreground">{expense.date} - <span className="font-medium">{expense.category}</span></p>
                    {expense.description && <p className="text-xs text-muted-foreground italic">"{expense.description}"</p>}
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
