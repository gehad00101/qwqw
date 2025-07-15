
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, deleteDoc, doc, where } from "firebase/firestore";

interface Employee {
  id: string;
  name: string;
  role: string;
  timestamp: any;
}

interface EmployeesProps {
  branchId: string;
  readOnly: boolean;
}

export function Employees({ branchId, readOnly }: EmployeesProps) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (!db || !branchId) {
      setEmployees([]);
      return;
    }

    const employeesCollectionRef = collection(db, 'employees');
    const q = query(employeesCollectionRef, where("branchId", "==", branchId), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Employee[];
      setEmployees(employeesData);
    }, (error) => {
      console.error("Error fetching employees: ", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل قائمة الموظفين.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast, branchId]);

  const handleAddEmployee = async () => {
    if (!name || !role) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال اسم الموظف ودوره الوظيفي.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (!db) throw new Error("Firebase not initialized");
      const employeesCollectionRef = collection(db, "employees");
      await addDoc(employeesCollectionRef, {
        name,
        role,
        branchId: branchId,
        timestamp: serverTimestamp(),
      });

      toast({
        title: "نجاح",
        description: "تمت إضافة الموظف بنجاح!",
      });

      // Reset form
      setName("");
      setRole("");

    } catch (error) {
      console.error("Error adding employee: ", error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف.";
      toast({
        title: "خطأ",
        description: `فشل في إضافة الموظف: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteEmployee = async (employeeId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "employees", employeeId));
       toast({
        title: "نجاح",
        description: "تم حذف الموظف بنجاح.",
      });
    } catch (error) {
       console.error("Error deleting employee: ", error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الموظف.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>إضافة موظف جديد</CardTitle>
          <CardDescription>أضف موظفًا جديدًا إلى سجلات الفرع المحدد.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الموظف</label>
            <Input
              id="employeeName"
              type="text"
              placeholder="مثال: أحمد محمد"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading || readOnly}
            />
          </div>
           <div>
            <label htmlFor="employeeRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الدور الوظيفي</label>
            <Select onValueChange={setRole} value={role} disabled={isLoading || readOnly}>
                <SelectTrigger id="employeeRole">
                    <SelectValue placeholder="اختر دور الموظف" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="manager">مدير</SelectItem>
                    <SelectItem value="accountant">محاسب</SelectItem>
                    <SelectItem value="barista">باريستا</SelectItem>
                    <SelectItem value="cashier">كاشير</SelectItem>
                    <SelectItem value="cleaner">عامل نظافة</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddEmployee} disabled={isLoading || !branchId || readOnly} className="w-full">
            {isLoading ? "جاري الإضافة..." : "إضافة موظف"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل الموظفين</CardTitle>
          <CardDescription>قائمة بجميع الموظفين الحاليين في الفرع المحدد.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 h-96 overflow-y-auto pr-2">
            {employees.length === 0 ? (
              <p className="text-center text-muted-foreground pt-10">لا يوجد موظفين مسجلين بعد لهذا الفرع.</p>
            ) : (
              employees.map((employee) => (
                <div key={employee.id} className="p-3 rounded-lg flex justify-between items-center bg-muted">
                  <div>
                    <p className="font-semibold text-primary">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.role}</p>
                  </div>
                   <Button variant="destructive" size="sm" onClick={() => handleDeleteEmployee(employee.id)} disabled={readOnly}>حذف</Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
