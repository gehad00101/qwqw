"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { AICodeGenerator } from "@/components/ai-code-generator";
import { FunctionSearch } from "@/components/function-search";
import { CodeDisplay } from "@/components/code-display";
import { SavedSnippets } from "@/components/saved-snippets";
import { useSavedSnippets, type SavedSnippet } from "@/hooks/use-saved-snippets";
import { ACCOUNTING_FUNCTIONS, type AccountingFunction } from "@/lib/functions";
import { Card, CardContent } from "@/components/ui/card";
import { BookCopy } from "lucide-react";

export default function Home() {
  const [selectedSnippet, setSelectedSnippet] = useState<SavedSnippet | null>(null);
  const { savedSnippets, addSnippet, removeSnippet, isSnippetSaved, isLoaded } = useSavedSnippets();

  useEffect(() => {
    if (ACCOUNTING_FUNCTIONS.length > 0) {
      setSelectedSnippet(ACCOUNTING_FUNCTIONS[0]);
    }
  }, []);
  
  const handleSnippetSelect = (snippet: SavedSnippet) => {
    setSelectedSnippet(snippet);
  };

  const handleSaveToggle = (snippetId: string) => {
    if (!selectedSnippet) return;
    if (isSnippetSaved(snippetId)) {
      removeSnippet(snippetId);
    } else {
      addSnippet(selectedSnippet);
    }
  };

  const handleSelectSaved = (snippet: SavedSnippet) => {
      setSelectedSnippet(snippet);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 grid gap-6 md:grid-cols-[380px_1fr]">
        <aside className="flex flex-col gap-6">
          <AICodeGenerator onCodeGenerated={handleSnippetSelect} />
          <FunctionSearch onFunctionSelect={handleSnippetSelect} selectedFunctionId={selectedSnippet?.id} />
          <SavedSnippets 
            snippets={savedSnippets} 
            onSelect={handleSelectSaved} 
            onRemove={removeSnippet}
            selectedSnippetId={selectedSnippet?.id}
            isLoaded={isLoaded}
          />
        </aside>
        <div className="flex flex-col">
            {selectedSnippet ? (
                <CodeDisplay
                    key={selectedSnippet.id}
                    id={selectedSnippet.id}
                    title={selectedSnippet.name}
                    description={selectedSnippet.description}
                    code={selectedSnippet.code}
                    onSaveToggle={() => handleSaveToggle(selectedSnippet.id)}
                    isSaved={isSnippetSaved(selectedSnippet.id)}
                />
            ) : (
                <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center text-muted-foreground pt-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-12 w-12 mb-4 text-primary"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2"/><path d="M10 2v2"/><path d="M14 2v2"/></svg>
                        <h2 className="text-xl font-semibold">أهلاً بك في كتاب أكواد القهوة</h2>
                        <p>اختر وصفة أو قم بإنشاء كود جديد للبدء.</p>
                    </CardContent>
                </Card>
            )}
        </div>
      </main>
    </div>
  );
}
