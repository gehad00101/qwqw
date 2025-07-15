"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createUser } from "@/ai/flows/create-user";
import { type CreateUserInput } from "@/ai/flows/create-user";

export function Login() {
  const [email, setEmail] = useState("n9212993@gmail.com");
  const [password, setPassword] = useState("123456");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);

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

    try {
      const result = await createUser({
          email,
          password,
          role: 'accountant' // Default role for public registration
      });
       if (result.success) {
           toast({ title: "نجاح", description: "تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول." });
           setIsRegistering(false); // Switch back to login view
           // Clear password field for security
           setPassword("");
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
  const title = isRegistering ? "إنشاء حساب جديد" : "تسجيل الدخول";
  const buttonText = isRegistering ? "إنشاء حساب" : "تسجيل الدخول";
  const toggleText = isRegistering ? "لديك حساب بالفعل؟ سجل الدخول" : "ليس لديك حساب؟ أنشئ واحدًا";


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md p-8 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800">
        <CardHeader className="p-0 mb-8 text-center">
            <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-100">{title}</CardTitle>
             <CardDescription className="pt-2">
                {isRegistering ? "أدخل بياناتك لإنشاء حساب جديد في النظام." : "أدخل بياناتك للوصول إلى نظام المحاسبة."}
            </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={formAction} className="space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="mt-1 block w-full px-4 py-2 border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition duration-200"
              />
            </div>
            <div>
              <Label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="أدخل كلمة المرور"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="mt-1 block w-full px-4 py-2 border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition duration-200"
              />
            </div>
             <Button className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-lg font-semibold transition duration-200 transform hover:scale-105" type="submit" disabled={isLoading}>
              {isLoading ? "جاري..." : buttonText}
            </Button>
          </form>
           <div className="mt-6 text-center">
            <Button variant="link" onClick={() => setIsRegistering(!isRegistering)}>
              {toggleText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
