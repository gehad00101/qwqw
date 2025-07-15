
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, deleteDoc, doc } from "firebase/firestore";
import { Trash2 } from "lucide-react";

interface CostItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  description: string;
  timestamp: any;
}

interface ProjectCostProps {
  readOnly: boolean;
}

export function ProjectCost({ readOnly }: ProjectCostProps) {
  const { toast } = useToast();
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!db) return;

    const costsCollectionRef = collection(db, 'project_costs');
    const q = query(costsCollectionRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let currentTotal = 0;
      const costsData = snapshot.docs.map(doc => {
        const data = doc.data() as Omit<CostItem, 'id'>;
        currentTotal += data.amount;
        return { id: doc.id, ...data };
      }) as CostItem[];
      setCosts(costsData);
      setTotalCost(currentTotal);
    }, (error) => {
      console.error("Error fetching project costs: ", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل تكاليف المشروع.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const handleAddCost = async () => {
    const costAmount = parseFloat(amount);
    if (!name.trim() || isNaN(costAmount) || costAmount <= 0 || !date) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال اسم وتكلفة وتاريخ صالحين.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (!db) throw new Error("Firebase not initialized");
      
      const costsCollectionRef = collection(db, "project_costs");
      await addDoc(costsCollectionRef, {
        name: name.trim(),
        amount: costAmount,
        date,
        description,
        timestamp: serverTimestamp(),
      });

      toast({
        title: "نجاح",
        description: "تمت إضافة بند التكلفة بنجاح!",
      });

      // Reset form
      setName("");
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);

    } catch (error) {
      console.error("Error adding project cost: ", error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف.";
      toast({
        title: "خطأ",
        description: `فشل في إضافة التكلفة: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteCost = async (costId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "project_costs", costId));
      toast({
        title: "نجاح",
        description: "تم حذف بند التكلفة بنجاح.",
      });
    } catch (error) {
      console.error("Error deleting cost: ", error);
      toast({
        title: "خطأ",
        description: "فشل في حذف التكلفة.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>إضافة تكلفة تأسيسية</CardTitle>
          <CardDescription>سجل بنود التكاليف التأسيسية للمشروع (ديكور، معدات، تراخيص، إلخ).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="p-4 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-center">
            <h3 className="text-lg font-medium text-purple-800 dark:text-purple-300">إجمالي تكاليف المشروع</h3>
            <p className="text-3xl font-bold text-purple-900 dark:text-purple-200">{totalCost.toFixed(2)} ريال</p>
          </div>
          <div>
            <label htmlFor="costName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم البند</label>
            <Input id="costName" type="text" placeholder="شراء ماكينة قهوة" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading || readOnly} />
          </div>
          <div>
            <label htmlFor="costAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التكلفة</label>
            <Input id="costAmount" type="number" placeholder="25000" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isLoading || readOnly} />
          </div>
          <div>
            <label htmlFor="costDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ</label>
            <Input id="costDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isLoading || readOnly} />
          </div>
          <div>
            <label htmlFor="costDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (اختياري)</label>
            <Textarea id="costDescription" placeholder="فاتورة رقم 123 من مورد..." value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading || readOnly} />
          </div>
          <Button onClick={handleAddCost} disabled={isLoading || readOnly} className="w-full">
            {isLoading ? "جاري الإضافة..." : "إضافة تكلفة"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة تكاليف المشروع</CardTitle>
          <CardDescription>جميع بنود التكاليف التأسيسية المسجلة.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 h-96 overflow-y-auto pr-2">
            {costs.length === 0 ? (
              <p className="text-center text-muted-foreground pt-10">لا توجد تكاليف مسجلة بعد.</p>
            ) : (
              costs.map((cost) => (
                <div key={cost.id} className="p-3 rounded-lg flex justify-between items-center bg-muted">
                  <div>
                    <p className="font-semibold text-primary">{cost.name}</p>
                    <p className="text-sm text-muted-foreground">التكلفة: {cost.amount.toFixed(2)} ريال</p>
                    <p className="text-xs text-muted-foreground">التاريخ: {cost.date}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCost(cost.id)} disabled={readOnly} aria-label="حذف التكلفة">
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
