
"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createUser } from "@/ai/flows/create-user";
import { type Branch } from "@/components/branches";
import type { UserRole } from "@/app/page";
import { Coffee, LogIn } from "lucide-react";

interface LoginProps {
    branches: Branch[];
}


export function Login({ branches }: LoginProps) {
  const [email, setEmail] = useState("n9212993@gmail.com");
  const [password, setPassword] = useState("123456");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<UserRole | ''>('');
  const [branchId, setBranchId] = useState('');


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!auth) throw new Error("Firebase Auth not initialized");
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error(error);
      let errorMessage = "فشل تسجيل الدخول. يرجى التحقق من بريدك الإلكتروني وكلمة المرور.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة."
      }
      toast({
        title: "خطأ في تسجيل الدخول",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password.length < 6) {
        toast({
            title: "خطأ في التسجيل",
            description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }
     if (!role) {
        toast({ title: "خطأ", description: "الرجاء اختيار دور للمستخدم.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

     if (role === 'manager' && !branchId) {
        toast({ title: "خطأ", description: "الرجاء اختيار فرع لمدير الفرع.", variant: "destructive" });
        setIsLoading(false);
        return;
    }


    try {
      const result = await createUser({
          email,
          password,
          role,
          ...(role === 'manager' && { branchId }),
      });
       if (result.success) {
           toast({ title: "نجاح", description: "تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول." });
           setIsRegistering(false); // Switch back to login view
           // Clear password field for security
           setPassword("");
           setRole("");
           setBranchId("");
       } else {
           throw new Error(result.error || "فشل إنشاء المستخدم.");
       }
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
      toast({
        title: "خطأ في التسجيل",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const formAction = isRegistering ? handleRegister : handleLogin;
  const title = isRegistering ? "إنشاء حساب جديد" : "مرحباً بعودتك";
  const description = isRegistering ? "املأ بياناتك لإنشاء حساب جديد في النظام." : "أدخل بياناتك للوصول إلى لوحة التحكم.";
  const buttonText = isRegistering ? "إنشاء الحساب" : "تسجيل الدخول";
  const toggleText = isRegistering ? "لديك حساب؟ سجل الدخول" : "ليس لديك حساب؟ أنشئ واحداً";


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-xl border-gray-200 dark:border-gray-800">
        <CardHeader className="text-center p-6">
            <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full mb-4 w-fit">
               <Coffee className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">{title}</CardTitle>
             <CardDescription className="pt-2 text-base">
                {description}
            </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form onSubmit={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {isRegistering && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="role">الدور</Label>
                        <Select onValueChange={(value) => setRole(value as UserRole)} value={role} disabled={isLoading}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="اختر دور المستخدم" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="owner">المالك</SelectItem>
                                <SelectItem value="accountant">محاسب</SelectItem>
                                <SelectItem value="manager">مدير فرع</SelectItem>
                                <SelectItem value="operational_manager">مدير تشغيلي</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {role === 'manager' && (
                        <div className="space-y-2">
                             <Label htmlFor="branch">الفرع</Label>
                            <Select onValueChange={setBranchId} value={branchId} disabled={isLoading}>
                                <SelectTrigger id="branch">
                                    <SelectValue placeholder="اختر فرع المدير" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(branch => (
                                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </>
            )}
             <Button className="w-full text-lg font-semibold" size="lg" type="submit" disabled={isLoading}>
              {isLoading ? "جاري..." : buttonText}
              {!isLoading && <LogIn className="mr-2 h-5 w-5"/>}
            </Button>
          </form>
           <div className="mt-6 text-center">
            <Button variant="link" onClick={() => setIsRegistering(!isRegistering)} className="text-primary">
              {toggleText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
