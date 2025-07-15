
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, deleteDoc, doc } from "firebase/firestore";
import { Trash2 } from "lucide-react";


interface TaxPayment {
  id: string;
  amount: number;
  date: string;
  type: 'vat' | 'zakat';
  period: string; // e.g., "Q1 2024"
  description: string;
  timestamp: any;
}

interface TaxesProps {
  readOnly: boolean;
}

export function Taxes({ readOnly }: TaxesProps) {
  const { toast } = useToast();
  const [payments, setPayments] = useState<TaxPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<'vat' | 'zakat' | "">("");
  const [period, setPeriod] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!db) return;

    const paymentsCollectionRef = collection(db, 'tax_payments');
    const q = query(paymentsCollectionRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as TaxPayment[];
      setPayments(paymentsData);
    }, (error) => {
      console.error("Error fetching tax payments: ", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل سجل المدفوعات الضريبية.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const handleAddPayment = async () => {
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0 || !date || !type || !period.trim()) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إكمال جميع الحقول المطلوبة بشكل صحيح.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (!db) throw new Error("Firebase not initialized");
      
      const paymentsCollectionRef = collection(db, "tax_payments");
      await addDoc(paymentsCollectionRef, {
        amount: paymentAmount,
        date,
        type,
        period: period.trim(),
        description,
        timestamp: serverTimestamp(),
      });

      toast({
        title: "نجاح",
        description: "تم تسجيل الدفعة بنجاح!",
      });

      // Reset form
      setAmount("");
      setDescription("");
      setType("");
      setPeriod("");
      setDate(new Date().toISOString().split("T")[0]);

    } catch (error) {
      console.error(`Error with tax payment: `, error);
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

  const handleDeletePayment = async (paymentId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "tax_payments", paymentId));
      toast({
        title: "نجاح",
        description: "تم حذف الدفعة بنجاح.",
      });
    } catch (error) {
      console.error("Error deleting payment: ", error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الدفعة.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>تسجيل دفعة ضريبية / زكوية</CardTitle>
          <CardDescription>سجل مدفوعات ضريبة القيمة المضافة (VAT) أو الزكاة.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div>
            <label htmlFor="taxType" className="block text-sm font-medium text-muted-foreground mb-1">نوع الدفعة</label>
            <Select onValueChange={(value) => setType(value as any)} value={type} disabled={isLoading || readOnly}>
                <SelectTrigger id="taxType"><SelectValue placeholder="اختر نوع الدفعة" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="vat">ضريبة القيمة المضافة (VAT)</SelectItem>
                    <SelectItem value="zakat">الزكاة</SelectItem>
                </SelectContent>
            </Select>
          </div>
           <div>
            <label htmlFor="taxAmount" className="block text-sm font-medium text-muted-foreground mb-1">المبلغ المدفوع</label>
            <Input id="taxAmount" type="number" placeholder="1500.00" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isLoading || readOnly} />
          </div>
           <div>
            <label htmlFor="taxPeriod" className="block text-sm font-medium text-muted-foreground mb-1">الفترة (مثال: الربع الأول 2024)</label>
            <Input id="taxPeriod" type="text" placeholder="الربع الأول 2024" value={period} onChange={(e) => setPeriod(e.target.value)} disabled={isLoading || readOnly} />
          </div>
          <div>
            <label htmlFor="taxDate" className="block text-sm font-medium text-muted-foreground mb-1">تاريخ الدفع</label>
            <Input id="taxDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isLoading || readOnly} />
          </div>
          <div>
            <label htmlFor="taxDescription" className="block text-sm font-medium text-muted-foreground mb-1">ملاحظات (اختياري)</label>
            <Textarea id="taxDescription" placeholder="رقم الفاتورة، تفاصيل إضافية..." value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading || readOnly} />
          </div>
          <Button onClick={handleAddPayment} disabled={isLoading || readOnly} className="w-full">
            {isLoading ? "جاري التسجيل..." : "تسجيل الدفعة"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل المدفوعات الضريبية والزكوية</CardTitle>
          <CardDescription>قائمة بجميع الدفعات المسجلة.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 h-[450px] overflow-y-auto pr-2">
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground pt-10">لا توجد دفعات مسجلة بعد.</p>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="p-3 rounded-lg flex justify-between items-center bg-muted">
                  <div>
                    <p className={`font-semibold ${p.type === 'vat' ? 'text-orange-600 dark:text-orange-400' : 'text-teal-600 dark:text-teal-400'}`}>{p.type === 'vat' ? 'ضريبة القيمة المضافة' : 'زكاة'}: {p.amount.toFixed(2)} ريال</p>
                    <p className="text-sm text-muted-foreground">الفترة: {p.period}</p>
                    <p className="text-sm text-muted-foreground">التاريخ: {p.date}</p>
                    {p.description && <p className="text-xs text-muted-foreground italic">"{p.description}"</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeletePayment(p.id)} disabled={readOnly} aria-label="حذف الدفعة">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
