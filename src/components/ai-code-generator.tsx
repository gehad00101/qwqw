"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2 } from "lucide-react";
import { generateCodeSnippet } from "@/ai/flows/generate-code-snippet";
import { useToast } from "@/hooks/use-toast";
import type { SavedSnippet } from "@/hooks/use-saved-snippets";

interface AICodeGeneratorProps {
    onCodeGenerated: (snippet: SavedSnippet) => void;
}

export function AICodeGenerator({ onCodeGenerated }: AICodeGeneratorProps) {
    const [taskDescription, setTaskDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskDescription.trim()) {
            toast({
                title: "خطأ",
                description: "الرجاء إدخال وصف للمهمة.",
                variant: "destructive",
            });
            return;
        }
        setIsLoading(true);
        try {
            const result = await generateCodeSnippet({ taskDescription });
            onCodeGenerated({
                id: `ai-${Date.now()}`,
                name: `AI: ${taskDescription.substring(0, 20)}...`,
                description: `كود تم إنشاؤه بواسطة الذكاء الاصطناعي لـ: "${taskDescription}"`,
                code: result.codeSnippet,
            });
            setTaskDescription("");
        } catch (error) {
            console.error(error);
            toast({
                title: "خطأ",
                description: "فشل في إنشاء الكود. الرجاء المحاولة مرة أخرى.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>مولّد الأكواد بالذكاء الاصطناعي</CardTitle>
                <CardDescription>صف مهمة محاسبية، وسيقوم الذكاء الاصطناعي بإنشاء الكود لك.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                        placeholder="مثال: 'دالة لحساب الإهلاك السنوي للأصول الثابتة'"
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        rows={3}
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading} className="w-full">
                        <Wand2 className="ml-2 h-4 w-4" />
                        {isLoading ? "جاري الإنشاء..." : "أنشئ الكود"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
