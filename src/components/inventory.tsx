
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Edit, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


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
  
  // State for adding a new item
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newUnitCost, setNewUnitCost] = useState("");
  const [newUnitPrice, setNewUnitPrice] = useState("");

  // State for editing an item
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemQuantity = parseInt(newQuantity);
    const itemUnitCost = parseFloat(newUnitCost);
    const itemUnitPrice = parseFloat(newUnitPrice);

    if (!newName || isNaN(itemQuantity) || itemQuantity < 0 || isNaN(itemUnitCost) || itemUnitCost < 0 || isNaN(itemUnitPrice) || itemUnitPrice < 0) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال بيانات الصنف بشكل صحيح.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const inventoryCollectionRef = collection(db, "inventory");
      await addDoc(inventoryCollectionRef, {
        name: newName,
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

      setNewName("");
      setNewQuantity("");
      setNewUnitCost("");
      setNewUnitPrice("");

    } catch (error) {
       console.error("Error adding inventory item: ", error);
       toast({ title: "خطأ", description: "فشل في إضافة الصنف.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  }

  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const itemQuantity = parseInt(String(editingItem.quantity));
    const itemUnitCost = parseFloat(String(editingItem.unitCost));
    const itemUnitPrice = parseFloat(String(editingItem.unitPrice));

     if (!editingItem.name || isNaN(itemQuantity) || itemQuantity < 0 || isNaN(itemUnitCost) || itemUnitCost < 0 || isNaN(itemUnitPrice) || itemUnitPrice < 0) {
      toast({ title: "خطأ في الإدخال", description: "الرجاء إدخال بيانات صالحة.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
        const itemDocRef = doc(db, 'inventory', editingItem.id);
        await updateDoc(itemDocRef, {
            name: editingItem.name,
            quantity: itemQuantity,
            unitCost: itemUnitCost,
            unitPrice: itemUnitPrice,
        });
        toast({ title: "نجاح", description: "تم تحديث الصنف بنجاح." });
        setIsEditDialogOpen(false);
        setEditingItem(null);
    } catch(error) {
        console.error("Error updating item:", error);
        toast({ title: "خطأ", description: "فشل تحديث الصنف.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
        await deleteDoc(doc(db, 'inventory', itemId));
        toast({ title: "نجاح", description: "تم حذف الصنف بنجاح."});
    } catch(error) {
        console.error("Error deleting item:", error);
        toast({ title: "خطأ", description: "فشل حذف الصنف.", variant: "destructive" });
    }
  }

  const totalInventoryValue = useMemo(() => {
    return inventory.reduce((total, item) => total + (item.quantity * item.unitCost), 0);
  }, [inventory]);


  return (
    <div className="space-y-6">
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Card>
            <CardHeader>
                <CardTitle>إضافة صنف جديد للمخزون</CardTitle>
                {!readOnly && <CardDescription>أضف صنفًا جديدًا إلى قائمة مخزون الفرع المحدد.</CardDescription>}
            </CardHeader>
            <CardContent>
             {readOnly ? <p className="text-muted-foreground">لا يمكنك إضافة أصناف جديدة في وضع القراءة فقط.</p> : (
                <form onSubmit={handleAddInventory} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-1">
                        <label htmlFor="itemName" className="text-sm font-medium">اسم الصنف</label>
                        <Input id="itemName" placeholder="حبوب بن" value={newName} onChange={(e) => setNewName(e.target.value)} disabled={isLoading} />
                    </div>
                     <div className="space-y-1">
                        <label htmlFor="itemQuantity" className="text-sm font-medium">الكمية</label>
                        <Input id="itemQuantity" type="number" placeholder="10" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} disabled={isLoading} />
                    </div>
                     <div className="space-y-1">
                        <label htmlFor="itemUnitCost" className="text-sm font-medium">تكلفة الوحدة</label>
                        <Input id="itemUnitCost" type="number" placeholder="25.50" value={newUnitCost} onChange={(e) => setNewUnitCost(e.target.value)} disabled={isLoading}/>
                    </div>
                     <div className="space-y-1">
                        <label htmlFor="itemUnitPrice" className="text-sm font-medium">سعر الوحدة</label>
                        <Input id="itemUnitPrice" type="number" placeholder="50.00" value={newUnitPrice} onChange={(e) => setNewUnitPrice(e.target.value)} disabled={isLoading}/>
                    </div>
                    <Button type="submit" disabled={isLoading || !branchId} className="w-full">
                        {isLoading ? "جاري الإضافة..." : "إضافة صنف"}
                    </Button>
                </form>
             )}
            </CardContent>
        </Card>
        
        {editingItem && (
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>تعديل الصنف: {editingItem.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateInventory} className="space-y-4">
                    <div>
                        <label htmlFor="editItemName" className="block text-sm font-medium text-muted-foreground mb-1">اسم الصنف</label>
                        <Input id="editItemName" value={editingItem.name} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} />
                    </div>
                    <div>
                        <label htmlFor="editItemQuantity" className="block text-sm font-medium text-muted-foreground mb-1">الكمية</label>
                        <Input id="editItemQuantity" type="number" value={editingItem.quantity} onChange={(e) => setEditingItem({...editingItem, quantity: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label htmlFor="editItemUnitCost" className="block text-sm font-medium text-muted-foreground mb-1">تكلفة الوحدة</label>
                        <Input id="editItemUnitCost" type="number" value={editingItem.unitCost} onChange={(e) => setEditingItem({...editingItem, unitCost: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label htmlFor="editItemUnitPrice" className="block text-sm font-medium text-muted-foreground mb-1">سعر بيع الوحدة</label>
                        <Input id="editItemUnitPrice" type="number" value={editingItem.unitPrice} onChange={(e) => setEditingItem({...editingItem, unitPrice: Number(e.target.value)})} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                        <Button type="submit" disabled={isLoading}>{isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        )}
       </Dialog>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
             <div>
                <CardTitle>قائمة المخزون</CardTitle>
                <CardDescription>قائمة بجميع الأصناف المتوفرة في مخزون الفرع المحدد.</CardDescription>
             </div>
             <div className="text-left">
                <p className="text-sm font-medium text-muted-foreground">إجمالي قيمة المخزون</p>
                <p className="text-2xl font-bold">{totalInventoryValue.toFixed(2)} ريال</p>
             </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الصنف</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>تكلفة الوحدة</TableHead>
                    <TableHead>سعر البيع</TableHead>
                    <TableHead>إجمالي التكلفة</TableHead>
                    {!readOnly && <TableHead>إجراءات</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={readOnly ? 5 : 6} className="h-24 text-center">
                        لا توجد أصناف في المخزون بعد لهذا الفرع.
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unitCost.toFixed(2)} ريال</TableCell>
                        <TableCell>{item.unitPrice.toFixed(2)} ريال</TableCell>
                        <TableCell className="font-mono">{(item.quantity * item.unitCost).toFixed(2)} ريال</TableCell>
                         {!readOnly && (
                            <TableCell>
                                <div className="flex items-center gap-2">
                                     <Button variant="outline" size="icon" onClick={() => handleEditItem(item)}>
                                        <Edit className="h-4 w-4" />
                                        <span className="sr-only">تعديل</span>
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon">
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">حذف</span>
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            هذا الإجراء سيقوم بحذف الصنف "{item.name}" بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive hover:bg-destructive/90">
                                            نعم، حذف
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                         )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
