
'use client'

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDoc,
  QuerySnapshot,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast"


interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [editTodo, setEditTodo] = useState<Todo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "todos"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let todosArr: any[] = [];
      querySnapshot.forEach((doc) => {
        todosArr.push({ ...doc.data(), id: doc.id });
      });
      setTodos(todosArr);
    });

    return () => unsubscribe();
  }, []);

  const addTodo = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (input === "") {
      toast({
        title: "Error",
        description: "Please enter a todo.",
      })
      return;
    }
    await addDoc(collection(db, "todos"), {
      text: input,
      completed: false,
    });
    setInput("");
  };

  const toggleComplete = async (todo: Todo) => {
    await updateDoc(doc(db, "todos", todo.id), {
      completed: !todo.completed,
    });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "todos", id));
  };

  const handleEdit = (todo: Todo) => {
    setEditTodo(todo);
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    if (editTodo) {
      await updateDoc(doc(db, 'todos', editTodo.id), {
        text: editTodo.text
      });
      setIsEditing(false);
      setEditTodo(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center pt-10">
      <div className="w-full max-w-2xl px-4">
        <h1 className="text-4xl font-bold mb-6 text-center">Todo List</h1>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <form className="flex gap-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white flex-grow"
              placeholder="Add a new task"
            />
            <Button onClick={addTodo}>Add Todo</Button>
          </form>
          <ul className="mt-6 space-y-3">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className={`flex items-center justify-between p-4 rounded-md transition-colors ${
                  todo.completed
                    ? "bg-gray-700 text-gray-400 line-through"
                    : "bg-gray-900"
                }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleComplete(todo)}
                    className="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span>{todo.text}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(todo)}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(todo.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {isEditing && editTodo && (
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Todo</DialogTitle>
              <DialogDescription>
                Make changes to your todo item here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Todo
                </Label>
                <Input
                  id="name"
                  value={editTodo.text}
                  onChange={(e) =>
                    setEditTodo({ ...editTodo, text: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsEditing(false)} variant="outline">Cancel</Button>
              <Button onClick={handleUpdate}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
```
