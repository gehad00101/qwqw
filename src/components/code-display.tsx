"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Bookmark, BookmarkCheck, ClipboardCopy, Check } from "lucide-react";
import { useState, type FC } from 'react';

interface CodeDisplayProps {
  id: string;
  title: string;
  description: string;
  code: string;
  onSaveToggle: (id: string) => void;
  isSaved: boolean;
}

export const CodeDisplay: FC<CodeDisplayProps> = ({ id, title, description, code, onSaveToggle, isSaved }) => {
  const [hasCopied, setHasCopied] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s/g, '_')}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
                <CardTitle className="font-headline">{title}</CardTitle>
                <CardDescription className="pt-2">{description}</CardDescription>
            </div>
            <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={handleDownload} aria-label="Download code">
                    <Download className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onSaveToggle(id)} aria-label={isSaved ? "Remove from book" : "Save to book"}>
                    {isSaved ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col min-h-0">
        <div className="relative bg-muted rounded-md flex-grow">
          <ScrollArea className="absolute inset-0">
            <pre className="p-4 text-sm font-code text-muted-foreground">
                <code>{code}</code>
            </pre>
          </ScrollArea>
          <Button variant="ghost" size="icon" onClick={handleCopy} className="absolute top-2 right-2 h-8 w-8 bg-muted hover:bg-background" aria-label="Copy code">
            {hasCopied ? <Check className="h-4 w-4 text-accent" /> : <ClipboardCopy className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
