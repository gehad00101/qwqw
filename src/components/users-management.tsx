"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import type { Branch } from "./branches";
import type { UserProfile } from "@/app/page";
import { createUser } from "@/ai/flows/create-user";

const userFormSchema = z.object({
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صالح." }),
  password: z.string().min(6, { message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل." }),
  role: z.enum(["accountant", "manager"], { required_error: "الرجاء اختيار دور للمستخدم." }),
  branchId: z.string().optional(),
}).refine(data => data.role !== 'manager' || !!data.branchId, {
  message: "يجب اختيار فرع لمدير الفرع.",
  path: ["branchId"],
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UsersManagementProps {
    branches: Branch[];
}

export function UsersManagement({ branches }: UsersManagementProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const watchRole = form.watch("role");

  useEffect(() => {
    if (!db) return;
    const usersCollectionRef = collection(db, 'users');
    const q = query(usersCollectionRef, orderBy("email"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(usersData);
    }, (error) => {
      console.error("Error fetching users: ", error);
      toast({ title: "خطأ", description: "فشل في تحميل قائمة المستخدمين.", variant: "destructive" });
    });

    return () => unsubscribe();
  }, [toast]);

  const onSubmit = async (data: UserFormValues) => {
    try {
      const result = await createUser(data);
       if (result.success) {
           toast({ title: "نجاح", description: "تم إنشاء المستخدم بنجاح." });
           form.reset();
       } else {
           throw new Error(result.error || "فشل إنشاء المستخدم.");
       }
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
      toast({
        title: "خطأ في إنشاء المستخدم",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  const roleLabels: Record<string, string> = {
      owner: 'المالك',
      accountant: 'محاسب',
      manager: 'مدير فرع'
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>إنشاء مستخدم جديد</CardTitle>
          <CardDescription>أضف مستخدمًا جديدًا (محاسب أو مدير فرع) للنظام.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدور</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر دور المستخدم" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="accountant">محاسب</SelectItem>
                          <SelectItem value="manager">مدير فرع</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {watchRole === 'manager' && (
                <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>الفرع</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                             <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="اختر الفرع للمدير" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {branches.map(branch => (
                                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              )}
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                {form.formState.isSubmitting ? "جاري الإنشاء..." : "إنشاء مستخدم"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
          <CardDescription>جميع المستخدمين المسجلين في النظام.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 h-96 overflow-y-auto pr-2">
            {users.length === 0 ? (
                <p className="text-center text-muted-foreground pt-10">لم يتم إنشاء أي مستخدمين بعد.</p>
            ) : (users.map((user) => (
              <div key={user.uid} className="p-3 rounded-lg flex justify-between items-center bg-muted">
                <div>
                  <p className="font-semibold text-primary">{user.email}</p>
                  <p className="text-sm text-muted-foreground">{roleLabels[user.role]}</p>
                   {user.role === 'manager' && user.branchId && (
                     <p className="text-xs text-muted-foreground">
                        الفرع: {branches.find(b => b.id === user.branchId)?.name || user.branchId}
                    </p>
                   )}
                </div>
              </div>
            )))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
