"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, doc, getDoc, setDoc } from "firebase/firestore";

interface BankTransaction {
  id: string;
  amount: number;
  date: string;
  type: 'deposit' | 'withdrawal';
  description: string;
  timestamp: any;
}

export function Bank() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!db) return;

    // Listener for Bank Balance
    const balanceDocRef = doc(db, 'bank_balance', 'main');
    const unsubscribeBalance = onSnapshot(balanceDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setBalance(docSnap.data().amount);
      } else {
        // Initialize balance if it doesn't exist
        setDoc(balanceDocRef, { amount: 0, lastUpdated: serverTimestamp() });
        setBalance(0);
      }
    });

    // Listener for Bank Transactions
    const transactionsCollectionRef = collection(db, 'bank_transactions');
    const q = query(transactionsCollectionRef, orderBy("timestamp", "desc"));
    const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
      const transData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as BankTransaction[];
      setTransactions(transData);
    }, (error) => {
      console.error("Error fetching bank transactions: ", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المعاملات البنكية.",
        variant: "destructive",
      });
    });

    return () => {
      unsubscribeBalance();
      unsubscribeTransactions();
    };
  }, [toast]);

  const handleTransaction = async (type: 'deposit' | 'withdrawal') => {
    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0 || !date) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال مبلغ وتاريخ صالحين.",
        variant: "destructive",
      });
      return;
    }

    if (type === 'withdrawal' && transactionAmount > balance) {
        toast({
            title: "خطأ",
            description: "الرصيد غير كافٍ لإتمام عملية السحب.",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);
    try {
      if (!db) throw new Error("Firebase not initialized");
      
      // Add transaction record
      const transactionsCollectionRef = collection(db, "bank_transactions");
      await addDoc(transactionsCollectionRef, {
        amount: transactionAmount,
        date: date,
        description: description,
        type: type,
        timestamp: serverTimestamp(),
      });

      // Update balance
      const balanceDocRef = doc(db, 'bank_balance', 'main');
      const newBalance = type === 'deposit' ? balance + transactionAmount : balance - transactionAmount;
      await setDoc(balanceDocRef, { amount: newBalance, lastUpdated: serverTimestamp() });
      
      toast({
        title: "نجاح",
        description: `تمت عملية ${type === 'deposit' ? 'الإيداع' : 'السحب'} بنجاح!`,
      });

      // Reset form
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);

    } catch (error) {
      console.error(`Error with ${type}: `, error);
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
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>إدارة الحساب البنكي</CardTitle>
          <CardDescription>إيداع أو سحب الأموال من الحساب البنكي.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg text-center">
            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-300">الرصيد الحالي</h3>
            <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-200">{balance.toFixed(2)} ريال</p>
          </div>
           <div>
            <label htmlFor="bankAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ</label>
            <Input
              id="bankAmount"
              type="number"
              placeholder="1000.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="bankDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ</label>
            <Input
              id="bankDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="bankDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (اختياري)</label>
            <Textarea
              id="bankDescription"
              placeholder="وصف مختصر للمعاملة"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-4">
            <Button onClick={() => handleTransaction('deposit')} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700">
                {isLoading ? "جاري..." : "إيداع"}
            </Button>
            <Button onClick={() => handleTransaction('withdrawal')} disabled={isLoading} className="w-full" variant="destructive">
                {isLoading ? "جاري..." : "سحب"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل المعاملات البنكية</CardTitle>
          <CardDescription>قائمة بآخر المعاملات البنكية المسجلة.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 h-96 overflow-y-auto pr-2">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground pt-10">لا توجد معاملات مسجلة بعد.</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className={`p-3 rounded-lg flex justify-between items-center ${tx.type === 'deposit' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <div>
                    <p className={`font-semibold ${tx.type === 'deposit' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>{tx.type === 'deposit' ? 'إيداع' : 'سحب'}: {tx.amount.toFixed(2)} ريال</p>
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
