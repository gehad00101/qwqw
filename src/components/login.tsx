
"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Coffee, LogIn } from "lucide-react";

export function Login() {
  const [email, setEmail] = useState("n9212993@gmail.com");
  const [password, setPassword] = useState("123456");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
        toast({
            title: "خطأ في الإدخال",
            description: "الرجاء إدخال البريد الإلكتروني وكلمة المرور.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
            title: "نجاح",
            description: "تم تسجيل دخولك بنجاح.",
        });
    } catch (error: any) {
        console.error("Login Error:", error);
        let errorMessage = "فشل تسجيل الدخول. يرجى التحقق من بياناتك.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
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


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-xl border-gray-200 dark:border-gray-800">
        <CardHeader className="text-center p-6">
            <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full mb-4 w-fit">
               <Coffee className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">تسجيل الدخول</CardTitle>
             <CardDescription className="pt-2 text-base">
                أدخل بياناتك للوصول إلى نظام المحاسبة.
            </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleLogin} className="space-y-4">
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
            
             <Button className="w-full text-lg font-semibold" size="lg" type="submit" disabled={isLoading}>
              {isLoading ? "جاري الدخول..." : "تسجيل الدخول"}
              {!isLoading && <LogIn className="mr-2 h-5 w-5"/>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
