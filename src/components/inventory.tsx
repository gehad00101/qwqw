
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, where } from "firebase/firestore";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  timestamp: any;
}

interface InventoryProps {
  branchId: string;
  readOnly: boolean;
}

export function Inventory({ branchId, readOnly }: InventoryProps) {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  useEffect(() => {
    if (!db || !branchId) {
      setInventory([]);
      return;
    }

    const inventoryCollectionRef = collection(db, 'inventory');
    const q = query(inventoryCollectionRef, where("branchId", "==", branchId), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as InventoryItem[];
      setInventory(inventoryData);
    }, (error) => {
      console.error("Error fetching inventory: ", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المخزون.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast, branchId]);

  const handleAddInventory = async () => {
    const itemQuantity = parseInt(quantity);
    const itemUnitCost = parseFloat(unitCost);
    const itemUnitPrice = parseFloat(unitPrice);

    if (!name || isNaN(itemQuantity) || itemQuantity < 0 || isNaN(itemUnitCost) || itemUnitCost < 0 || isNaN(itemUnitPrice) || itemUnitPrice < 0) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال بيانات الصنف بشكل صحيح.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (!db) throw new Error("Firebase not initialized");
      const inventoryCollectionRef = collection(db, "inventory");
      await addDoc(inventoryCollectionRef, {
        name,
        quantity: itemQuantity,
        unitCost: itemUnitCost,
        unitPrice: itemUnitPrice,
        branchId: branchId,
        timestamp: serverTimestamp(),
      });

      toast({
        title: "نجاح",
        description: "تمت إضافة الصنف إلى المخزون بنجاح!",
      });

      // Reset form
      setName("");
      setQuantity("");
      setUnitCost("");
      setUnitPrice("");

    } catch (error) {
      console.error("Error adding inventory item: ", error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف.";
      toast({
        title: "خطأ",
        description: `فشل في إضافة الصنف: ${errorMessage}`,
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
          <CardTitle>إضافة صنف للمخزون</CardTitle>
          <CardDescription>أضف صنفًا جديدًا إلى قائمة مخزون الفرع المحدد.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الصنف</label>
            <Input
              id="itemName"
              type="text"
              placeholder="حبوب بن كولومبية"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading || readOnly}
            />
          </div>
          <div>
            <label htmlFor="itemQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الكمية</label>
            <Input
              id="itemQuantity"
              type="number"
              placeholder="10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={isLoading || readOnly}
            />
          </div>
          <div>
            <label htmlFor="itemUnitCost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تكلفة الوحدة</label>
            <Input
              id="itemUnitCost"
              type="number"
              placeholder="25.50"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              disabled={isLoading || readOnly}
            />
          </div>
           <div>
            <label htmlFor="itemUnitPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سعر بيع الوحدة</label>
            <Input
              id="itemUnitPrice"
              type="number"
              placeholder="50.00"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              disabled={isLoading || readOnly}
            />
          </div>
          <Button onClick={handleAddInventory} disabled={isLoading || !branchId || readOnly} className="w-full">
            {isLoading ? "جاري الإضافة..." : "إضافة صنف"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المخزون</CardTitle>
          <CardDescription>قائمة بجميع الأصناف المتوفرة في مخزون الفرع المحدد.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 h-96 overflow-y-auto pr-2">
            {inventory.length === 0 ? (
              <p className="text-center text-muted-foreground pt-10">لا توجد أصناف في المخزون بعد لهذا الفرع.</p>
            ) : (
              inventory.map((item) => (
                <div key={item.id} className="p-3 rounded-lg flex justify-between items-start bg-muted">
                  <div>
                    <p className="font-semibold text-primary">{item.name}</p>
                    <p className="text-sm text-muted-foreground">الكمية: {item.quantity}</p>
                     <p className="text-xs text-muted-foreground">التكلفة: {item.unitCost.toFixed(2)} | السعر: {item.unitPrice.toFixed(2)}</p>
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
