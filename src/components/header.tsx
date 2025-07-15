import { BookCopy } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <BookCopy className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold font-headline">CodeBooks</h1>
      </div>
    </header>
  );
}
