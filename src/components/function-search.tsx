"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, Code } from "lucide-react";
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
                <CardTitle>Function Library</CardTitle>
                <CardDescription>Search for common accounting functions.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search functions..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ScrollArea className="h-64">
                    <div className="space-y-2 pr-2">
                        {filteredFunctions.map(func => (
                            <Button
                                key={func.id}
                                variant={selectedFunctionId === func.id ? "secondary" : "ghost"}
                                className="w-full justify-start h-auto py-2"
                                onClick={() => onFunctionSelect(func)}
                            >
                                <Code className="mr-3 h-4 w-4" />
                                <div className="text-left">
                                    <p className="font-semibold text-sm">{func.name}</p>
                                    <p className="text-xs text-muted-foreground">{func.tags.join(', ')}</p>
                                </div>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
