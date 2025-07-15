"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bookmark, Trash2 } from "lucide-react";
import type { SavedSnippet } from "@/hooks/use-saved-snippets";

interface SavedSnippetsProps {
    snippets: SavedSnippet[];
    onSelect: (snippet: SavedSnippet) => void;
    onRemove: (id: string) => void;
    selectedSnippetId?: string;
    isLoaded: boolean;
}

export function SavedSnippets({ snippets, onSelect, onRemove, selectedSnippetId, isLoaded }: SavedSnippetsProps) {
    if (!isLoaded) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>كتابي للوصفات</CardTitle>
                    <CardDescription>جاري تحميل الوصفات المحفوظة...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-32 animate-pulse bg-muted rounded-md" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>كتابي للوصفات</CardTitle>
                <CardDescription>وصفات القهوة المحفوظة.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-48">
                    {snippets.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            <p>لم يتم حفظ أي وصفات بعد.</p>
                            <p className="text-xs">انقر على أيقونة الإشارة المرجعية لحفظ واحدة.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 pl-2">
                            {snippets.map(snippet => (
                                <div key={snippet.id} className="flex items-center gap-2">
                                    <Button
                                        variant={selectedSnippetId === snippet.id ? "secondary" : "ghost"}
                                        className="w-full justify-start h-auto py-2 text-right"
                                        onClick={() => onSelect(snippet)}
                                    >
                                        <Bookmark className="ml-3 h-4 w-4 flex-shrink-0" />
                                        <span className="flex-grow truncate text-sm">{snippet.name}</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 flex-shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemove(snippet.id);
                                        }}
                                        aria-label="إزالة الوصفة"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
