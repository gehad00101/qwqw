"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { ACCOUNTING_FUNCTIONS, type AccountingFunction } from "@/lib/functions";

interface FunctionSearchProps {
    onFunctionSelect: (func: AccountingFunction) => void;
    selectedFunctionId?: string;
}

export function FunctionSearch({ onFunctionSelect, selectedFunctionId }: FunctionSearchProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredFunctions = ACCOUNTING_FUNCTIONS.filter(func =>
        func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        func.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        func.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>مكتبة الوصفات</CardTitle>
                <CardDescription>ابحث عن وصفات القهوة الشائعة.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative mb-4">
                    <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="ابحث عن وصفات..."
                        className="pr-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ScrollArea className="h-64">
                    <div className="space-y-2 pl-2">
                        {filteredFunctions.map(func => (
                            <Button
                                key={func.id}
                                variant={selectedFunctionId === func.id ? "secondary" : "ghost"}
                                className="w-full justify-start h-auto py-2"
                                onClick={() => onFunctionSelect(func)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-3 h-4 w-4"><path d="M10 12.5a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0Z"/><path d="M10 5.5a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0Z"/><path d="M14 18v-3.5a2.5 2.5 0 1 0-5 0V18c0 1.1.9 2 2.5 2s2.5-.9 2.5-2Z"/><path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/></svg>
                                <div className="text-right">
                                    <p className="font-semibold text-sm">{func.name}</p>
                                    <p className="text-xs text-muted-foreground">{func.tags.join('، ')}</p>
                                </div>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
