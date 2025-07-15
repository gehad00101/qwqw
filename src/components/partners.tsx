
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, deleteDoc, doc } from "firebase/firestore";
import { Trash2 } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  sharePercentage: number;
  timestamp: any;
}

interface PartnersProps {
  readOnly: boolean;
}

export function Partners({ readOnly }: PartnersProps) {
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [share, setShare] = useState("");
  const [totalShare, setTotalShare] = useState(0);

  useEffect(() => {
    if (!db) return;

    const partnersCollectionRef = collection(db, 'partners');
    const q = query(partnersCollectionRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let currentTotalShare = 0;
      const partnersData = snapshot.docs.map(doc => {
        const data = doc.data() as Omit<Partner, 'id'>;
        currentTotalShare += data.sharePercentage;
        return { id: doc.id, ...data };
      }) as Partner[];
      setPartners(partnersData);
      setTotalShare(currentTotalShare);
    }, (error) => {
      console.error("Error fetching partners: ", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل قائمة الشركاء.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const handleAddPartner = async () => {
    const sharePercentage = parseFloat(share);
    if (!name.trim() || isNaN(sharePercentage) || sharePercentage <= 0 || sharePercentage > 100) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال اسم وحصة صالحة (بين 1 و 100).",
        variant: "destructive",
      });
      return;
    }

    if (totalShare + sharePercentage > 100) {
        toast({
            title: "خطأ في الحصص",
            description: `لا يمكن إضافة هذه الحصة. إجمالي الحصص سيتجاوز 100%. المتبقي: ${(100 - totalShare).toFixed(2)}%`,
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);
    try {
      if (!db) throw new Error("Firebase not initialized");
      
      const partnersCollectionRef = collection(db, "partners");
      await addDoc(partnersCollectionRef, {
        name: name.trim(),
        sharePercentage,
        timestamp: serverTimestamp(),
      });

      toast({
        title: "نجاح",
        description: "تمت إضافة الشريك بنجاح!",
      });

      setName("");
      setShare("");

    } catch (error) {
      console.error("Error adding partner: ", error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف.";
      toast({
        title: "خطأ",
        description: `فشل في إضافة الشريك: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "partners", partnerId));
      toast({
        title: "نجاح",
        description: "تم حذف الشريك بنجاح.",
      });
    } catch (error) {
      console.error("Error deleting partner: ", error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الشريك.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>إضافة شريك جديد</CardTitle>
          <CardDescription>أضف شريكًا جديدًا وحدد حصته في رأس المال.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="p-4 bg-gray-100 dark:bg-gray-900/20 rounded-lg text-center">
            <h3 className="text-lg font-medium text-muted-foreground">إجمالي الحصص المسجلة</h3>
            <p className={`text-3xl font-bold ${totalShare > 100 ? 'text-red-500' : 'text-foreground'}`}>
                {totalShare.toFixed(2)}%
            </p>
          </div>
          <div>
            <label htmlFor="partnerName" className="block text-sm font-medium text-muted-foreground mb-1">اسم الشريك</label>
            <Input id="partnerName" type="text" placeholder="مثال: خالد عبدالله" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading || readOnly} />
          </div>
          <div>
            <label htmlFor="partnerShare" className="block text-sm font-medium text-muted-foreground mb-1">نسبة الحصة (%)</label>
            <Input id="partnerShare" type="number" placeholder="50" value={share} onChange={(e) => setShare(e.target.value)} disabled={isLoading || readOnly} />
          </div>
          <Button onClick={handleAddPartner} disabled={isLoading || readOnly} className="w-full">
            {isLoading ? "جاري الإضافة..." : "إضافة شريك"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الشركاء</CardTitle>
          <CardDescription>جميع الشركاء المسجلين وحصصهم.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 h-[450px] overflow-y-auto pr-2">
            {partners.length === 0 ? (
              <p className="text-center text-muted-foreground pt-10">لا يوجد شركاء مسجلين بعد.</p>
            ) : (
              partners.map((partner) => (
                <div key={partner.id} className="p-3 rounded-lg flex justify-between items-center bg-muted">
                  <div>
                    <p className="font-semibold text-primary">{partner.name}</p>
                    <p className="text-sm text-muted-foreground">الحصة: {partner.sharePercentage}%</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeletePartner(partner.id)} disabled={readOnly} aria-label="حذف الشريك">
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
