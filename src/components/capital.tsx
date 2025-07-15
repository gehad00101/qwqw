
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, doc, getDoc, setDoc } from "firebase/firestore";

interface CapitalTransaction {
  id: string;
  amount: number;
  date: string;
  type: 'initial' | 'addition' | 'withdrawal';
  description: string;
  timestamp: any;
}

interface CapitalProps {
  readOnly: boolean;
}

export function Capital({ readOnly }: CapitalProps) {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<CapitalTransaction[]>([]);
  const [totalCapital, setTotalCapital] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<'initial' | 'addition' | 'withdrawal' | "">("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!db) return;

    // Listener for Capital Transactions
    const capitalCollectionRef = collection(db, 'capital_transactions');
    const q = query(capitalCollectionRef, orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let currentTotal = 0;
      const transData = snapshot.docs.map(doc => {
        const data = doc.data() as Omit<CapitalTransaction, 'id'>;
        if (data.type === 'withdrawal') {
          currentTotal -= data.amount;
        } else {
          currentTotal += data.amount;
        }
        return { id: doc.id, ...data };
      }) as CapitalTransaction[];
      setTransactions(transData);
      setTotalCapital(currentTotal);
    }, (error) => {
      console.error("Error fetching capital transactions: ", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل معاملات رأس المال.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const handleTransaction = async () => {
    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0 || !date || !type) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال مبلغ وتاريخ ونوع صالحين.",
        variant: "destructive",
      });
      return;
    }

    if (type === 'withdrawal' && transactionAmount > totalCapital) {
        toast({
            title: "خطأ",
            description: "مبلغ السحب أكبر من إجمالي رأس المال المتاح.",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);
    try {
      if (!db) throw new Error("Firebase not initialized");
      
      const capitalCollectionRef = collection(db, "capital_transactions");
      await addDoc(capitalCollectionRef, {
        amount: transactionAmount,
        date,
        description,
        type,
        timestamp: serverTimestamp(),
      });
      
      toast({
        title: "نجاح",
        description: `تمت العملية بنجاح!`,
      });

      // Reset form
      setAmount("");
      setDescription("");
      setType("");
      setDate(new Date().toISOString().split("T")[0]);

    } catch (error) {
      console.error(`Error with capital transaction: `, error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف.";
      toast({
        title: "خطأ",
        description: `فشلت العملية: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>إدارة رأس المال</CardTitle>
          <CardDescription>تسجيل رأس المال الأولي، الإضافات، والمسحوبات الشخصية.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-center">
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300">إجمالي رأس المال الحالي</h3>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">{totalCapital.toFixed(2)} ريال</p>
          </div>
           <div>
            <label htmlFor="capitalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ</label>
            <Input id="capitalAmount" type="number" placeholder="50000.00" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isLoading || readOnly} />
          </div>
           <div>
             <label htmlFor="capitalType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع المعاملة</label>
             <Select onValueChange={(value) => setType(value as any)} value={type} disabled={isLoading || readOnly}>
                <SelectTrigger id="capitalType"><SelectValue placeholder="اختر نوع المعاملة" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="initial">رأس مال أولي</SelectItem>
                    <SelectItem value="addition">إضافة لرأس المال</SelectItem>
                    <SelectItem value="withdrawal">مسحوبات شخصية</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="capitalDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ</label>
            <Input id="capitalDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isLoading || readOnly} />
          </div>
          <div>
            <label htmlFor="capitalDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (اختياري)</label>
            <Textarea id="capitalDescription" placeholder="وصف مختصر للمعاملة" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading || readOnly} />
          </div>
          <div className="flex gap-4">
            <Button onClick={handleTransaction} disabled={isLoading || readOnly} className="w-full">
                {isLoading ? "جاري..." : "تسجيل المعاملة"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل حركات رأس المال</CardTitle>
          <CardDescription>قائمة بجميع المعاملات المتعلقة برأس المال.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 h-96 overflow-y-auto pr-2">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground pt-10">لا توجد معاملات مسجلة بعد.</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className={`p-3 rounded-lg flex justify-between items-center ${tx.type === 'withdrawal' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                  <div>
                    <p className={`font-semibold ${tx.type === 'withdrawal' ? 'text-red-800 dark:text-red-200' : 'text-green-800 dark:text-green-200'}`}>{tx.type === 'withdrawal' ? 'مسحوبات' : tx.type === 'initial' ? 'رأس مال أولي' : 'إضافة'}: {tx.amount.toFixed(2)} ريال</p>
                    <p className="text-sm text-muted-foreground">{tx.date}</p>
                    {tx.description && <p className="text-xs text-muted-foreground italic">"{tx.description}"</p>}
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
