
"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { askFinancialAssistant } from "@/ai/flows/financial-assistant-flow";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface FinancialAssistantProps {
  branchId: string;
}

export function FinancialAssistant({ branchId }: FinancialAssistantProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom when a new message is added
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
             viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !branchId) return;

    const userMessage: Message = { id: uuidv4(), role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await askFinancialAssistant({ question: input, branchId });
      const assistantMessage: Message = { id: uuidv4(), role: "assistant", content: result.answer };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error asking financial assistant:", error);
      toast({
        title: "خطأ في الاتصال بالمساعد",
        description: "حدث خطأ أثناء محاولة الحصول على إجابة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
       const assistantErrorMessage: Message = { id: uuidv4(), role: "assistant", content: "عذراً، أواجه مشكلة فنية حالياً. لا يمكنني الرد على سؤالك." };
       setMessages(prev => [...prev, assistantErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary"/>
            المساعد المالي الذكي
        </CardTitle>
        <CardDescription>اسأل عن بياناتك المالية باللغة الطبيعية. مثال: "ما هو إجمالي مبيعاتي هذا الشهر؟"</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                    <Bot className="mx-auto h-12 w-12 mb-4" />
                    <p>مرحباً بك! أنا مساعدك المالي.</p>
                    <p>يمكنك سؤالي عن أي شيء يتعلق ببياناتك.</p>
                </div>
            )}
            {messages.map(message => (
              <div key={message.id} className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && (
                    <div className="bg-primary text-primary-foreground rounded-full p-2">
                        <Bot className="h-5 w-5" />
                    </div>
                )}
                <div className={`rounded-lg px-4 py-2 max-w-[80%] ${message.role === "user" ? "bg-muted text-foreground" : "bg-card border"}`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                 {message.role === "user" && (
                    <div className="bg-secondary text-secondary-foreground rounded-full p-2">
                        <User className="h-5 w-5" />
                    </div>
                 )}
              </div>
            ))}
             {isLoading && (
                 <div className="flex items-start gap-3 justify-start">
                    <div className="bg-primary text-primary-foreground rounded-full p-2">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div className="rounded-lg px-4 py-2 max-w-[80%] bg-card border flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                 </div>
             )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-4 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب سؤالك هنا..."
            disabled={isLoading || !branchId}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim() || !branchId}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
