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
                    <CardTitle>My CodeBook</CardTitle>
                    <CardDescription>Loading saved snippets...</CardDescription>
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
                <CardTitle>My CodeBook</CardTitle>
                <CardDescription>Your saved code snippets.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-48">
                    {snippets.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            <p>No snippets saved yet.</p>
                            <p className="text-xs">Click the bookmark icon to save one.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 pr-2">
                            {snippets.map(snippet => (
                                <div key={snippet.id} className="flex items-center gap-2">
                                    <Button
                                        variant={selectedSnippetId === snippet.id ? "secondary" : "ghost"}
                                        className="w-full justify-start h-auto py-2 text-left"
                                        onClick={() => onSelect(snippet)}
                                    >
                                        <Bookmark className="mr-3 h-4 w-4 flex-shrink-0" />
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
                                        aria-label="Remove snippet"
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
